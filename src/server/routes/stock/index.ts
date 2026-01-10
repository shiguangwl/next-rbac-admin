/**
 * 股票路由实现
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '@/server/context'
import { verifyApiKey } from '@/server/middleware/api-key'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { requirePermission } from '@/server/middleware/rbac'
import {
  createStockConfig,
  deleteStockConfig,
  getStockCodeList,
  getStockConfigs,
  getStockDataList,
  pushStockData,
  updateStockConfig,
} from '@/server/services'
import {
  createStockConfigRoute,
  deleteStockConfigRoute,
  getStockDataRoute,
  getStockListRoute,
  listStockConfigRoute,
  pushStockDataRoute,
  updateStockConfigRoute,
} from './defs'

const stock = new OpenAPIHono<Env>()

// ========== 公开 API（使用 API Key 认证） ==========

/** GET /api/stock/stock_list - 获取股票代码列表（无需认证） */
stock.openapi(getStockListRoute, async (c) => {
  const codes = await getStockCodeList()
  return c.json({
    code: 'ok',
    message: '操作成功',
    data: codes,
  })
})

/** POST /api/stock/stock_push - 推送股票数据 */
stock.openapi(pushStockDataRoute, async (c) => {
  await verifyApiKey(c)
  const body = c.req.valid('json')
  await pushStockData(body)
  return c.json({
    code: 'ok',
    message: '推送成功',
  })
})

/** GET /api/stock/data - 获取股票数据列表（无需认证，供前端公开页面使用） */
stock.openapi(getStockDataRoute, async (c) => {
  const query = c.req.valid('query')
  const data = await getStockDataList(query.sortBy, query.sortOrder)
  return c.json({
    code: 'OK',
    data,
  })
})

// ========== 管理后台 API（需要认证） ==========

/** GET /api/stock/config - 获取股票配置列表 */
stock.use('/config', requireAuth, requirePermission('stock:config:list'))
stock.openapi(listStockConfigRoute, async (c) => {
  const configs = await getStockConfigs()
  return c.json({
    code: 'OK',
    data: configs.map((cfg) => ({
      ...cfg,
      createdAt: cfg.createdAt.toISOString(),
      updatedAt: cfg.updatedAt.toISOString(),
    })),
  })
})

/** POST /api/stock/config - 创建股票配置 */
stock.use(createStockConfigRoute.path, requireAuth, requirePermission('stock:config:create'))
stock.openapi(createStockConfigRoute, async (c) => {
  const body = c.req.valid('json')
  const config = await createStockConfig(body)
  return c.json(
    {
      code: 'OK',
      data: {
        ...config!,
        createdAt: config!.createdAt.toISOString(),
        updatedAt: config!.updatedAt.toISOString(),
      },
    },
    201
  )
})

/** PUT /api/stock/config/:id - 更新股票配置 */
stock.use(updateStockConfigRoute.path, requireAuth, requirePermission('stock:config:update'))
stock.openapi(updateStockConfigRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const config = await updateStockConfig(id, body)
  return c.json(
    {
      code: 'OK',
      data: {
        ...config!,
        createdAt: config!.createdAt.toISOString(),
        updatedAt: config!.updatedAt.toISOString(),
      },
    },
    200
  )
})

/** DELETE /api/stock/config/:id - 删除股票配置 */
stock.use(deleteStockConfigRoute.path, requireAuth, requirePermission('stock:config:delete'))
stock.openapi(deleteStockConfigRoute, async (c) => {
  const { id } = c.req.valid('param')
  await deleteStockConfig(id)
  return c.json({
    code: 'OK',
    message: '删除成功',
  })
})

export { stock }
