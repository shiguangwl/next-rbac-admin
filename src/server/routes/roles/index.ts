/**
 * 角色路由实现
 * @description 实现角色 CRUD 的路由处理
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '@/server/context'
import { auditLog } from '@/server/middleware/audit-log'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { requirePermission } from '@/server/middleware/rbac'
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  getRoleList,
  updateRole,
  updateRoleMenus,
} from '@/server/services/role.service'
import {
  createRoleRoute,
  deleteRoleRoute,
  getAllRolesRoute,
  getRoleRoute,
  listRolesRoute,
  updateRoleMenusRoute,
  updateRoleRoute,
} from './defs'

const roles = new OpenAPIHono<Env>()

// 所有路由需要认证
roles.use('/*', requireAuth)

/**
 * GET /api/roles - 获取角色列表
 */
roles.use('/', requirePermission('system:role:list'))
roles.openapi(listRolesRoute, async (c) => {
  const query = c.req.valid('query')

  const result = await getRoleList({
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    status: query.status,
  })

  return c.json(
    {
      code: 'OK',
      message: '获取成功',
      data: result,
    },
    200
  )
})

/**
 * GET /api/roles/all - 获取所有角色（不分页）
 */
roles.openapi(getAllRolesRoute, async (c) => {
  const result = await getAllRoles()
  return c.json(
    {
      code: 'OK',
      message: '获取成功',
      data: result,
    },
    200
  )
})

/**
 * POST /api/roles - 创建角色
 */
roles.use(
  createRoleRoute.path,
  requirePermission('system:role:create'),
  auditLog({ module: '角色管理', operation: '创建', description: '创建角色' })
)
roles.openapi(createRoleRoute, async (c) => {
  const body = c.req.valid('json')

  const role = await createRole({
    roleName: body.roleName,
    sort: body.sort,
    status: body.status,
    remark: body.remark,
    menuIds: body.menuIds,
  })

  return c.json(
    {
      code: 'OK',
      message: '创建成功',
      data: role,
    },
    201
  )
})

/**
 * GET /api/roles/:id - 获取角色详情
 */
roles.use('/:id', requirePermission('system:role:query'))
roles.openapi(getRoleRoute, async (c) => {
  const { id } = c.req.valid('param')

  const role = await getRoleById(id)

  return c.json(
    {
      code: 'OK',
      message: '获取成功',
      data: role,
    },
    200
  )
})

/**
 * PUT /api/roles/:id - 更新角色
 */
roles.use(
  updateRoleRoute.path,
  requirePermission('system:role:update'),
  auditLog({
    module: '角色管理',
    operation: '更新',
    description: '更新角色信息',
  })
)
roles.openapi(updateRoleRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const role = await updateRole(id, {
    roleName: body.roleName,
    sort: body.sort,
    status: body.status,
    remark: body.remark,
  })

  return c.json(
    {
      code: 'OK',
      message: '更新成功',
      data: role,
    },
    200
  )
})

/**
 * DELETE /api/roles/:id - 删除角色
 */
roles.use(
  deleteRoleRoute.path,
  requirePermission('system:role:delete'),
  auditLog({ module: '角色管理', operation: '删除', description: '删除角色' })
)
roles.openapi(deleteRoleRoute, async (c) => {
  const { id } = c.req.valid('param')

  await deleteRole(id)

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
 * PUT /api/roles/:id/menus - 更新角色菜单权限
 */
roles.use(
  updateRoleMenusRoute.path,
  requirePermission('system:role:assignMenu'),
  auditLog({
    module: '角色管理',
    operation: '分配权限',
    description: '更新角色菜单权限',
  })
)
roles.openapi(updateRoleMenusRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  await updateRoleMenus(id, body.menuIds)

  return c.json(
    {
      code: 'OK',
      message: '权限更新成功',
      data: null,
    },
    200
  )
})

export { roles }
