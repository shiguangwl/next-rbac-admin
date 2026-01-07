/**
 * 管理员操作路由定义
 * @description 重置密码、更新角色等操作路由
 * @requirements 10.5, 10.6
 */

import { createRoute } from '@hono/zod-openapi'
import { ErrorSchema, IdParamSchema, SuccessSchema } from '../../common/dtos'
import { ResetPasswordInputSchema, UpdateAdminRolesInputSchema } from '../dtos'

/**
 * 重置密码路由定义
 * PUT /api/admins/:id/reset-password
 */
export const resetPasswordRoute = createRoute({
  method: 'put',
  path: '/{id}/reset-password',
  tags: ['管理员管理'],
  summary: '重置密码',
  description: '重置管理员密码',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: ResetPasswordInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: '重置成功',
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
      description: '管理员不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

/**
 * 更新管理员角色路由定义
 * PUT /api/admins/:id/roles
 */
export const updateAdminRolesRoute = createRoute({
  method: 'put',
  path: '/{id}/roles',
  tags: ['管理员管理'],
  summary: '更新管理员角色',
  description: '批量更新管理员的角色分配',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateAdminRolesInputSchema,
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
      description: '管理员不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})
