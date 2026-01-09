/**
 * 认证路由定义（重构版）
 * @description 使用响应构建器消除重复代码
 */

import { createRoute } from '@hono/zod-openapi'
import { responses } from '../common/response-helpers'
import { AuthInfoResultSchema, LoginInputSchema, LoginResultSchema } from './dtos'

/**
 * 登录路由定义（重构前 56 行 → 重构后 31 行）
 * POST /api/auth/login
 */
export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['认证'],
  summary: '管理员登录',
  description: '使用用户名密码登录，返回 JWT Token 和管理员信息',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginInputSchema,
        },
      },
      required: true,
    },
  },
  // ✅ 重构后：使用响应构建器
  responses: responses()
    .success(LoginResultSchema, 'LoginResultResponse', '登录成功')
    .error(401, '用户名或密码错误')
    .error(403, '账号已禁用')
    .build(),
})

/**
 * 登出路由定义
 */
export const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['认证'],
  summary: '管理员登出',
  description: '登出当前管理员（客户端清除 Token）',
  responses: responses()
    .emptySuccess('登出成功')
    .build(),
})

/**
 * 获取认证信息路由定义
 */
export const getAuthInfoRoute = createRoute({
  method: 'get',
  path: '/info',
  tags: ['认证'],
  summary: '获取当前管理员信息',
  description: '获取当前登录管理员的详细信息、权限列表和菜单树',
  security: [{ bearerAuth: [] }],
  responses: responses()
    .success(AuthInfoResultSchema, 'AuthInfoResultResponse', '获取成功')
    .unauthorized()
    .build(),
})

// ========== 对比原来的写法 ==========

/**
 * 原来的写法（重复代码）
 */
const loginRouteOld = createRoute({
  // ... 前面相同 ...
  responses: {
    200: {
      description: '登录成功',
      content: {
        'application/json': {
          schema: LoginResultSchema, // 实际还需要 createDataResponseSchema
        },
      },
    },
    401: {
      description: '用户名或密码错误',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '账号已禁用',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

