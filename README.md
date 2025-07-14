# Builder Farcaster Bot

[![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/BuilderOSS/builder-farcaster)](https://github.com/BuilderOSS/builder-farcaster/releases)
[![Build](https://github.com/BuilderOSS/builder-farcaster/actions/workflows/build.yml/badge.svg)](https://github.com/BuilderOSS/builder-farcaster/actions/workflows/build.yml)
[![License](https://img.shields.io/github/license/BuilderOSS/builder-farcaster)](https://github.com/BuilderOSS/builder-farcaster/blob/master/LICENSE)
[![X (formerly Twitter) Follow](https://img.shields.io/badge/follow-%40nekofar-ffffff?logo=x&style=flat)](https://x.com/nekofar)
[![Farcaster (Warpcast) Follow](https://img.shields.io/badge/follow-%40nekofar-855DCD.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMzIzIiBoZWlnaHQ9IjI5NyIgdmlld0JveD0iMCAwIDMyMyAyOTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01NS41ODY3IDAuNzMzMzM3SDI2My40MTNWMjk2LjI2N0gyMzIuOTA3VjE2MC44OTNIMjMyLjYwN0MyMjkuMjM2IDEyMy40NzkgMTk3Ljc5MiA5NC4xNiAxNTkuNSA5NC4xNkMxMjEuMjA4IDk0LjE2IDg5Ljc2NDIgMTIzLjQ3OSA4Ni4zOTI2IDE2MC44OTNIODYuMDkzM1YyOTYuMjY3SDU1LjU4NjdWMC43MzMzMzdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMC4yOTMzMzUgNDIuNjhMMTIuNjg2NyA4NC42MjY3SDIzLjE3MzNWMjU0LjMyQzE3LjkwODIgMjU0LjMyIDEzLjY0IDI1OC41ODggMTMuNjQgMjYzLjg1M1YyNzUuMjkzSDExLjczMzNDNi40NjgyMiAyNzUuMjkzIDIuMiAyNzkuNTYyIDIuMiAyODQuODI3VjI5Ni4yNjdIMTA4Ljk3M1YyODQuODI3QzEwOC45NzMgMjc5LjU2MiAxMDQuNzA1IDI3NS4yOTMgOTkuNDQgMjc1LjI5M0g5Ny41MzMzVjI2My44NTNDOTcuNTMzMyAyNTguNTg4IDkzLjI2NTEgMjU0LjMyIDg4IDI1NC4zMkg3Ni41NlY0Mi42OEgwLjI5MzMzNVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMzQuODEzIDI1NC4zMkMyMjkuNTQ4IDI1NC4zMiAyMjUuMjggMjU4LjU4OCAyMjUuMjggMjYzLjg1M1YyNzUuMjkzSDIyMy4zNzNDMjE4LjEwOCAyNzUuMjkzIDIxMy44NCAyNzkuNTYyIDIxMy44NCAyODQuODI3VjI5Ni4yNjdIMzIwLjYxM1YyODQuODI3QzMyMC42MTMgMjc5LjU2MiAzMTYuMzQ1IDI3NS4yOTMgMzExLjA4IDI3NS4yOTNIMzA5LjE3M1YyNjMuODUzQzMwOS4xNzMgMjU4LjU4OCAzMDQuOTA1IDI1NC4zMiAyOTkuNjQgMjU0LjMyVjg0LjYyNjdIMzEwLjEyN0wzMjIuNTIgNDIuNjhIMjQ2LjI1M1YyNTQuMzJIMjM0LjgxM1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=&style=flat)](https://warpcast.com/nekofar)
[![Donate](https://img.shields.io/badge/donate-nekofar.crypto-a2b9bc?logo=ko-fi&logoColor=white)](https://ud.me/nekofar.crypto)

A Farcaster bot (@builderbot) that automatically sends you notifications for all your [Nouns Builder](https://nouns.build/) DAOs. Never miss important governance updates again!

## 🤖 What is @builderbot?

**@builderbot** is a Farcaster bot that automatically monitors all [Nouns Builder](https://nouns.build/) DAOs across multiple chains and sends you personalized notifications for the DAOs you're involved with.

### 🚀 How it works

1. **Follow @builderbot** on [Farcaster](https://warpcast.com/builderbot)
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

- Node.js 18+
- pnpm
- Warpcast API credentials
- Database (SQLite)

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

   - `WARPCAST_AUTH_TOKEN` - Your Warpcast authentication token
   - `WARPCAST_API_KEY` - Your Warpcast API key
   - `BUILDER_SUBGRAPH_*_URL` - Subgraph URLs for each chain
   - `DATABASE_URL` - SQLite database connection string

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
- `pnpm dev:tokengen` - Generate Warpcast token
- `pnpm build` - Build the project
- `pnpm test` - Run tests
- `pnpm lint` - Run linting
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Deploy database migrations

### Architecture

The bot is built with:

- **CLI Interface**: Commander.js for command-line operations
- **Queue System**: SQLite-based task queue with retry logic
- **Multi-chain Integration**: GraphQL queries to Builder subgraphs
- **Farcaster Integration**: Warpcast API for sending direct casts
- **Database**: Prisma ORM with SQLite

## 🚀 Deployment

The bot uses an automated deployment pipeline with GitHub Actions following Git Flow principles:

### Branching Strategy

- **`develop`** - Main development branch for ongoing work
- **`master`** - Production branch for stable releases
- **`feature/*`** - Feature development branches
- **`bugfix/*`** - Bug fix branches
- **`release/*`** - Release preparation branches
- **`hotfix/*`** - Critical hotfix branches

### Automated Workflows

#### 1. Build Pipeline (`.github/workflows/build.yml`)

Runs on all pushes and pull requests:

- **Build & Test**: Compiles the application and runs tests
- **Auto Release**: Creates draft releases when changes are pushed to `master`
- Generates changelogs using `git-cliff`
- Creates GitHub releases with semantic versioning

#### 2. Git Flow (`.github/workflows/git-flow.yml`)

Automatically creates pull requests for:

- Feature branches → `develop`
- Bugfix branches → `develop`
- Release branches → `master`
- Hotfix branches → `master`

#### 3. Deployment (`.github/workflows/deploy.yml`)

Triggers when a GitHub release is published:

- **Environment Setup**: Creates `.env` file with production variables
- **Build**: Compiles the application for production
- **Deploy**: Uses SSH and rsync to deploy to remote server
- **Database Migration**: Runs Prisma migrations on the server
- **Cron Jobs**: Sets up automated tasks:
  - Process proposals: Every hour
  - Process propdates: Every hour
  - Consume queue: Every minute

### Production Environment

The bot runs on a remote server with:

- **Automated Processing**: Cron jobs handle proposal processing and queue consumption
- **Log Management**: Separate logs for each process (`process_proposals.log`, `process_propdates.log`, `consume_queues.log`)
- **Database Persistence**: SQLite database survives deployments
- **Zero-downtime Deployment**: Atomic symlink updates

### Environment Variables

Production deployment requires these environment variables:

```bash
# Application
NODE_ENV=production
DATABASE_URL=file:./prod.db

# Nouns Builder Subgraphs
BUILDER_SUBGRAPH_ETHEREUM_URL=<ethereum_subgraph_url>
BUILDER_SUBGRAPH_BASE_URL=<base_subgraph_url>
BUILDER_SUBGRAPH_OPTIMISM_URL=<optimism_subgraph_url>
BUILDER_SUBGRAPH_ZORA_URL=<zora_subgraph_url>

# Warpcast API
WARPCAST_BASE_URL=https://api.warpcast.com
WARPCAST_API_KEY=<your_api_key>
WARPCAST_AUTH_TOKEN=<your_auth_token>

# Deployment (GitHub variables)
REMOTE_HOST_NAME=<server_ip>
REMOTE_HOST_USER=<deploy_user>
REMOTE_HOST_PATH=<deployment_path>
REMOTE_HOST_NODE=<node_path>
REMOTE_HOST_PNPM=<pnpm_path>
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

> [!WARNING]
> This project is currently in an experimental phase and is subject to significant changes as it progresses. As we continue development, expect frequent changes and improvements, which may lead to breaking changes in some features. We appreciate your patience and feedback while we work on building a better and more stable version of this toolset.
