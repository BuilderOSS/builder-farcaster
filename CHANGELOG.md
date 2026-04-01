# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5] - 2024-11-25

### 📚 Documentation

- _(deploy)_ Update deployment instructions and organize sections

## [1.1.4] - 2024-11-25

### 🐛 Bug Fixes

- Solve some minor issues and update dependencies

## [1.1.3] - 2024-11-19

### 🚜 Refactor

- _(commands)_ Rename handlers to commands for consistency

## [1.1.2] - 2024-11-16

### 📚 Documentation

- _(readme)_ Remove setup and deployment instructions
- _(deploy)_ Add detailed deployment instructions
- _(setup)_ Add comprehensive setup instructions

## [1.1.1] - 2024-11-15

### 📚 Documentation

- _(readme)_ Update setup and deployment instructions

## [1.1.0] - 2024-11-11

### 🚀 Features

- _(logger)_ Allow custom log level via env var
- _(cli)_ Add `farcaster` command with `token` sub-command
- _(scripts)_ Add `dev:tokengen` script
- _(farcaster)_ Add `genAuthToken` function to farcaster service
- _(farcaster-token)_ Add token generation command

### 🚜 Refactor

- _(farcaster)_ Rename `FARCASTER_ACCESS_TOKEN` to `FARCASTER_AUTH_TOKEN`

## [1.0.5] - 2024-11-10

### 🚜 Refactor

- _(logger)_ Simplify and extend logger configuration

## [1.0.4] - 2024-11-10

### 📚 Documentation

- _(readme)_ Add detailed setup instructions

## [1.0.3] - 2024-11-10

### ⚙️ Miscellaneous Tasks

- _(build)_ Set `DATABASE_URL` at job level

## [1.0.1] - 2024-11-10

### ⚙️ Miscellaneous Tasks

- _(build)_ Update `DATABASE_URL` environment variable source

## [1.0.0] - 2024-11-10

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update from secrets to vars for workflow env
- _(deploy)_ Switch from `env` to `vars` for remote config

## [1.0.0-beta.3] - 2024-11-10

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update variable to `PACKAGE_VERSION` for clarity
- _(deploy)_ Improve pnpm cache handling in GitHub Actions
- _(deploy)_ Remove manual trigger from deployment workflow

## [1.0.0-beta.2] - 2024-11-10

### 🚜 Refactor

- _(config)_ Migrate prettier config to `prettier.config.mjs`

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Switch from secrets to vars for deployment
- _(deploy)_ Simplify and streamline deploy workflow
- _(deploy)_ Streamline deploy process and add manual trigger
- _(deploy)_ Move environment variables to job-level definition
- _(deploy)_ Prevent creation of existing directories
- _(deploy)_ Add `v` prefix to version in GitHub env

## [1.0.0-beta.1] - 2024-11-10

### 🐛 Bug Fixes

- Solve some minor issues and update dependencies

## [1.0.0-beta.0] - 2024-11-04

### 🚜 Refactor

- _(farcaster)_ Simplify `getFollowers` method

## [1.0.0-alpha.35] - 2024-11-01

### 🚀 Features

- _(builder)_ Filter active proposals by current time

### 🚜 Refactor

- _(proposals-handlers)_ Process proposals notifications sequentially

## [1.0.0-alpha.34] - 2024-11-01

### 🚀 Features

- _(handlers)_ Enhance voting message with proposal URL

### 🚜 Refactor

- _(queues-handler)_ Simplify `proposal` and `daos` types

## [1.0.0-alpha.33] - 2024-11-01

### 🐛 Bug Fixes

- _(proposals-handlers)_ Correct voting time comparison

## [1.0.0-alpha.32] - 2024-10-31

### 🐛 Bug Fixes

- _(proposals-handlers)_ Filter active proposals by vote start date

### 🚜 Refactor

- _(builder)_ Extract and centralize endpoint variables
- _(builder)_ Add chain info to endpoints and daos
- _(services)_ Unify proposal fetching methods
- _(handlers)_ Streamline voting proposals notification
- _(proposals-handlers)_ Streamline ending proposals handling

### ⚙️ Miscellaneous Tasks

- _(package)_ Add resolution for elliptic dependency

## [1.0.0-alpha.31] - 2024-10-30

### ◀️ Revert

- _(workflows)_ Add monthly cron job to process invites

## [1.0.0-alpha.30] - 2024-10-30

### 🚜 Refactor

- _(queues-handler)_ Break long message strings into lines

## [1.0.0-alpha.29] - 2024-10-30

### 🚜 Refactor

- _(handlers)_ Clean dao names and update message format

## [1.0.0-alpha.28] - 2024-10-30

### 🚜 Refactor

