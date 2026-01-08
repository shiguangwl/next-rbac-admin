/**
 * 管理员路由实现
 * @description 实现管理员 CRUD 的路由处理
 * @requirements 10.4, 10.5, 10.6
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '@/server/context'
import { auditLog } from '@/server/middleware/audit-log'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { requirePermission } from '@/server/middleware/rbac'
import {
  createAdmin,
  deleteAdmin,
  getAdminById,
  getAdminList,
  resetPassword,
  updateAdmin,
  updateAdminRoles,
} from '@/server/services/admin.service'
import {
  createAdminRoute,
  deleteAdminRoute,
  getAdminRoute,
  listAdminsRoute,
  resetPasswordRoute,
  updateAdminRolesRoute,
  updateAdminRoute,
} from './defs'

const admins = new OpenAPIHono<Env>()

// 所有路由需要认证
admins.use('/*', requireAuth)

/**
 * GET /api/admins - 获取管理员列表
 */
admins.use('/', requirePermission('system:admin:list'))
admins.openapi(listAdminsRoute, async (c) => {
  const query = c.req.valid('query')

  const result = await getAdminList({
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    status: query.status,
  })

  return c.json(
    {
      code: 'OK',
      data: result,
    },
    200
  )
})

/**
 * POST /api/admins - 创建管理员
 */
admins.use(
  createAdminRoute.path,
  requirePermission('system:admin:create'),
  auditLog({ module: '用户管理', operation: '创建', description: '创建管理员' })
)
admins.openapi(createAdminRoute, async (c) => {
  const body = c.req.valid('json')

  const admin = await createAdmin({
    username: body.username,
    password: body.password,
    nickname: body.nickname,
    status: body.status,
    remark: body.remark,
    roleIds: body.roleIds,
  })

  return c.json(
    {
      code: 'OK',
      data: admin,
    },
    201
  )
})

/**
 * GET /api/admins/:id - 获取管理员详情
 */
admins.use('/:id', requirePermission('system:admin:query'))
admins.openapi(getAdminRoute, async (c) => {
  const { id } = c.req.valid('param')

  const admin = await getAdminById(id)

  return c.json(
    {
      code: 'OK',
      data: admin,
    },
    200
  )
})

/**
 * PUT /api/admins/:id - 更新管理员
 */
admins.use(
  updateAdminRoute.path,
  requirePermission('system:admin:update'),
  auditLog({
    module: '用户管理',
    operation: '更新',
    description: '更新管理员信息',
  })
)
admins.openapi(updateAdminRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const admin = await updateAdmin(id, {
    nickname: body.nickname,
    status: body.status,
    remark: body.remark,
  })

  return c.json(
    {
      code: 'OK',
      data: admin,
    },
    200
  )
})

/**
 * DELETE /api/admins/:id - 删除管理员
 */
admins.use(
  deleteAdminRoute.path,
  requirePermission('system:admin:delete'),
  auditLog({ module: '用户管理', operation: '删除', description: '删除管理员' })
)
admins.openapi(deleteAdminRoute, async (c) => {
  const { id } = c.req.valid('param')
  const currentAdmin = c.get('admin')!

  await deleteAdmin(id, currentAdmin.adminId)

  return c.json(
    {
      code: 'OK',
      message: '删除成功',
      data: null,
    },
    200
  )
})

/**
 * PUT /api/admins/:id/reset-password - 重置密码
 */
admins.use(
  resetPasswordRoute.path,
  requirePermission('system:admin:resetPwd'),
  auditLog({
    module: '用户管理',
    operation: '重置密码',
    description: '重置管理员密码',
  })
)
admins.openapi(resetPasswordRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  await resetPassword(id, body.newPassword)

  return c.json(
    {
      code: 'OK',
      message: '密码重置成功',
      data: null,
    },
    200
  )
})

/**
 * PUT /api/admins/:id/roles - 更新管理员角色
 */
admins.use(
  updateAdminRolesRoute.path,
  requirePermission('system:admin:assignRole'),
  auditLog({
    module: '用户管理',
    operation: '分配角色',
    description: '更新管理员角色',
  })
)
admins.openapi(updateAdminRolesRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  await updateAdminRoles(id, body.roleIds)

  return c.json(
    {
      code: 'OK',
      message: '角色更新成功',
      data: null,
    },
    200
  )
})

export { admins }
