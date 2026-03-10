import dotenv from 'dotenv'
import { z } from 'zod'
import { Env } from './types' // Import Env type

dotenv.config()

// Define the Zod schema for the environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  WARPCAST_AUTH_TOKEN: z.string().min(1, 'WARPCAST_AUTH_TOKEN is required'),
  WARPCAST_API_KEY: z.string().min(1, 'WARPCAST_API_KEY is required'),
  WARPCAST_BASE_URL: z.string().url('WARPCAST_BASE_URL must be a valid URL'),
  BUILDER_SUBGRAPH_ETHEREUM_URL: z
    .string()
    .url('BUILDER_SUBGRAPH_ETHEREUM_URL must be a valid URL'),
  BUILDER_SUBGRAPH_BASE_URL: z
    .string()
    .url('BUILDER_SUBGRAPH_BASE_URL must be a valid URL'),
  BUILDER_SUBGRAPH_OPTIMISM_URL: z
    .string()
    .url('BUILDER_SUBGRAPH_OPTIMISM_URL must be a valid URL'),
  BUILDER_SUBGRAPH_ZORA_URL: z
    .string()
    .url('BUILDER_SUBGRAPH_ZORA_URL must be a valid URL'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

// Parse and validate the environment variables
const parsedEnv = envSchema.parse(process.env)

// Cast the parsed result to `Env` to retain type safety
export const env: Env = parsedEnv as Env
