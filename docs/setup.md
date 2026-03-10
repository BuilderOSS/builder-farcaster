## Setup Instructions

### 1) Clone and Install

```bash
gh repo clone BuilderOSS/builder-farcaster
cd builder-farcaster
pnpm install
```

### 2) Configure Local Environment

```bash
cp .env.template .env
```

Fill in at least:

- `NODE_ENV=development`
- `DATABASE_URL` and `DIRECT_URL` (Postgres)
- `WARPCAST_BASE_URL`, `WARPCAST_API_KEY`, `WARPCAST_AUTH_TOKEN`
- `BUILDER_SUBGRAPH_*_URL`
- `CRON_SECRET`

### 3) Initialize Prisma

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

### 4) Build and Run

```bash
pnpm build
pnpm dev:process
pnpm dev:propdates
pnpm dev:consume
```

### 5) Targeted Test Runs (Optional)

Use env vars to scope processing during testing:

- `TEST_TARGET_FIDS=123,456`
- `TEST_TARGET_DAO_IDS=0xabc...,0xdef...`
- `TEST_TARGET_CHAINS=base,optimism`
- `TEST_DRY_RUN=true`
