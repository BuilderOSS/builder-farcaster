import type { Env as BuilderEnv } from '@/services/builder/types'
import type { Env as FarcasterEnv } from '@/services/farcaster/types'

export type Env = BuilderEnv &
  FarcasterEnv & {
    DATABASE_URL: string
    DIRECT_URL?: string
    CRON_SECRET?: string
    ENABLE_TESTNET_CHAINS?: string
    NO_SEND_NOTIFICATIONS?: string
    FARCASTER_APP_KEY?: string
    FARCASTER_APP_KEY_PUBLIC?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