- _(queues-handler)_ Simplify message generation for DAO notifications

## [1.0.0-alpha.27] - 2024-10-30

### 🚀 Features

- _(builder)_ Add method to fetch DAO token owners
- _(cli)_ Add invites processing command
- _(builder)_ Increase default value for `first` to 1000
- _(farcaster)_ Add `getUserByVerification` service
- _(builder)_ Add `ownerCount` to `Dao` interface

### 🐛 Bug Fixes

- _(invites-handler)_ Use `continue` instead of `return` for loop

### 🚜 Refactor

- _(builder)_ Rename `daotokenOwners` to `owners`
- _(services)_ Restructure `getDAOsTokenOwners` pagination logic
- _(invites-handler)_ Enhance owner to DAOs mapping
- _(handlers)_ Extract follower and user functions
- _(invites-handler)_ Map DAO owners to Farcaster users
- _(invites-handler)_ Restructure and improve error handling
- _(invites-handler)_ Add caching to invites handler
- _(invites-handler)_ Relocate `handleInvites` function
- _(invites-handler)_ Add `ownerCount` to `Dao` mapping
- _(invites-handler)_ Log size of `sortedFidToDaoMap`
- _(invites-handler)_ Add follower filtering for DAOs
- _(invites-handler)_ Enhance logging for invite sorting
- _(invites-handler)_ Enable scheduled invitation logic
- _(invites-handler)_ Add debug logging for `fidDaoEntries` count
- _(queues-handler)_ Add support for invitation tasks
- _(queues-handler)_ Enhance notification messages
- _(invites-handler)_ Remove unnecessary time checks

### ⚙️ Miscellaneous Tasks

- _(scripts)_ Add `dev:invites` script to `package.json`
- _(workflows)_ Add monthly cron job to process invites
- _(workflows)_ Update cron schedule for invite processing

## [1.0.0-alpha.26] - 2024-10-28

### 🚀 Features

- _(builder)_ Add `getActiveEndingProposals` service
- _(proposals-handlers)_ Add ending proposals notifications
- _(handlers)_ Enhance proposal handling logic
- _(handlers)_ Enhance proposal notification processing

### 🐛 Bug Fixes

- _(builder)_ Update proposal sorting and filtering logic
- _(handlers)_ Update cache key in `handleActiveProposals`
- _(proposals-handlers)_ Update proposals time range to 3 days
- _(builder)_ Correct comparison operator in GraphQL query

### 🚜 Refactor

- _(builder)_ Add new types and remove local interfaces
- _(handlers)_ Rename `getActiveProposals` to `getActiveVotingProposals`
- _(handlers)_ Rename and refactor proposal handling functions
- _(handlers)_ Rename proposal handling methods
- _(proposals-handlers)_ Rename `endTime` to `voteEnd`

## [1.0.0-alpha.25] - 2024-10-27

### 🚀 Features

- _(proposals-handlers)_ Validate follower addresses

### 🚜 Refactor

- _(builder)_ Rename `DaoTokenOwner` and `daotokenOwners`

### ⚙️ Miscellaneous Tasks

- _(gitignore)_ Update `.gitignore` for graphql config
- _(graphql)_ Move `builder.graphql` to `schemas` directory

## [1.0.0-alpha.24] - 2024-10-27

### 🎨 Styling

- _(graphql)_ Rename `builder.gql` to `builder.graphql`

### ⚙️ Miscellaneous Tasks

- _(gitignore)_ Add graphql configuration to .gitignore

## [1.0.0-alpha.23] - 2024-10-19

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Move prisma db copy step to install phase

## [1.0.0-alpha.22] - 2024-10-19

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Add step to copy prisma db files during deployment

## [1.0.0-alpha.21] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Remove excluded SQLite files before rsync

## [1.0.0-alpha.20] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update deploy workflow to refine file inclusion

## [1.0.0-alpha.19] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update rsync rules for prisma files
- _(scripts)_ Update `prepare` script to handle errors

## [1.0.0-alpha.18] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update rsync include patterns for prisma

### ◀️ Revert

- _(deploy)_ Add tty allocation to ssh commands

## [1.0.0-alpha.17] - 2024-10-15

### ◀️ Revert

- _(deploy)_ Update rsync include patterns for prisma

## [1.0.0-alpha.16] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update rsync include patterns for prisma
- _(deploy)_ Add tty allocation to ssh commands

## [1.0.0-alpha.15] - 2024-10-15

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Remove rsync inline comments

## [1.0.0-alpha.14] - 2024-10-15

### 🐛 Bug Fixes

- _(farcaster)_ Type-cast response json to `FetchResponse`

### ⚙️ Miscellaneous Tasks

