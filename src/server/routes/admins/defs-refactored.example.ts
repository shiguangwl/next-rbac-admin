/**
 * 管理员路由定义（重构版）
 * @description 展示如何使用响应构建器简化 CRUD 路由
 */

import { createRoute } from '@hono/zod-openapi'
import { responses } from '../../common/response-helpers'
import { IdParamSchema, PaginationQuerySchema } from '../../common/dtos'
import { AdminSchema, CreateAdminInputSchema, UpdateAdminInputSchema, PaginatedAdminSchema } from '../dtos'

/**
 * 获取管理员列表
 * GET /api/admins
 */
export const listAdminsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['用户管理'],
  summary: '获取管理员列表',
  description: '分页查询管理员列表',
  security: [{ bearerAuth: [] }],
  request: {
    query: PaginationQuerySchema,
  },
  // ✅ 重构后：链式调用，语义清晰
  responses: responses()
    .success(PaginatedAdminSchema, 'PaginatedAdminResponse', '查询成功')
    .withAuth() // 自动添加 401, 403
    .build(),
})

/**
 * 获取管理员详情
 * GET /api/admins/:id
 */
export const getAdminRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['用户管理'],
  summary: '获取管理员详情',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: responses()
    .success(AdminSchema, 'AdminResponse', '查询成功')
    .withCRUD() // 自动添加 401, 403, 404
    .build(),
})

/**
 * 创建管理员
 * POST /api/admins
 */
export const createAdminRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['用户管理'],
  summary: '创建管理员',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAdminInputSchema,
        },
      },
      required: true,
    },
  },
  responses: responses()
    .created(AdminSchema, 'CreateAdminResponse', '创建成功')
    .withAuth()
    .conflict('用户名已存在') // 自定义 409 错误描述
    .build(),
})

/**
 * 更新管理员
 * PUT /api/admins/:id
 */
export const updateAdminRoute = createRoute({
  method: 'put',
  path: '/:id',
  tags: ['用户管理'],
  summary: '更新管理员',
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
  responses: responses()
    .success(AdminSchema, 'UpdateAdminResponse', '更新成功')
    .withCRUD()
    .build(),
})

/**
 * 删除管理员
 * DELETE /api/admins/:id
 */
export const deleteAdminRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['用户管理'],
  summary: '删除管理员',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: responses()
    .emptySuccess('删除成功')
    .withCRUD()
    .error(400, '不能删除自己')
    .build(),
})

// ========== 代码量对比 ==========
// 重构前：每个路由 ~65 行 × 5 = 325 行
// 重构后：每个路由 ~30 行 × 5 = 150 行
// 节省：175 行（54%）

