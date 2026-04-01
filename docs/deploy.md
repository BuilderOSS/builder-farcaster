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

NEXT_PUBLIC_GOLDSKY_PROJECT_ID=<optional_goldsky_project_id>
NEXT_PUBLIC_NETWORK_TYPE=<optional_mainnet_or_testnet>

FARCASTER_API_BASE_URL=https://api.farcaster.xyz
FARCASTER_API_KEY=<your_api_key>
FARCASTER_APP_FID=<app_fid>
# Optional (required only for app-key authenticated routes)
FARCASTER_APP_KEY=<ed25519_private_key_hex>
FARCASTER_APP_KEY_PUBLIC=<ed25519_public_key_hex>

CRON_SECRET=<shared_secret>
ENABLE_TESTNET_CHAINS=false
```

Optional targeted-test env vars:

```bash
TEST_TARGET_FIDS=
TEST_TARGET_DAO_IDS=
TEST_TARGET_CHAINS=
TEST_DRY_RUN=false
NO_SEND_NOTIFICATIONS=false
```

`NO_SEND_NOTIFICATIONS` is an optional safety/debug flag. Set it to `true` for no-send mode while validating producers/consumers without sending Farcaster DMs.

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
- consume queue every minute
- cleanup daily

Producer schedules are staggered to reduce overlapping load (`:05` proposals, `:20` propdates).

Testnet chains are excluded in production by default. Set `ENABLE_TESTNET_CHAINS=true` to include them for targeted testing.
