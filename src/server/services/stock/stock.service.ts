/**
 * 股票服务
 */

import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { stockConfig, stockData } from '@/db/schema'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logging'
import type { CreateStockConfigInput, StockPushInput, UpdateStockConfigInput } from './models'
import type { CachedStockData, StockDataVo } from './models'
import {
  deleteCachedData,
  ensureCacheInitialized,
  floorToTenMinutes,
  getCachedData,
  setCachedData,
  shouldPersist,
} from './stock.cache'

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
export async function createStockConfig(input: CreateStockConfigInput) {
  const existing = await db.query.stockConfig.findFirst({
    where: eq(stockConfig.stockCode, input.stockCode),
  })
  if (existing) {
    throw new ValidationError(`股票代码 ${input.stockCode} 已存在`)
  }

  let sortOrder = input.sortOrder ?? 0
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
export async function updateStockConfig(id: number, input: UpdateStockConfigInput) {
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
  deleteCachedData(existing.stockCode)
}

// ========== 股票数据 ==========

/** 推送股票数据（先更新缓存，再异步入库） */
export async function pushStockData(input: StockPushInput): Promise<void> {
  const createTime = input.createTime ? new Date(input.createTime) : new Date()

  await ensureCacheInitialized()

  // 1. 更新内存缓存
  const cachedData: CachedStockData = {
    stockCode: input.stockCode,
    stockName: input.stockName ?? null,
    totalScore: input.totalScore ?? null,
    greaterThanM5Price: input.greaterThanM5Price ?? null,
    greaterThanM10Price: input.greaterThanM10Price ?? null,
    greaterThanM20Price: input.greaterThanM20Price ?? null,
    m0Percent: input.m0Percent ?? null,
    m5Percent: input.m5Percent ?? null,
    m10Percent: input.m10Percent ?? null,
    m20Percent: input.m20Percent ?? null,
    maMeanRatio: input.maMeanRatio ?? null,
    growthStockCount: input.growthStockCount ?? null,
    totalStockCount: input.totalStockCount ?? null,
    latestPrice: input.latestPrice ?? null,
    isEtf: input.isETF ?? null,
    createTime,
  }
  setCachedData(input.stockCode, cachedData)
  logger.debug(`[StockCache] 缓存已更新: ${input.stockCode}`)

  // 2. 判断是否需要入库
  if (!shouldPersist(createTime)) {
    logger.debug(`[StockCache] 非入库时间点，跳过入库: ${input.stockCode} @ ${createTime.toISOString()}`)
    return
  }

  // 3. 异步入库（不阻塞响应）
  const flooredTime = floorToTenMinutes(createTime)
  persistStockData(input, flooredTime).catch((err) => {
    logger.error(`[StockCache] 入库失败: ${input.stockCode}`, err)
  })
}

/** 持久化股票数据（upsert 逻辑） */
async function persistStockData(input: StockPushInput, flooredTime: Date): Promise<void> {
  const existing = await db.query.stockData.findFirst({
    where: and(
      eq(stockData.stockCode, input.stockCode),
      eq(stockData.createTime, flooredTime)
    ),
  })

  const dataValues = {
    stockCode: input.stockCode,
    stockName: input.stockName,
    latestPrice: input.latestPrice,
    createTime: flooredTime,
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
  }

  if (existing) {
    await db.update(stockData).set(dataValues).where(eq(stockData.id, existing.id))
    logger.info(`[StockCache] 数据已覆盖: ${input.stockCode} @ ${flooredTime.toISOString()}`)
  } else {
    await db.insert(stockData).values(dataValues)
    logger.info(`[StockCache] 数据已入库: ${input.stockCode} @ ${flooredTime.toISOString()}`)
  }
}

/** 获取股票数据列表（优先从缓存读取） */
export async function getStockDataList(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<StockDataVo[]> {
  await ensureCacheInitialized()

  const configs = await db.query.stockConfig.findMany({
    orderBy: [asc(stockConfig.sortOrder), asc(stockConfig.id)],
  })

  if (configs.length === 0) {
    return []
  }

  // 从缓存构建结果
  let result: StockDataVo[] = configs.map((config) => {
    const cached = getCachedData(config.stockCode)
    return {
      id: 0,
      stockCode: config.stockCode,
      stockName: cached?.stockName ?? null,
      industry: config.industry ?? '',
      totalScore: cached?.totalScore ?? null,
      greaterThanM5Price: cached?.greaterThanM5Price ?? null,
      greaterThanM10Price: cached?.greaterThanM10Price ?? null,
      greaterThanM20Price: cached?.greaterThanM20Price ?? null,
      m0Percent: cached?.m0Percent ?? null,
      m5Percent: cached?.m5Percent ?? null,
      m10Percent: cached?.m10Percent ?? null,
      m20Percent: cached?.m20Percent ?? null,
      maMeanRatio: cached?.maMeanRatio ?? null,
      growthStockCount: cached?.growthStockCount ?? null,
      totalStockCount: cached?.totalStockCount ?? null,
      latestPrice: cached?.latestPrice ?? null,
      createTime: cached?.createTime?.toISOString() ?? new Date().toISOString(),
    }
  })

  // 排序
  if (sortBy) {
    const direction = sortOrder === 'desc' ? -1 : 1
    result = result.sort((a, b) => {
      const aVal = a[sortBy as keyof StockDataVo]
      const bVal = b[sortBy as keyof StockDataVo]
      if (aVal === null) return 1
      if (bVal === null) return -1
      if (aVal < bVal) return -1 * direction
      if (aVal > bVal) return 1 * direction
      return 0
    })
  }

  return result
}
