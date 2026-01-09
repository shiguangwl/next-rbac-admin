/**
 * 股票路由定义
 */
import { createRoute, z } from '@hono/zod-openapi'
import { ErrorSchema, IdParamSchema } from '../common/dtos'
import {
  CreateStockConfigSchema,
  StockConfigSchema,
  StockDataSchema,
  StockListQuerySchema,
  StockPushSchema,
  UpdateStockConfigSchema,
} from './dtos'

// ========== 公开 API（供量化客户端使用） ==========

/** 获取股票代码列表 */
export const getStockListRoute = createRoute({
  method: 'get',
  path: '/stock_list',
  tags: ['股票数据'],
  summary: '获取股票代码列表',
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
            data: z.array(z.string()),
          }),
        },
      },
    },
  },
})

/** 推送股票数据 */
export const pushStockDataRoute = createRoute({
  method: 'post',
  path: '/stock_push',
  tags: ['股票数据'],
  summary: '推送股票数据',
  request: {
    body: {
      content: {
        'application/json': {
          schema: StockPushSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: '参数错误',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
})

/** 获取股票数据列表（前端展示） */
export const getStockDataRoute = createRoute({
  method: 'get',
  path: '/data',
  tags: ['股票数据'],
  summary: '获取股票数据列表',
  request: {
    query: StockListQuerySchema,
  },
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            data: z.array(StockDataSchema),
          }),
        },
      },
    },
  },
})

// ========== 管理后台 API ==========

/** 获取股票配置列表 */
export const listStockConfigRoute = createRoute({
  method: 'get',
  path: '/config',
  tags: ['股票配置'],
  summary: '获取股票配置列表',
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            data: z.array(StockConfigSchema),
          }),
        },
      },
    },
  },
})

/** 创建股票配置 */
export const createStockConfigRoute = createRoute({
  method: 'post',
  path: '/config',
  tags: ['股票配置'],
  summary: '创建股票配置',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateStockConfigSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '创建成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            data: StockConfigSchema,
          }),
        },
      },
    },
    400: {
      description: '参数错误',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
})

/** 更新股票配置 */
export const updateStockConfigRoute = createRoute({
  method: 'put',
  path: '/config/{id}',
  tags: ['股票配置'],
  summary: '更新股票配置',
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateStockConfigSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            data: StockConfigSchema,
          }),
        },
      },
    },
    404: {
      description: '配置不存在',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
})

/** 删除股票配置 */
export const deleteStockConfigRoute = createRoute({
  method: 'delete',
  path: '/config/{id}',
  tags: ['股票配置'],
  summary: '删除股票配置',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '删除成功',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: '配置不存在',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
})