- _(scripts)_ Update dev and build scripts
- _(scripts)_ Update and streamline build scripts
- _(deploy)_ Update rsync to exclude SQLite files
- _(workflows)_ Optimize PNPM store caching
- _(workflows)_ Streamline deploy script comments

## [1.0.0-alpha.13] - 2024-10-15

### 🐛 Bug Fixes

- Solve some minor issues and update dependencies

## [1.0.0-alpha.12] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Add logs directory and update log paths
- _(deploy)_ Update cron job frequency and command

## [1.0.0-alpha.11] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update cron job setup in `deploy.yml`

## [1.0.0-alpha.10] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Set up crontab tasks in deploy workflow

## [1.0.0-alpha.9] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Add `NODE_ENV` to environment file creation
- _(deploy)_ Add prisma migration and generation steps

## [1.0.0-alpha.8] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Include LICENSE file in deployment
- _(scripts)_ Update `prepare` script to handle errors

## [1.0.0-alpha.7] - 2024-10-14

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Reorder steps for environment setup

## [1.0.0-alpha.6] - 2024-10-14

### 📚 Documentation

- _(package)_ Update `description` with project details

### ⚙️ Miscellaneous Tasks

- _(workflows)_ Remove usage guard job in `build.yml`
- _(workflows)_ Enhance deploy pipeline with SSH and build steps

## [1.0.0-alpha.5] - 2024-10-12

### ⚙️ Miscellaneous Tasks

- _(deploy)_ Update environment variables in `deploy.yml`
- _(build)_ Add `DATABASE_URL` to build pipeline

## [1.0.0-alpha.4] - 2024-10-12

### 🐛 Bug Fixes

- _(proposals-handlers)_ Remove unnecessary cache age parameter

### 🚜 Refactor

- _(cache)_ Make `maxAgeMs` optional in `getCache`
- _(queues-handler)_ Improve task processing flow

### 📚 Documentation

- _(handlers)_ Add jsdoc for `consumeQueue` function
- _(cli)_ Enhance command descriptions

### 🎨 Styling

- _(types)_ Update import statements to use `type`

### ⚙️ Miscellaneous Tasks

- _(env)_ Add `.env.template` for environment variables
- _(scripts)_ Update `prebuild` and add `pretest` script
- _(vite)_ Remove cjs format in build config

## [1.0.0-alpha.3] - 2024-10-10

### 🚀 Features

- _(prisma)_ Add Queue model to database schema
- _(queue)_ Add task queue management functions
- _(config)_ Add `FARCASTER_API_KEY` to env schema
- _(farcaster)_ Add `sendDirectCast` service method
- _(queue)_ Generate unique task IDs in `addToQueue`
- _(index)_ Add proposals to notification queue
- _(queue)_ Add retries functionality to tasks
- _(utils)_ Add `toRelativeTime` function
- _(vite)_ Add node polyfills plugin
- _(cli)_ Add command-line interface for proposal handling
- _(utils)_ Enhance `toRelativeTime` function units
- _(queue)_ Add queue processing and notification handling
- _(utils)_ Add `isPast` function to check past timestamps
- _(queues-handler)_ Enhance proposal time messages

### 🐛 Bug Fixes

- _(builder)_ Change proposal sorting order to asc

### 🚜 Refactor

- _(index)_ Move proposal handling logic to `proposals-handlers`

### 🎨 Styling

- _(queues-handler)_ Enhance proposal message format

### ⚙️ Miscellaneous Tasks

- _(gitignore)_ Ignore `dev.db-journal` in `prisma`
- _(scripts)_ Update `start` script to process proposals
- _(vite)_ Remove unused node polyfills plugin
- _(prettier)_ Add prisma plugin to `.prettierrc.json`
- _(scripts)_ Update `test` script to allow no tests

## [1.0.0-alpha.2] - 2024-10-09

### 🚀 Features

- _(builder)_ Add `Env` interface to `types.ts`
- _(config)_ Add builder subgraph URLs to env schema
- _(services)_ Add `getDAOsForOwners` to fetch DAO data
- _(build)_ Enhance `vite.config.ts` for better build process
- _(index)_ Fetch and cache DAOs for follower fids
- _(builder)_ Add `getActiveProposals` function
- _(index)_ Add proposal caching and fetching logic
- _(logger)_ Set log level based on environment
- _(builder)_ Add `name` field to dao in proposals

### 🐛 Bug Fixes

- _(index)_ Log `verificationAddresses` object on fetch
- _(builder)_ Remove redundant vote time filters
- _(index)_ Log comprehensive debug information

### 🚜 Refactor

