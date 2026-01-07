/**
 * 菜单列表路由定义
 * @description 获取菜单列表和树形结构路由
 * @requirements 10.9, 10.10
 */

import { createRoute, z } from '@hono/zod-openapi'
import { ErrorSchema, createDataResponseSchema } from '../../common/dtos'
import { MenuQuerySchema, MenuSchema, MenuTreeNodeSchema } from '../dtos'

/**
 * 获取菜单列表路由定义
 * GET /api/menus
 */
export const listMenusRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['菜单管理'],
  summary: '获取菜单列表',
  description: '获取菜单扁平列表，支持按类型和状态筛选',
  security: [{ bearerAuth: [] }],
  request: {
    query: MenuQuerySchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(z.array(MenuSchema), 'MenuListResponse'),
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

/**
 * 获取菜单树路由定义
 * GET /api/menus/tree
 */
export const getMenuTreeRoute = createRoute({
  method: 'get',
  path: '/tree',
  tags: ['菜单管理'],
  summary: '获取菜单树',
  description: '获取树形结构的菜单数据',
  security: [{ bearerAuth: [] }],
  request: {
    query: MenuQuerySchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(z.array(MenuTreeNodeSchema), 'MenuTreeResponse'),
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
