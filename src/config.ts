import dotenv from 'dotenv'
import { z } from 'zod'
import { Env } from './types' // Import Env type

dotenv.config()

// Define the Zod schema for the environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  WARPCAST_AUTH_TOKEN: z.string().min(1).optional(),
  WARPCAST_API_KEY: z.string().min(1, 'WARPCAST_API_KEY is required'),
  WARPCAST_BASE_URL: z.string().url('WARPCAST_BASE_URL must be a valid URL'),
  FARCASTER_MNEMONIC: z.string().optional(),
  BOT_FID: z.string().optional(),
  BOT_USERNAME: z.string().optional(),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required').optional(),
  ENABLE_TESTNET_CHAINS: z.string().optional(),
  NO_SEND_NOTIFICATIONS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

// Parse and validate the environment variables
const parsedEnv = envSchema.parse(process.env)

// Cast the parsed result to `Env` to retain type safety
export const env: Env = parsedEnv as Env
