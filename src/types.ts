import type { Env as BuilderEnv } from '@/services/builder/types'
import type { Env as WarpcastEnv } from '@/services/warpcast/types'

export type Env = BuilderEnv &
  WarpcastEnv & {
    DATABASE_URL: string
    DIRECT_URL?: string
    CRON_SECRET?: string
    ENABLE_TESTNET_CHAINS?: string
    NO_SEND_NOTIFICATIONS?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
