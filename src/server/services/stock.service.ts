/**
 * 股票服务
 */

import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { stockConfig, stockData } from '@/db/schema'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logging'
import type { CreateStockConfig, StockPush, UpdateStockConfig } from '@/server/routes/stock/dtos'

// ========== 内存缓存 ==========

/** 缓存数据结构（每个股票只保留最新一条） */
interface CachedStockData {
  stockCode: string
  stockName: string | null
  totalScore: number | null
  greaterThanM5Price: number | null
  greaterThanM10Price: number | null
  greaterThanM20Price: number | null
  m0Percent: number | null
  m5Percent: number | null
  m10Percent: number | null
  m20Percent: number | null
  maMeanRatio: number | null
  growthStockCount: number | null
  totalStockCount: number | null
  latestPrice: number | null
  isEtf: number | null
  createTime: Date
}

/** 股票数据缓存 Map<stockCode, CachedStockData> */
const stockDataCache = new Map<string, CachedStockData>()

/** 缓存初始化状态 */
let cacheInitialized = false
let cacheInitPromise: Promise<void> | null = null

/** 允许入库的时间点（分钟数：小时 * 60 + 分钟） */
const PERSIST_TIME_POINTS = new Set([
  // 上午
  9 * 60 + 30, 9 * 60 + 40, 9 * 60 + 50,
  10 * 60 + 0, 10 * 60 + 10, 10 * 60 + 20, 10 * 60 + 30, 10 * 60 + 40, 10 * 60 + 50,
  11 * 60 + 0, 11 * 60 + 10, 11 * 60 + 20, 11 * 60 + 30,
  // 下午
  13 * 60 + 0, 13 * 60 + 10, 13 * 60 + 20, 13 * 60 + 30, 13 * 60 + 40, 13 * 60 + 50,
  14 * 60 + 0, 14 * 60 + 10, 14 * 60 + 20, 14 * 60 + 30, 14 * 60 + 40, 14 * 60 + 50,
  15 * 60 + 0,
])

/** 将时间向下取整到最近的10分钟点 */
function floorToTenMinutes(date: Date): Date {
  const result = new Date(date)
  const minutes = result.getMinutes()
  result.setMinutes(Math.floor(minutes / 10) * 10, 0, 0)
  return result
}

/** 检查时间点是否需要入库 */
function shouldPersist(date: Date): boolean {
  const floored = floorToTenMinutes(date)
  const timePoint = floored.getHours() * 60 + floored.getMinutes()
  return PERSIST_TIME_POINTS.has(timePoint)
}

/** 确保缓存已初始化（懒加载，首次请求时从数据库加载） */
async function ensureCacheInitialized() {
  if (cacheInitialized) return
  if (cacheInitPromise) return cacheInitPromise

  cacheInitPromise = loadCacheFromDb()
  await cacheInitPromise
}

/** 从数据库加载缓存数据 */
async function loadCacheFromDb() {
  if (cacheInitialized) return

  logger.info('[StockCache] 首次请求，从数据库加载缓存...')

  const configs = await db.query.stockConfig.findMany({
    columns: { stockCode: true },
  })

  if (configs.length === 0) {
    cacheInitialized = true
    logger.info('[StockCache] 无股票配置，缓存初始化完成')
    return
  }

  const stockCodes = configs.map((c) => c.stockCode)

  // 获取每个股票的最新数据
  const [rows] = await db.execute(sql`
    SELECT sd.* FROM stock_data sd
    INNER JOIN (
      SELECT stock_code, MAX(id) as max_id
      FROM stock_data
      WHERE stock_code IN (${sql.join(stockCodes.map((c) => sql`${c}`), sql`, `)})
      GROUP BY stock_code
    ) latest ON sd.stock_code = latest.stock_code AND sd.id = latest.max_id
  `)

  for (const row of rows as unknown as StockDataRow[]) {
    stockDataCache.set(row.stock_code, {
      stockCode: row.stock_code,
      stockName: row.stock_name,
      totalScore: row.total_score,
      greaterThanM5Price: row.greater_than_m5_price,
      greaterThanM10Price: row.greater_than_m10_price,
      greaterThanM20Price: row.greater_than_m20_price,
      m0Percent: row.m0_percent,
      m5Percent: row.m5_percent,
      m10Percent: row.m10_percent,
      m20Percent: row.m20_percent,
      maMeanRatio: row.ma_mean_ratio,
      growthStockCount: row.growth_stock_count,
      totalStockCount: row.total_stock_count,
      latestPrice: row.latest_price,
      isEtf: null,
      createTime: new Date(row.create_time),
    })
  }

  cacheInitialized = true
  logger.info(`[StockCache] 缓存初始化完成，已加载 ${stockDataCache.size} 条数据`)
}

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
  const existing = await db.query.stockConfig.findFirst({
    where: eq(stockConfig.stockCode, input.stockCode),
  })
  if (existing) {
    throw new ValidationError(`股票代码 ${input.stockCode} 已存在`)
  }

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
  // 同时清除缓存
  stockDataCache.delete(existing.stockCode)
}

// ========== 股票数据 ==========

/** 推送股票数据（先更新缓存，再异步入库） */
export async function pushStockData(input: StockPush) {
  const createTime = input.createTime ? new Date(input.createTime) : new Date()

  // 确保缓存已初始化
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
  stockDataCache.set(input.stockCode, cachedData)
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
async function persistStockData(input: StockPush, flooredTime: Date) {
  // 查找同一时间点、同一股票代码的记录
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
    // 覆盖已有记录
    await db.update(stockData).set(dataValues).where(eq(stockData.id, existing.id))
    logger.info(`[StockCache] 数据已覆盖: ${input.stockCode} @ ${flooredTime.toISOString()}`)
  } else {
    // 插入新记录
    await db.insert(stockData).values(dataValues)
    logger.info(`[StockCache] 数据已入库: ${input.stockCode} @ ${flooredTime.toISOString()}`)
  }
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

/** 获取股票数据列表（优先从缓存读取） */
export async function getStockDataList(sortBy?: string, sortOrder?: 'asc' | 'desc') {
  // 确保缓存已初始化（首次请求时从数据库加载）
  await ensureCacheInitialized()

  const configs = await db.query.stockConfig.findMany({
    orderBy: [asc(stockConfig.sortOrder), asc(stockConfig.id)],
  })

  if (configs.length === 0) {
    return []
  }

  // 从缓存构建结果
  let result = configs.map((config) => {
    const cached = stockDataCache.get(config.stockCode)
    return {
      id: 0,
      stockCode: config.stockCode,
      stockName: cached?.stockName ?? null,
      industry: config.industry,
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
