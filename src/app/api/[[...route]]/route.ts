/**
 * Next.js API Route Handler
 * @description 将 Hono 应用挂载到 Next.js App Router
 * @requirements 10.12
 */

import { app } from '@/server/app'
import { handle } from 'hono/vercel'

/**
 * 导出 HTTP 方法处理函数
 */
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