- _(types)_ Update `Env` type to include `BuilderEnv`
- _(builder)_ Rename `fetch-daos-for-owners` to `get-daos-for-owners`
- _(cache)_ Standardize cache keys with `toString` method
- _(index)_ Simplify type imports and references
- _(index)_ Extract follower caching logic to function
- _(index)_ Extract `getFollowerAddresses` function
- _(index)_ Extract dao fetching logic to `getFollowerDAOs`
- _(index)_ Extract `getUserFid` function
- _(index)_ Remove redundant log data and rename vars
- _(logging)_ Simplify and structure logging details
- _(logger)_ Restructure log messages for clarity
- _(index)_ Consolidate follower processing logic
- _(index)_ Reorder logic for proposal handling
- _(index)_ Simplify follower address and DAOs check
- _(index)_ Streamline data fetching and caching
- _(index)_ Extract active proposals handling to function
- _(index)_ Add logging for proposal processing

### ⚙️ Miscellaneous Tasks

- _(tsconfig)_ Change moduleResolution to `bundler`

## [1.0.0-alpha.1] - 2024-10-09

### 🚀 Features

- _(index)_ Enhance logging and configuration management
- _(env)_ Add environment variable validation
- _(types)_ Add `Env` type for environment configurations
- _(farcaster)_ Add functionality to fetch user followers
- _(logger)_ Configure pino logger for development
- _(services)_ Add `getMe` function to farcaster service
- _(logger)_ Add custom logger using pino
- _(index)_ Add follower retrieval functionality
- _(cache)_ Add cache management with `PrismaClient`
- _(prisma)_ Add initial Prisma schema for caching
- _(migrations)_ Add initial cache table
- _(cache)_ Add caching for `getMe` and `getFollowers`
- _(services)_ Add `getVerifications` method to `farcaster`
- _(index)_ Add caching for follower verifications

### 🐛 Bug Fixes

- _(package)_ Set correct entry point in `main`
- _(package)_ Update start script to run correct entry point

### 🚜 Refactor

- _(index)_ Simplify server initialization
- _(tsconfig)_ Simplify and update configuration
- _(index)_ Simplify self-executing function
- _(config)_ Rename `env.ts` to `config.ts` and update types
- _(index)_ Replace `dotenv` with custom `config` module
- _(index)_ Replace inline logger with external logger
- _(index)_ Cache user fid instead of entire user object
- _(cache)_ Update type for `getCache` method
- _(index)_ Update import paths to use aliases

### ⚙️ Miscellaneous Tasks

- _(gitignore)_ Update ignore list for lock file
- _(package)_ Add `start` script to `package.json`
- _(build)_ Add initial `tsconfig.json` for TypeScript setup
- _(scripts)_ Add `clean` script to remove `dist` folder
- _(build)_ Switch from pnpm to bun for setup and build
- _(scripts)_ Add `lint` script using `eslint`
- _(package)_ Add `type` field to `package.json`
- _(lint-staged)_ Add `lint-staged` config for code formatting
- _(linting)_ Add ESLint configuration
- _(cliff)_ Add git-cliff configuration
- _(style)_ Add prettier configuration
- _(husky)_ Add pre-commit hook for linting and testing
- _(scripts)_ Add vite commands for development and build
- _(config)_ Add vite configuration
- _(build)_ Update start script to use node
- _(tsconfig)_ Add path alias for src directory
- _(vite)_ Add vite-tsconfig-paths plugin
- _(vite)_ Update build config for es module and externals
- _(scripts)_ Update start script to use esm module
- _(eslint)_ Update ignores in eslint config
- _(tsconfig)_ Update compiler settings for esnext
- _(scripts)_ Update `start` script to use `index.js`
- _(vite)_ Update build target and output file name
- _(vite)_ Add `@prisma/client` to external dependencies
- _(gitignore)_ Add `prisma/dev.db` to ignored files
- _(scripts)_ Add `prebuild` script to `package.json`
- _(scripts)_ Add `prestart` script to run build

### ◀️ Revert

- _(build)_ Switch from pnpm to bun for setup and build

## [1.0.0-alpha.0] - 2024-10-07

### 🚀 Features

- _(graphql)_ Add GraphQL schema for auctions and DAOs

### 📚 Documentation

- _(readme)_ Update project title
- _(readme)_ Add project badges and warning section

### ⚙️ Miscellaneous Tasks

- _(style)_ Add `.editorconfig` for consistent code style
- Add `.gitignore` for common NodeJS and project files
- _(npm)_ Add `.npmrc` to enforce exact versioning
- _(templates)_ Add GitHub issue templates
- _(workflows)_ Add comprehensive CI/CD workflows
- _(dependabot)_ Add configuration for dependency updates
- _(ci)_ Add FUNDING file for GitHub sponsor links
- _(stale-bot)_ Add configuration for stale issues

<!-- generated by git-cliff -->
