/**
 * 创建角色路由定义
 * @description 创建角色路由
 * @requirements 10.7
 */

import { createRoute } from '@hono/zod-openapi'
import { ErrorSchema } from '../../common/dtos'
import { CreateRoleInputSchema, RoleSchema } from '../dtos'

/**
 * 创建角色路由定义
 * POST /api/roles
 */
export const createRoleRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['角色管理'],
  summary: '创建角色',
  description: '创建新的角色',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRoleInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: '创建成功',
      content: {
        'application/json': {
          schema: RoleSchema,
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
    409: {
      description: '角色名已存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})
