## Deployment (Vercel + Neon)

This project deploys to Vercel and uses Neon Postgres for persistence.

### 1) Provision Neon

Create a Neon project and copy both connection strings:

- `DATABASE_URL`: pooled connection string (runtime)
- `DIRECT_URL`: direct connection string (Prisma migrations)

### 2) Configure Vercel Environment Variables

Set these in Vercel Project Settings for Production:

```bash
NODE_ENV=production
DATABASE_URL=<pooled_neon_connection_string>
DIRECT_URL=<direct_neon_connection_string>

BUILDER_SUBGRAPH_ETHEREUM_URL=<ethereum_subgraph_url>
BUILDER_SUBGRAPH_BASE_URL=<base_subgraph_url>
BUILDER_SUBGRAPH_OPTIMISM_URL=<optimism_subgraph_url>
BUILDER_SUBGRAPH_ZORA_URL=<zora_subgraph_url>

WARPCAST_BASE_URL=https://api.warpcast.com
WARPCAST_API_KEY=<your_api_key>
WARPCAST_AUTH_TOKEN=<your_auth_token>

CRON_SECRET=<shared_secret>
ENABLE_INVITES=false
```

Optional targeted-test env vars:

```bash
TEST_TARGET_FIDS=
TEST_TARGET_DAO_IDS=
TEST_TARGET_CHAINS=
TEST_DRY_RUN=false
```

### 3) Run Prisma Migrations

Before enabling cron jobs, run migrations against Neon:

```bash
pnpm prisma:migrate
```

### 4) Deploy and Smoke Test

After deployment:

1. Check health endpoint: `GET /api/health`
2. Manually hit one cron endpoint with auth header:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  "https://<your-app-domain>/api/cron/process-proposals?dryRun=true"
```

### 5) Enable Vercel Cron

Cron jobs are defined in `vercel.json`:

- proposals hourly
- propdates hourly
- invites monthly (gated by `ENABLE_INVITES`)
- consume queue every minute
- cleanup daily
