# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.2] - 2024-10-09

### 🚀 Features

- *(builder)* Add `Env` interface to `types.ts`
- *(config)* Add builder subgraph URLs to env schema
- *(services)* Add `getDAOsForOwners` to fetch DAO data
- *(build)* Enhance `vite.config.ts` for better build process
- *(index)* Fetch and cache DAOs for follower fids
- *(builder)* Add `getActiveProposals` function
- *(index)* Add proposal caching and fetching logic
- *(logger)* Set log level based on environment
- *(builder)* Add `name` field to dao in proposals

### 🐛 Bug Fixes

- *(index)* Log `verificationAddresses` object on fetch
- *(builder)* Remove redundant vote time filters
- *(index)* Log comprehensive debug information

### 🚜 Refactor

- *(types)* Update `Env` type to include `BuilderEnv`
- *(builder)* Rename `fetch-daos-for-owners` to `get-daos-for-owners`
- *(cache)* Standardize cache keys with `toString` method
- *(index)* Simplify type imports and references
- *(index)* Extract follower caching logic to function
- *(index)* Extract `getFollowerAddresses` function
- *(index)* Extract dao fetching logic to `getFollowerDAOs`
- *(index)* Extract `getUserFid` function
- *(index)* Remove redundant log data and rename vars
- *(logging)* Simplify and structure logging details
- *(logger)* Restructure log messages for clarity
- *(index)* Consolidate follower processing logic
- *(index)* Reorder logic for proposal handling
- *(index)* Simplify follower address and DAOs check
- *(index)* Streamline data fetching and caching
- *(index)* Extract active proposals handling to function
- *(index)* Add logging for proposal processing

### ⚙️ Miscellaneous Tasks

- *(tsconfig)* Change moduleResolution to `bundler`

## [1.0.0-alpha.1] - 2024-10-09

### 🚀 Features

- *(index)* Enhance logging and configuration management
- *(env)* Add environment variable validation
- *(types)* Add `Env` type for environment configurations
- *(warpcast)* Add functionality to fetch user followers
- *(logger)* Configure pino logger for development
- *(services)* Add `getMe` function to warpcast service
- *(logger)* Add custom logger using pino
- *(index)* Add follower retrieval functionality
- *(cache)* Add cache management with `PrismaClient`
- *(prisma)* Add initial Prisma schema for caching
- *(migrations)* Add initial cache table
- *(cache)* Add caching for `getMe` and `getFollowers`
- *(services)* Add `getVerifications` method to `warpcast`
- *(index)* Add caching for follower verifications

### 🐛 Bug Fixes

- *(package)* Set correct entry point in `main`
- *(package)* Update start script to run correct entry point

### 🚜 Refactor

- *(index)* Simplify server initialization
- *(tsconfig)* Simplify and update configuration
- *(index)* Simplify self-executing function
- *(config)* Rename `env.ts` to `config.ts` and update types
- *(index)* Replace `dotenv` with custom `config` module
- *(index)* Replace inline logger with external logger
- *(index)* Cache user fid instead of entire user object
- *(cache)* Update type for `getCache` method
- *(index)* Update import paths to use aliases

### ⚙️ Miscellaneous Tasks

- *(gitignore)* Update ignore list for lock file
- *(package)* Add `start` script to `package.json`
- *(build)* Add initial `tsconfig.json` for TypeScript setup
- *(scripts)* Add `clean` script to remove `dist` folder
- *(build)* Switch from pnpm to bun for setup and build
- *(scripts)* Add `lint` script using `eslint`
- *(package)* Add `type` field to `package.json`
- *(lint-staged)* Add `lint-staged` config for code formatting
- *(linting)* Add ESLint configuration
- *(cliff)* Add git-cliff configuration
- *(style)* Add prettier configuration
- *(husky)* Add pre-commit hook for linting and testing
- *(scripts)* Add vite commands for development and build
- *(config)* Add vite configuration
- *(build)* Update start script to use node
- *(tsconfig)* Add path alias for src directory
- *(vite)* Add vite-tsconfig-paths plugin
- *(vite)* Update build config for es module and externals
- *(scripts)* Update start script to use esm module
- *(eslint)* Update ignores in eslint config
- *(tsconfig)* Update compiler settings for esnext
- *(scripts)* Update `start` script to use `index.js`
- *(vite)* Update build target and output file name
- *(vite)* Add `@prisma/client` to external dependencies
- *(gitignore)* Add `prisma/dev.db` to ignored files
- *(scripts)* Add `prebuild` script to `package.json`
- *(scripts)* Add `prestart` script to run build

### ◀️ Revert

- *(build)* Switch from pnpm to bun for setup and build

## [1.0.0-alpha.0] - 2024-10-07

### 🚀 Features

- *(graphql)* Add GraphQL schema for auctions and DAOs

### 📚 Documentation

- *(readme)* Update project title
- *(readme)* Add project badges and warning section

### ⚙️ Miscellaneous Tasks

- *(style)* Add `.editorconfig` for consistent code style
- Add `.gitignore` for common NodeJS and project files
- *(npm)* Add `.npmrc` to enforce exact versioning
- *(templates)* Add GitHub issue templates
- *(workflows)* Add comprehensive CI/CD workflows
- *(dependabot)* Add configuration for dependency updates
- *(ci)* Add FUNDING file for GitHub sponsor links
- *(stale-bot)* Add configuration for stale issues

<!-- generated by git-cliff -->
