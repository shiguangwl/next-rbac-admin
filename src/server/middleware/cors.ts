/**
 * CORS 中间件
 * @description 处理跨域资源共享
 * @requirements 10.12
 */

import { env } from '@/env'
import { cors } from 'hono/cors'

/**
 * CORS 中间件配置
 * @description 允许来自 NEXT_PUBLIC_APP_URL 的跨域请求
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // 开发环境允许所有来源
    if (env.NODE_ENV === 'development') {
      return origin
    }

    // 生产环境只允许配置的来源
    const allowedOrigins = [env.NEXT_PUBLIC_APP_URL]

    if (allowedOrigins.includes(origin)) {
      return origin
    }

    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400, // 24 小时
})
