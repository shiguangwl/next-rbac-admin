/**
 * 角色操作路由定义
 * @description 更新角色菜单权限等操作路由
 */

import { createRoute } from '@hono/zod-openapi'
import { ErrorSchema, IdParamSchema, SuccessSchema } from '../../common/dtos'
import { UpdateRoleMenusInputSchema } from '../dtos'

/**
 * 更新角色菜单权限路由定义
 * PUT /api/roles/:id/menus
 */
export const updateRoleMenusRoute = createRoute({
  method: 'put',
  path: '/{id}/menus',
  tags: ['角色管理'],
  summary: '更新角色菜单权限',
  description: '批量更新角色的菜单权限',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateRoleMenusInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: {
        'application/json': {
          schema: SuccessSchema,
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '角色不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})
