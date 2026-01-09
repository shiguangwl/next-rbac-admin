/**
 * 创建菜单路由定义
 * @description 创建菜单路由
 */

import { createRoute } from '@hono/zod-openapi'
import { createDataResponseSchema, ErrorSchema } from '../../common/dtos'
import { CreateMenuInputSchema, MenuSchema } from '../dtos'

/**
 * 创建菜单路由定义
 * POST /api/menus
 */
export const createMenuRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['菜单管理'],
  summary: '创建菜单',
  description: '创建新的菜单/权限',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateMenuInputSchema,
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
          schema: createDataResponseSchema(MenuSchema, 'CreateMenuResponse'),
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
      description: '父级菜单不存在',
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
