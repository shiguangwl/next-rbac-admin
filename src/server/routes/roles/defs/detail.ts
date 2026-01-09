/**
 * 角色详情路由定义
 * @description 获取、更新、删除角色路由
 */

import { createRoute } from '@hono/zod-openapi'
import {
  createDataResponseSchema,
  ErrorSchema,
  IdParamSchema,
  SuccessSchema,
} from '../../common/dtos'
import { RoleSchema, UpdateRoleInputSchema } from '../dtos'

/**
 * 获取角色详情路由定义
 * GET /api/roles/:id
 */
export const getRoleRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['角色管理'],
  summary: '获取角色详情',
  description: '根据 ID 获取角色详细信息（包含菜单 ID 列表）',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(RoleSchema, 'GetRoleResponse'),
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

/**
 * 更新角色路由定义
 * PUT /api/roles/:id
 */
export const updateRoleRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['角色管理'],
  summary: '更新角色',
  description: '更新角色信息',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateRoleInputSchema,
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
          schema: createDataResponseSchema(RoleSchema, 'UpdateRoleResponse'),
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

/**
 * 删除角色路由定义
 * DELETE /api/roles/:id
 */
export const deleteRoleRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['角色管理'],
  summary: '删除角色',
  description: '删除角色（已分配给管理员的角色不能删除）',
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
      description: '无权限访问或角色已分配给管理员',
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
