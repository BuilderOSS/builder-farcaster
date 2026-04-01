import dotenv from 'dotenv'
import { z } from 'zod'
import { Env } from './types' // Import Env type

dotenv.config()

// Define the Zod schema for the environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  FARCASTER_API_KEY: z.string().min(1, 'FARCASTER_API_KEY is required'),
  FARCASTER_API_BASE_URL: z
    .string()
    .url('FARCASTER_API_BASE_URL must be a valid URL')
    .default('https://api.farcaster.xyz'),
  FARCASTER_APP_FID: z.string().min(1, 'FARCASTER_APP_FID is required'),
  FARCASTER_APP_KEY: z.string().min(1).optional(),
  FARCASTER_APP_KEY_PUBLIC: z.string().min(1).optional(),
  CRON_SECRET: z
    .string()
    .min(1, 'CRON_SECRET must not be empty when provided')
    .optional(),
  ENABLE_TESTNET_CHAINS: z.string().optional(),
  NO_SEND_NOTIFICATIONS: z.string().optional(),
  TEST_TARGET_FIDS: z.string().optional(),
  TEST_TARGET_DAO_IDS: z.string().optional(),
  TEST_TARGET_CHAINS: z.string().optional(),
  TEST_DRY_RUN: z.string().optional(),
  PENDING_WARNING_THRESHOLD: z.coerce.number().int().nonnegative().optional(),
  PENDING_AGE_WARNING_MINUTES: z.coerce.number().int().nonnegative().optional(),
  PROCESSING_STALE_WARNING_MINUTES: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

/**
 * Ensures environment variable cross-field constraints.
 */
const validatedEnvSchema = envSchema.superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && !value.CRON_SECRET) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CRON_SECRET is required in production',
      path: ['CRON_SECRET'],
    })
  }
})

// Parse and validate the environment variables
const parsedEnv = validatedEnvSchema.parse(process.env)

// Cast the parsed result to `Env` to retain type safety
export const env: Env = parsedEnv as Env
