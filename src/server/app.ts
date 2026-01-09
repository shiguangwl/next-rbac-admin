/**
 * Hono 应用实例
 * @description 创建和配置 Hono 应用，注册中间件和路由
 */

import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { env } from '@/env'
import { mapErrorToResponse } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { createRequestContext, runWithRequestContext } from '@/lib/request-context'
import type { Env } from './context'
import { setLogRecorder } from './middleware/audit-log'
import { corsMiddleware } from './middleware/cors'
import { csrfMiddleware } from './middleware/csrf'
import { jwtAuth } from './middleware/jwt-auth'
import { apiRateLimit } from './middleware/rate-limit'
import { loadPermissions } from './middleware/rbac'
import { routes } from './route-defs'
import { createOperationLog } from './services/audit.service'

/**
 * 创建 Hono 应用实例
 */
const app = new OpenAPIHono<Env>()

// ========== 配置审计日志记录器 ==========

setLogRecorder(async (data) => {
  await createOperationLog({
    adminId: data.adminId,
    adminName: data.adminName,
    module: data.module,
    operation: data.operation,
    description: data.description,
    method: data.method,
    requestMethod: data.requestMethod,
    requestUrl: data.requestUrl,
    requestParams: data.requestParams,
    ip: data.ip,
    userAgent: data.userAgent,
    executionTime: data.executionTime,
    status: data.status,
    errorMsg: data.errorMsg,
  })
})

// ========== 注册中间件（按顺序） ==========

// 1. CORS 中间件（最先处理，快速响应 OPTIONS 预检请求）
app.use('*', corsMiddleware)

// 2. 请求 ID + AsyncLocalStorage 上下文中间件
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  // 使用 AsyncLocalStorage 包装，确保 Service 层 logger 能获取 requestId
  const ctx = createRequestContext(requestId)
  return await runWithRequestContext(ctx, next)
})

// 3. 请求日志中间件
app.use('*', async (c, next) => {
  const start = Date.now()

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  const rid = c.get('requestId')
  const line = `[HTTP] ${c.req.method} ${c.req.path} ${status} ${duration}ms rid=${rid}`
  if (env.NODE_ENV !== 'production') {
    if (status >= 500) {
      logger.error(line)
    } else if (status >= 400) {
      logger.warn(line)
    } else {
      logger.info(line)
    }
  } else {
    if (status >= 500) {
      logger.error('Request completed', {
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: duration,
      })
    } else if (status >= 400) {
      logger.warn('Request completed', {
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: duration,
      })
    } else {
      logger.info('Request completed', {
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: duration,
      })
    }
  }
})

// 4. CSRF 中间件
// app.use('*', csrfMiddleware)

// 5. 速率限制中间件
app.use('/api/*', apiRateLimit)

// 6. JWT 认证中间件（排除无需认证的路径）
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  // 无需 JWT 认证的路径
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/stock/stock_list',
    '/api/stock/stock_push',
    '/api/stock/data',
  ]

  if (publicPaths.includes(path)) {
    c.set('admin', null)
    c.set('permissions', null)
    return next()
  }

  return jwtAuth(c, next)
})

// 7. 加载权限中间件
app.use('/api/*', loadPermissions)

// ========== 挂载 API 路由 ==========

app.route('/api', routes)

// ========== 配置 OpenAPI 文档 ==========

app.doc('/api/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Admin Scaffold RBAC API',
    version: '1.0.0',
    description: '后台管理系统 RBAC 权限管理 API 文档',
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: '认证', description: '管理员认证相关接口' },
    { name: '用户管理', description: '管理员 CRUD 接口' },
    { name: '角色管理', description: '角色 CRUD 接口' },
    { name: '菜单管理', description: '菜单权限 CRUD 接口' },
    { name: '操作日志', description: '操作日志查询接口' },
  ],
})

// 配置 Swagger UI
app.get('/api/swagger', swaggerUI({ url: '/api/doc' }))

// ========== 全局错误处理 ==========

app.onError((err, c) => {
  const requestId = c.get('requestId')

  // 处理 HTTPException
  if (err instanceof HTTPException) {
    const message =
      env.NODE_ENV === 'production' && err.status >= 500 ? 'Internal Server Error' : err.message

    // 记录 5xx 错误
    if (err.status >= 500) {
      logger.error('HTTP Exception', {
        requestId,
        status: err.status,
        method: c.req.method,
        path: c.req.path,
        err,
      })
    }

    return c.json(
      {
        code: 'HTTP_ERROR',
        message,
      },
      err.status
    )
  }

  // 处理业务错误
  const errorResponse = mapErrorToResponse(err)

  // 记录 5xx 错误详情（包含堆栈）
  if (errorResponse.status >= 500) {
    logger.error('Unhandled error', {
      requestId,
      code: errorResponse.code,
      method: c.req.method,
      path: c.req.path,
      err,
    })
  }

  return c.json(
    {
      code: errorResponse.code,
      message: errorResponse.message,
      details: errorResponse.details,
    },
    errorResponse.status as 400 | 401 | 403 | 404 | 409 | 500
  )
})

// ========== 404 处理 ==========

app.notFound((c) => {
  return c.json(
    {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  )
})

export { app }
