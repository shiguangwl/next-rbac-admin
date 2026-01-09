/**
 * 管理员详情路由定义
 * @description 获取、更新、删除管理员路由
 */

import { createRoute } from '@hono/zod-openapi'
import {
  createDataResponseSchema,
  ErrorSchema,
  IdParamSchema,
  SuccessSchema,
} from '../../common/dtos'
import { AdminSchema, UpdateAdminInputSchema } from '../dtos'

/**
 * 获取管理员详情路由定义
 * GET /api/admins/:id
 */
export const getAdminRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['用户管理'],
  summary: '获取管理员详情',
  description: '根据 ID 获取管理员详细信息',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(AdminSchema, 'GetAdminResponse'),
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
 * 更新管理员路由定义
 * PUT /api/admins/:id
 */
export const updateAdminRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['用户管理'],
  summary: '更新管理员',
  description: '更新管理员信息（不包含密码）',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateAdminInputSchema,
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
          schema: createDataResponseSchema(AdminSchema, 'UpdateAdminResponse'),
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
 * 删除管理员路由定义
 * DELETE /api/admins/:id
 */
export const deleteAdminRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['用户管理'],
  summary: '删除管理员',
  description: '删除管理员账号（不能删除自己）',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '删除成功',
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
      description: '无权限访问或不能删除自己',
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
