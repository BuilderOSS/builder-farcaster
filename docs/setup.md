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
- `FARCASTER_API_KEY`
- `FARCASTER_APP_FID`
- `NEXT_PUBLIC_GOLDSKY_PROJECT_ID` (optional)
- `NEXT_PUBLIC_NETWORK_TYPE` (optional: `mainnet` or `testnet`; if unset, @buildeross packages default to mainnet)
- `CRON_SECRET`

Optional for app-key authenticated Farcaster routes:

- `FARCASTER_API_BASE_URL` (defaults to `https://api.farcaster.xyz`)
- `FARCASTER_APP_KEY`, `FARCASTER_APP_KEY_PUBLIC`

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
- `ENABLE_TESTNET_CHAINS=true` (includes testnet chains in runtime queries)
- `NO_SEND_NOTIFICATIONS=true` (consumer logs payloads instead of sending Farcaster DMs)
