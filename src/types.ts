import type { Env as BuilderEnv } from '@/services/builder/types'
import type { Env as FarcasterEnv } from '@/services/farcaster/types'

export type Env = BuilderEnv &
  FarcasterEnv & {
    DATABASE_URL: string
    DIRECT_URL?: string
    CRON_SECRET?: string
    ENABLE_TESTNET_CHAINS?: string
    NO_SEND_NOTIFICATIONS?: string
    TEST_TARGET_FIDS?: string
    TEST_TARGET_DAO_IDS?: string
    TEST_TARGET_CHAINS?: string
    TEST_DRY_RUN?: string
    PENDING_WARNING_THRESHOLD?: number
    PENDING_AGE_WARNING_MINUTES?: number
    PROCESSING_STALE_WARNING_MINUTES?: number
    FARCASTER_APP_KEY?: string
    FARCASTER_APP_KEY_PUBLIC?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
