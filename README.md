# Builder Farcaster Bot

[![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/BuilderOSS/builder-farcaster)](https://github.com/BuilderOSS/builder-farcaster/releases)
[![Build](https://github.com/BuilderOSS/builder-farcaster/actions/workflows/build.yml/badge.svg)](https://github.com/BuilderOSS/builder-farcaster/actions/workflows/build.yml)
[![License](https://img.shields.io/github/license/BuilderOSS/builder-farcaster)](https://github.com/BuilderOSS/builder-farcaster/blob/master/LICENSE)
[![X (formerly Twitter) Follow](https://img.shields.io/badge/follow-%40nekofar-ffffff?logo=x&style=flat)](https://x.com/nekofar)
[![Farcaster Follow](https://img.shields.io/badge/follow-%40nekofar-855DCD.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMzIzIiBoZWlnaHQ9IjI5NyIgdmlld0JveD0iMCAwIDMyMyAyOTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01NS41ODY3IDAuNzMzMzM3SDI2My40MTNWMjk2LjI2N0gyMzIuOTA3VjE2MC44OTNIMjMyLjYwN0MyMjkuMjM2IDEyMy40NzkgMTk3Ljc5MiA5NC4xNiAxNTkuNSA5NC4xNkMxMjEuMjA4IDk0LjE2IDg5Ljc2NDIgMTIzLjQ3OSA4Ni4zOTI2IDE2MC44OTNIODYuMDkzM1YyOTYuMjY3SDU1LjU4NjdWMC43MzMzMzdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMC4yOTMzMzUgNDIuNjhMMTIuNjg2NyA4NC42MjY3SDIzLjE3MzNWMjU0LjMyQzE3LjkwODIgMjU0LjMyIDEzLjY0IDI1OC41ODggMTMuNjQgMjYzLjg1M1YyNzUuMjkzSDExLjczMzNDNi40NjgyMiAyNzUuMjkzIDIuMiAyNzkuNTYyIDIuMiAyODQuODI3VjI5Ni4yNjdIMTA4Ljk3M1YyODQuODI3QzEwOC45NzMgMjc5LjU2MiAxMDQuNzA1IDI3NS4yOTMgOTkuNDQgMjc1LjI5M0g5Ny41MzMzVjI2My44NTNDOTcuNTMzMyAyNTguNTg4IDkzLjI2NTEgMjU0LjMyIDg4IDI1NC4zMkg3Ni41NlY0Mi42OEgwLjI5MzMzNVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMzQuODEzIDI1NC4zMkMyMjkuNTQ4IDI1NC4zMiAyMjUuMjggMjU4LjU4OCAyMjUuMjggMjYzLjg1M1YyNzUuMjkzSDIyMy4zNzNDMjE4LjEwOCAyNzUuMjkzIDIxMy44NCAyNzkuNTYyIDIxMy44NCAyODQuODI3VjI5Ni4yNjdIMzIwLjYxM1YyODQuODI3QzMyMC42MTMgMjc5LjU2MiAzMTYuMzQ1IDI3NS4yOTMgMzExLjA4IDI3NS4yOTNIMzA5LjE3M1YyNjMuODUzQzMwOS4xNzMgMjU4LjU4OCAzMDQuOTA1IDI1NC4zMiAyOTkuNjQgMjU0LjMyVjg0LjYyNjdIMzEwLjEyN0wzMjIuNTIgNDIuNjhIMjQ2LjI1M1YyNTQuMzJIMjM0LjgxM1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=&style=flat)](https://farcaster.xyz/nekofar)
[![Donate](https://img.shields.io/badge/donate-nekofar.crypto-a2b9bc?logo=ko-fi&logoColor=white)](https://ud.me/nekofar.crypto)

A Farcaster bot (@builderbot) that automatically sends you notifications for all your [Nouns Builder](https://nouns.build/) DAOs. Never miss important governance updates again!

## 🤖 What is @builderbot?

**@builderbot** is a Farcaster bot that automatically monitors all [Nouns Builder](https://nouns.build/) DAOs across multiple chains and sends you personalized notifications for the DAOs you're involved with.

### 🚀 How it works

1. **Follow @builderbot** on [Farcaster](https://farcaster.xyz/builderbot)
2. The bot automatically detects which DAOs you're a member of by checking your wallet addresses
3. You'll receive direct cast notifications for:
   - **New proposals** created in your DAOs
   - **Proposal updates** (propdates)
   - **Voting period start/end** notifications

### 🌐 Multi-chain Support

The bot monitors DAOs across all supported Nouns Builder networks:

- **Ethereum** Mainnet
- **Optimism**
- **Base**
- **Zora**

### 📬 Notification Types

- **📢 New Proposals**: Get notified when new proposals are created in your DAOs
- **📝 Proposal Updates**: Stay updated on proposal modifications and updates
- **🗳️ Voting Alerts**: Know when voting starts and ends for active proposals

## 🏗️ About Nouns Builder

[Nouns Builder](https://nouns.build/) is a protocol for creating and managing Nouns-style DAOs. It enables communities to:

- Create custom NFT collections with automatic auctions
- Govern treasuries through on-chain voting
- Build sustainable communities with continuous funding

For more information, visit:

- 🌐 [Nouns Builder App](https://nouns.build/)
- 📚 [Documentation](https://builder-docs.vercel.app/)
- 💬 [Discord](https://discord.gg/bTygNksyRb)
- 🟣 [Farcaster Channel](https://farcaster.xyz/~/channel/builder)

## 🛠️ Developer Setup

This repository contains the source code for the @builderbot Farcaster bot.

### Prerequisites

- Node.js 20+
- pnpm
- Farcaster API credentials
- Postgres database (Neon recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BuilderOSS/builder-farcaster.git
   cd builder-farcaster
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.template .env
   ```

   Then configure the following variables:

   - `FARCASTER_APP_FID` (required) - Bot identity FID
   - `FARCASTER_APP_KEY`, `FARCASTER_APP_KEY_PUBLIC` (optional) - Required only for app-key authenticated routes (for example invite owner verification)
   - `FARCASTER_API_BASE_URL` (optional - defaults to `https://api.farcaster.xyz`)
   - `FARCASTER_API_KEY` (required) - Your Farcaster Direct Cast API key
   - `NEXT_PUBLIC_GOLDSKY_PROJECT_ID` (optional) - Goldsky project id override
   - `NEXT_PUBLIC_NETWORK_TYPE` (optional) - allowed values: `mainnet` or `testnet`; if unset, @buildeross packages default to mainnet
   - `DATABASE_URL` - Postgres pooled connection string
   - `DIRECT_URL` - Postgres direct connection string for Prisma migrations
   - `CRON_SECRET` - Shared secret for cron endpoint auth (only needed when testing cron HTTP endpoints locally or on Vercel)

4. Initialize the database:

   ```bash
   pnpm prisma:migrate
   pnpm prisma:generate
   ```

5. Build and run:
   ```bash
   pnpm build
   pnpm dev
   ```

### Available Commands

- `pnpm dev` - Run the bot in development mode (processes proposals and consumes queue)
- `pnpm dev:process` - Process new proposals only
- `pnpm dev:consume` - Consume notification queue only
- `pnpm dev:propdates` - Process proposal updates only
- `pnpm dev:invites` - Process invitations
- `pnpm dev:fid` - Resolve a Farcaster FID from username
- `pnpm build` - Build the project
- `pnpm test` - Run tests
- `pnpm lint` - Run linting
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Deploy database migrations

### Architecture

The bot is built with:

- **Runtime Model**: Vercel serverless cron handlers in `api/cron/*` orchestrate producers, consumer, and cleanup in production
- **CLI**: Commander.js powers local development and manual operational commands
- **Queue System**: Postgres-backed task queue with retry/backoff logic
- **Multi-chain Integration**: GraphQL queries to Builder subgraphs
- **Farcaster Integration**: Farcaster client API for sending direct casts
- **Database**: Prisma ORM with Postgres (Neon)

Production does not run as a long-lived CLI process. Vercel Cron triggers HTTP routes that call the same command handlers used by the CLI.

## 🚀 Deployment

Production deployment is optimized for Vercel + Neon Postgres:

- **Runtime**: Vercel serverless functions in `api/cron/*`
- **Scheduling**: Vercel Cron configured in `vercel.json`
- **Database**: Neon Postgres via Prisma (`DATABASE_URL` + `DIRECT_URL`)
- **Queue Processing**: Scheduled queue consumer with retry/backoff support

### First-time Bring-up Checklist

1. Set all production environment variables in Vercel.
2. Run database migrations against Neon:

   ```bash
   pnpm prisma:migrate
   ```

3. Verify health endpoint (detailed metrics require cron auth):

   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" \
     https://<your-app-domain>/api/health
   ```

4. Enable Vercel cron schedules.

### Cron Jobs

Configured via `vercel.json`:

- Process proposals: every hour
- Process propdates: every hour
- Consume queue: every minute
- Cleanup cache and old queue rows: daily

Producer jobs are staggered to reduce load spikes (`:05` proposals, `:20` propdates).

Each cron endpoint validates `Authorization: Bearer <CRON_SECRET>`.
Invite processing is intentionally disabled pending app-key auth validation.

### Runtime Health

- Health endpoint: `GET /api/health`
- Public requests return a minimal heartbeat payload only
- Detailed queue metrics require `Authorization: Bearer <CRON_SECRET>`
- Includes queue depth metrics (`pending`, `processing`, `failed`, `completedLast24h`)
- Includes warning checks for high backlog and stale processing locks

### Queue Retention

- Daily cleanup removes:
  - cache rows older than 3 days
  - job lock rows older than 7 days
  - completed tasks older than 30 days
  - failed tasks older than 60 days
- Cleanup also recovers stale `processing` tasks (older than 15 minutes)

### Targeted Test Runs

For controlled testing, you can scope processing to specific followers, DAOs, or chains.

- Environment-based filters:
  - `TEST_TARGET_FIDS`
  - `TEST_TARGET_DAO_IDS`
  - `TEST_TARGET_CHAINS`
  - `TEST_DRY_RUN`
  - `NO_SEND_NOTIFICATIONS`
- Per-request overrides on proposal/propdate/invite cron endpoints:
  - `fid` (comma-separated FIDs)
  - `daoId` (comma-separated DAO IDs)
  - `chain` (comma-separated chain names)
  - `dryRun` (`true` or `false`)

Example:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  "https://<your-app-domain>/api/cron/process-proposals?fid=1234&daoId=0xabc...&dryRun=true"
```

### Environment Variables

Production deployment requires these environment variables:

```bash
# Application
NODE_ENV=production
DATABASE_URL=<pooled_neon_connection_string>
DIRECT_URL=<direct_neon_connection_string>

# Optional Builder subgraph overrides
NEXT_PUBLIC_GOLDSKY_PROJECT_ID=<goldsky_project_id>
NEXT_PUBLIC_NETWORK_TYPE=<mainnet_or_testnet> # allowed: mainnet|testnet; unset defaults to mainnet

# Farcaster API
FARCASTER_API_BASE_URL=https://api.farcaster.xyz
FARCASTER_API_KEY=<your_api_key>
FARCASTER_APP_FID=<app_fid>

# Optional (required only for app-key authenticated routes)
FARCASTER_APP_KEY=<ed25519_private_key_hex>
FARCASTER_APP_KEY_PUBLIC=<ed25519_public_key_hex>
CRON_SECRET=<shared_cron_secret>

# Feature flags / test targeting
ENABLE_TESTNET_CHAINS=false
NO_SEND_NOTIFICATIONS=false
TEST_TARGET_FIDS=
TEST_TARGET_DAO_IDS=
TEST_TARGET_CHAINS=
TEST_DRY_RUN=false

# Optional health warning thresholds
PENDING_WARNING_THRESHOLD=500
PENDING_AGE_WARNING_MINUTES=30
PROCESSING_STALE_WARNING_MINUTES=20
```

### Future Improvements

- Current runtime uses `@buildeross/constants` for subgraph URLs and keeps request code local in this bot.
- For future simplification, we can migrate to `@buildeross/sdk/subgraph` request helpers directly once the SDK exposes all query helpers we need for notification ingestion.
- Add alerting for health warnings (`pending` depth, stale processing age, repeated failures) via Slack/email/Sentry.
- Track producer lock skips (`skipped_due_to_lock`) and expose trend metrics for overlap visibility.
- Add an incident throttle env (follower cap per run) to reduce load during rate-limit events.
- Add lightweight dashboard/runbook checks for queue backlog growth, stale processing recovery frequency, and cleanup execution success/failure.
- Re-enable invites only after app-key auth is fully validated for `/v2/user-by-verification` and invite end-to-end tests pass.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

> [!WARNING]
> This project is currently in an experimental phase and is subject to significant changes as it progresses. As we continue development, expect frequent changes and improvements, which may lead to breaking changes in some features. We appreciate your patience and feedback while we work on building a better and more stable version of this toolset.
