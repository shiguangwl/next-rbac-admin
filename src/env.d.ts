/**
 * 环境变量类型声明
 */
import type { createEnv } from '@t3-oss/env-nextjs'

type EnvConfig = ReturnType<
  typeof createEnv<
    {
      DATABASE_URL: string
      DATABASE_MAX_CONNECTIONS: number
      DATABASE_IDLE_TIMEOUT: number
      DATABASE_CONNECT_TIMEOUT: number
      AUTO_DB_MIGRATE: boolean
      AUTO_DB_SEED: boolean
      SEED_ADMIN_USERNAME: string
      SEED_ADMIN_PASSWORD: string | undefined
      SEED_ADMIN_NICKNAME: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
      NODE_ENV: 'development' | 'production' | 'test'
    },
    {
      NEXT_PUBLIC_APP_URL: string
    }
  >
>

export declare const env: EnvConfig
