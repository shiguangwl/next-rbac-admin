/**
 * 认证路由实现
 * @description 实现登录、登出、获取认证信息的路由处理
 * @requirements 10.1, 10.2, 10.3
 */

import type { Env } from '@/server/context'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { loginRateLimit } from '@/server/middleware/rate-limit'
import { getAdminById } from '@/server/services/admin.service'
import { getAdminMenuTree, getAdminPermissions, login } from '@/server/services/auth.service'
import { OpenAPIHono } from '@hono/zod-openapi'
import { getAuthInfoRoute, loginRoute, logoutRoute } from './defs'

const auth = new OpenAPIHono<Env>()

/**
 * POST /api/auth/login - 管理员登录
 */
auth.openapi(loginRoute, async (c) => {
  // 应用登录速率限制
  await loginRateLimit(c, async () => {})

  const body = c.req.valid('json')

  // 获取客户端 IP
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || undefined

  const result = await login({
    username: body.username,
    password: body.password,
    ip,
  })

  return c.json(result, 200)
})

/**
 * POST /api/auth/logout - 管理员登出
 */
auth.openapi(logoutRoute, async (c) => {
  // JWT 是无状态的，登出只需客户端清除 Token
  // 服务端可以选择将 Token 加入黑名单（本项目暂不实现）
  return c.json({ success: true as const, message: '登出成功' }, 200)
})

/**
 * GET /api/auth/info - 获取当前管理员信息
 */
auth.use('/info', requireAuth)
auth.openapi(getAuthInfoRoute, async (c) => {
  const adminPayload = c.get('admin')!

  // 获取管理员详情
  const admin = await getAdminById(adminPayload.adminId)

  // 获取权限列表
  const permissions = await getAdminPermissions(adminPayload.adminId)

  // 获取菜单树
  const menus = await getAdminMenuTree(adminPayload.adminId)

  return c.json(
    {
      admin,
      permissions,
      menus,
    },
    200
  )
})

export { auth }
