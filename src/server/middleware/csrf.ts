/**
 * CSRF 中间件
 * @description 防止跨站请求伪造攻击
 * @requirements 10.12
 */

import { env } from '@/env'
import type { Env } from '@/server/context'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

/** 安全的 HTTP 方法（不需要 CSRF 验证） */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/** CSRF Token Header 名称 */
const CSRF_HEADER = 'X-CSRF-Token'

/**
 * CSRF 中间件
 * @description 验证非安全方法的请求是否携带有效的 CSRF Token
 *
 * 验证策略：
 * 1. 安全方法（GET/HEAD/OPTIONS）跳过验证
 * 2. 开发环境跳过验证
 * 3. 检查 Origin/Referer 是否来自允许的域名
 * 4. 检查 X-CSRF-Token header（可选，用于额外安全）
 */
export const csrfMiddleware = createMiddleware<Env>(async (c, next) => {
  const method = c.req.method.toUpperCase()

  // 安全方法跳过验证
  if (SAFE_METHODS.includes(method)) {
    return next()
  }

  // 开发环境跳过验证
  if (env.NODE_ENV === 'development') {
    return next()
  }

  // 获取请求来源
  const origin = c.req.header('Origin')
  const referer = c.req.header('Referer')

  // 允许的来源
  const allowedOrigin = env.NEXT_PUBLIC_APP_URL

  // 验证 Origin
  if (origin) {
    if (!origin.startsWith(allowedOrigin)) {
      throw new HTTPException(403, { message: 'CSRF validation failed: invalid origin' })
    }
    return next()
  }

  // 验证 Referer（当 Origin 不存在时）
  if (referer) {
    if (!referer.startsWith(allowedOrigin)) {
      throw new HTTPException(403, { message: 'CSRF validation failed: invalid referer' })
    }
    return next()
  }

  // 如果既没有 Origin 也没有 Referer，检查 CSRF Token
  const csrfToken = c.req.header(CSRF_HEADER)
  if (!csrfToken) {
    throw new HTTPException(403, { message: 'CSRF validation failed: missing token' })
  }

  // TODO: 实现 CSRF Token 验证逻辑
  // 目前简单检查 token 是否存在

  return next()
})

/**
 * 生成 CSRF Token
 * @description 生成一个随机的 CSRF Token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
