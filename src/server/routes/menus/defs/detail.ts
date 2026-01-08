/**
 * 菜单详情路由定义
 * @description 获取、更新、删除菜单路由
 * @requirements 10.9
 */

import { createRoute } from '@hono/zod-openapi'
import {
  createDataResponseSchema,
  ErrorSchema,
  IdParamSchema,
  SuccessSchema,
} from '../../common/dtos'
import { MenuSchema, UpdateMenuInputSchema } from '../dtos'

/**
 * 获取菜单详情路由定义
 * GET /api/menus/:id
 */
export const getMenuRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['菜单管理'],
  summary: '获取菜单详情',
  description: '根据 ID 获取菜单详细信息',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(MenuSchema, 'GetMenuResponse'),
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
      description: '菜单不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

/**
 * 更新菜单路由定义
 * PUT /api/menus/:id
 */
export const updateMenuRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['菜单管理'],
  summary: '更新菜单',
  description: '更新菜单信息',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateMenuInputSchema,
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
          schema: createDataResponseSchema(MenuSchema, 'UpdateMenuResponse'),
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
      description: '菜单不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: '权限标识已存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

/**
 * 删除菜单路由定义
 * DELETE /api/menus/:id
 */
export const deleteMenuRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['菜单管理'],
  summary: '删除菜单',
  description: '删除菜单（有子菜单的不能删除）',
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
      description: '无权限访问或存在子菜单',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '菜单不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})
