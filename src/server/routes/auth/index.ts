/**
 * 认证路由实现
 * @description 实现登录、登出、获取认证信息的路由处理
 * @requirements 10.1, 10.2, 10.3
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '@/server/context'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { loginRateLimit } from '@/server/middleware/rate-limit'
import { getAdminById } from '@/server/services/admin.service'
import { getAdminMenuTree, getAdminPermissions, login } from '@/server/services/auth.service'
import { getAuthInfoRoute, loginRoute, logoutRoute } from './defs'

const auth = new OpenAPIHono<Env>()

/**
 * POST /api/auth/login - 管理员登录
 */
auth.openapi(loginRoute, async (c) => {
  await loginRateLimit(c, async () => {})

  const body = c.req.valid('json')

  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || undefined

  const result = await login({
    username: body.username,
    password: body.password,
    ip,
  })

  return c.json(
    {
      code: 'OK',
      message: '登录成功',
      data: result,
    },
    200
  )
})

/**
 * POST /api/auth/logout - 管理员登出
 */
auth.openapi(logoutRoute, async (c) => {
  return c.json(
    {
      code: 'OK',
      message: '登出成功',
      data: null,
    },
    200
  )
})

/**
 * GET /api/auth/info - 获取当前管理员信息
 */
auth.use('/info', requireAuth)
auth.openapi(getAuthInfoRoute, async (c) => {
  const adminPayload = c.get('admin')!

  const admin = await getAdminById(adminPayload.adminId)
  const permissions = await getAdminPermissions(adminPayload.adminId)
  const menus = await getAdminMenuTree(adminPayload.adminId)

  return c.json(
    {
      code: 'OK',
      data: {
        admin,
        permissions,
        menus,
      },
    },
    200
  )
})

export { auth }
