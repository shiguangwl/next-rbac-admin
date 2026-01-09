/**
 * 股票路由 DTO 定义
 */
import { z } from '@hono/zod-openapi'

// ========== 股票配置 ==========

export const StockConfigSchema = z
  .object({
    id: z.number().openapi({ description: '配置 ID' }),
    stockCode: z.string().openapi({ description: '股票代码', example: '588000.SH' }),
    industry: z.string().openapi({ description: '所属行业', example: '科技' }),
    sortOrder: z.number().openapi({ description: '排序值' }),
    createdAt: z.string().openapi({ description: '创建时间' }),
    updatedAt: z.string().openapi({ description: '更新时间' }),
  })
  .openapi('StockConfig')

export const CreateStockConfigSchema = z
  .object({
    stockCode: z.string().min(1).max(20).openapi({ description: '股票代码' }),
    industry: z.string().max(100).default('').openapi({ description: '所属行业' }),
    sortOrder: z.number().int().min(0).default(0).openapi({ description: '排序值' }),
  })
  .openapi('CreateStockConfig')

export const UpdateStockConfigSchema = z
  .object({
    industry: z.string().max(100).optional().openapi({ description: '所属行业' }),
    sortOrder: z.number().int().min(0).optional().openapi({ description: '排序值' }),
  })
  .openapi('UpdateStockConfig')

// ========== 股票数据推送 ==========

export const StockPushSchema = z
  .object({
    stockCode: z.string().openapi({ description: '股票代码' }),
    stockName: z.string().optional().openapi({ description: '股票名称' }),
    latestPrice: z.number().optional().openapi({ description: '最新价格' }),
    createTime: z.string().optional().openapi({ description: '数据时间' }),
    m5Percent: z.number().optional().openapi({ description: 'M5占比' }),
    m10Percent: z.number().optional().openapi({ description: 'M10占比' }),
    m20Percent: z.number().optional().openapi({ description: 'M20占比' }),
    m0Percent: z.number().optional().openapi({ description: 'M0占比' }),
    maMeanRatio: z.number().optional().openapi({ description: 'MA均值' }),
    greaterThanM5Price: z.number().optional().openapi({ description: '5日' }),
    greaterThanM10Price: z.number().optional().openapi({ description: '10日' }),
    greaterThanM20Price: z.number().optional().openapi({ description: '20日' }),
    growthStockCount: z.number().optional().openapi({ description: '增长股数' }),
    totalStockCount: z.number().optional().openapi({ description: '总股数' }),
    totalScore: z.number().optional().openapi({ description: '总分数' }),
    isETF: z.number().optional().openapi({ description: '是否ETF' }),
  })
  .openapi('StockPush')

// ========== 股票数据展示 ==========

export const StockDataSchema = z
  .object({
    id: z.number().openapi({ description: 'ID' }),
    stockCode: z.string().openapi({ description: '代码' }),
    stockName: z.string().nullable().openapi({ description: '名称' }),
    industry: z.string().openapi({ description: '所属行业' }),
    totalScore: z.number().nullable().openapi({ description: '总分数' }),
    greaterThanM5Price: z.number().nullable().openapi({ description: '5日' }),
    greaterThanM10Price: z.number().nullable().openapi({ description: '10日' }),
    greaterThanM20Price: z.number().nullable().openapi({ description: '20日' }),
    m0Percent: z.number().nullable().openapi({ description: 'M0占比' }),
    m5Percent: z.number().nullable().openapi({ description: 'M5占比' }),
    m10Percent: z.number().nullable().openapi({ description: 'M10占比' }),
    m20Percent: z.number().nullable().openapi({ description: 'M20占比' }),
    maMeanRatio: z.number().nullable().openapi({ description: 'MA均值' }),
    growthStockCount: z.number().nullable().openapi({ description: '增长股数' }),
    totalStockCount: z.number().nullable().openapi({ description: '总股数' }),
    latestPrice: z.number().nullable().openapi({ description: '最新价格' }),
    createTime: z.string().openapi({ description: '更新时间' }),
  })
  .openapi('StockData')

export const StockListQuerySchema = z.object({
  sortBy: z.string().optional().openapi({ description: '排序字段' }),
  sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: '排序方向' }),
})

// ========== 类型导出 ==========

export type StockConfig = z.infer<typeof StockConfigSchema>
export type CreateStockConfig = z.infer<typeof CreateStockConfigSchema>
export type UpdateStockConfig = z.infer<typeof UpdateStockConfigSchema>
export type StockPush = z.infer<typeof StockPushSchema>
export type StockData = z.infer<typeof StockDataSchema>
export type StockListQuery = z.infer<typeof StockListQuerySchema>
