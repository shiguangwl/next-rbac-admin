/**
 * 股票服务
 */

import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { stockConfig, stockData } from '@/db/schema'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logging'
import type { CreateStockConfig, StockPush, UpdateStockConfig } from '@/server/routes/stock/dtos'

// ========== 股票配置 ==========

/** 获取所有股票配置 */
export async function getStockConfigs() {
  return db.query.stockConfig.findMany({
    orderBy: [asc(stockConfig.sortOrder), asc(stockConfig.id)],
  })
}

/** 获取股票代码列表 */
export async function getStockCodeList(): Promise<string[]> {
  const configs = await db.query.stockConfig.findMany({
    columns: { stockCode: true },
    orderBy: [asc(stockConfig.sortOrder), asc(stockConfig.id)],
  })
  return configs.map((c) => c.stockCode)
}

/** 创建股票配置 */
export async function createStockConfig(input: CreateStockConfig) {
  // 检查是否已存在
  const existing = await db.query.stockConfig.findFirst({
    where: eq(stockConfig.stockCode, input.stockCode),
  })
  if (existing) {
    throw new ValidationError(`股票代码 ${input.stockCode} 已存在`)
  }

  // 如果没有指定排序值，使用当前最大值 + 1
  let sortOrder = input.sortOrder
  if (sortOrder === 0) {
    const maxSort = await db
      .select({ max: sql<number>`COALESCE(MAX(sort_order), 0)` })
      .from(stockConfig)
    sortOrder = (maxSort[0]?.max ?? 0) + 1
  }

  const result = await db.insert(stockConfig).values({
    stockCode: input.stockCode,
    industry: input.industry,
    sortOrder,
  })

  return db.query.stockConfig.findFirst({
    where: eq(stockConfig.id, Number(result[0].insertId)),
  })
}

/** 更新股票配置 */
export async function updateStockConfig(id: number, input: UpdateStockConfig) {
  const existing = await db.query.stockConfig.findFirst({
    where: eq(stockConfig.id, id),
  })
  if (!existing) {
    throw new NotFoundError('股票配置', id)
  }

  const updateData: Record<string, unknown> = {}
  if (input.industry !== undefined) updateData.industry = input.industry
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder

  if (Object.keys(updateData).length > 0) {
    await db.update(stockConfig).set(updateData).where(eq(stockConfig.id, id))
  }

  return db.query.stockConfig.findFirst({
    where: eq(stockConfig.id, id),
  })
}

/** 删除股票配置 */
export async function deleteStockConfig(id: number) {
  const existing = await db.query.stockConfig.findFirst({
    where: eq(stockConfig.id, id),
  })
  if (!existing) {
    throw new NotFoundError('股票配置', id)
  }

  await db.delete(stockConfig).where(eq(stockConfig.id, id))
}

// ========== 股票数据 ==========

/** 推送股票数据 */
export async function pushStockData(input: StockPush) {
  const createTime = input.createTime ? new Date(input.createTime) : new Date()
  logger.info(`推送股票数据 ${JSON.stringify(input)}`)
  await db.insert(stockData).values({
    stockCode: input.stockCode,
    stockName: input.stockName,
    latestPrice: input.latestPrice,
    createTime,
    m5Percent: input.m5Percent,
    m10Percent: input.m10Percent,
    m20Percent: input.m20Percent,
    m0Percent: input.m0Percent,
    maMeanRatio: input.maMeanRatio,
    greaterThanM5Price: input.greaterThanM5Price,
    greaterThanM10Price: input.greaterThanM10Price,
    greaterThanM20Price: input.greaterThanM20Price,
    growthStockCount: input.growthStockCount,
    totalStockCount: input.totalStockCount,
    totalScore: input.totalScore,
    isEtf: input.isETF,
  })
}

interface StockDataRow {
  id: number
  stock_code: string
  stock_name: string | null
  total_score: number | null
  greater_than_m5_price: number | null
  greater_than_m10_price: number | null
  greater_than_m20_price: number | null
  m0_percent: number | null
  m5_percent: number | null
  m10_percent: number | null
  m20_percent: number | null
  ma_mean_ratio: number | null
  growth_stock_count: number | null
  total_stock_count: number | null
  latest_price: number | null
  create_time: Date | string
}

/** 获取股票数据列表（每个股票只取最新一条） */
export async function getStockDataList(sortBy?: string, sortOrder?: 'asc' | 'desc') {
  // 获取所有配置的股票代码及行业
  const configs = await db.query.stockConfig.findMany({
    orderBy: [asc(stockConfig.sortOrder), asc(stockConfig.id)],
  })

  if (configs.length === 0) {
    return []
  }

  const stockCodes = configs.map((c) => c.stockCode)

  // 使用子查询获取每个股票的最新数据（基于最大ID）
  const [rows] = await db.execute(sql`
    SELECT sd.* FROM stock_data sd
    INNER JOIN (
      SELECT stock_code, MAX(id) as max_id
      FROM stock_data
      WHERE stock_code IN (${sql.join(
        stockCodes.map((c) => sql`${c}`),
        sql`, `
      )})
      GROUP BY stock_code
    ) latest ON sd.stock_code = latest.stock_code AND sd.id = latest.max_id
  `)

  // 转换数据格式并添加行业信息
  const dataMap = new Map<string, StockDataRow>()
  for (const row of rows as unknown as StockDataRow[]) {
    dataMap.set(row.stock_code, row)
  }

  let result = configs.map((config) => {
    const data = dataMap.get(config.stockCode)
    return {
      id: data?.id ?? 0,
      stockCode: config.stockCode,
      stockName: data?.stock_name ?? null,
      industry: config.industry,
      totalScore: data?.total_score ?? null,
      greaterThanM5Price: data?.greater_than_m5_price ?? null,
      greaterThanM10Price: data?.greater_than_m10_price ?? null,
      greaterThanM20Price: data?.greater_than_m20_price ?? null,
      m0Percent: data?.m0_percent ?? null,
      m5Percent: data?.m5_percent ?? null,
      m10Percent: data?.m10_percent ?? null,
      m20Percent: data?.m20_percent ?? null,
      maMeanRatio: data?.ma_mean_ratio ?? null,
      growthStockCount: data?.growth_stock_count ?? null,
      totalStockCount: data?.total_stock_count ?? null,
      latestPrice: data?.latest_price ?? null,
      createTime: data?.create_time
        ? new Date(data.create_time).toISOString()
        : new Date().toISOString(),
    }
  })

  // 排序
  if (sortBy) {
    const direction = sortOrder === 'desc' ? -1 : 1
    result = result.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a]
      const bVal = b[sortBy as keyof typeof b]
      if (aVal === null) return 1
      if (bVal === null) return -1
      if (aVal < bVal) return -1 * direction
      if (aVal > bVal) return 1 * direction
      return 0
    })
  }

  return result
}
