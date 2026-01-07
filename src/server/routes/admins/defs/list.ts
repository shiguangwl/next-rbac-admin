/**
 * 管理员列表路由定义
 * @description 获取管理员列表路由
 * @requirements 10.4
 */

import { createRoute } from '@hono/zod-openapi'
import { ErrorSchema, createDataResponseSchema } from '../../common/dtos'
import { AdminQuerySchema, PaginatedAdminSchema } from '../dtos'

/**
 * 获取管理员列表路由定义
 * GET /api/admins
 */
export const listAdminsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['用户管理'],
  summary: '获取管理员列表',
  description: '分页获取管理员列表，支持按用户名搜索和状态筛选',
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminQuerySchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(PaginatedAdminSchema, 'PaginatedAdminResponse'),
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
  },
})
