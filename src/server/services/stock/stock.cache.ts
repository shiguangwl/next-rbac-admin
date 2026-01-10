/**
 * 股票数据缓存管理
 */

import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { logger } from '@/lib/logging'
import type { CachedStockData } from './models'

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

/** 将时间向下取整到最近的10分钟点 */
export function floorToTenMinutes(date: Date): Date {
  const result = new Date(date)
  const minutes = result.getMinutes()
  result.setMinutes(Math.floor(minutes / 10) * 10, 0, 0)
  return result
}

/** 检查时间点是否需要入库 */
export function shouldPersist(date: Date): boolean {
  const floored = floorToTenMinutes(date)
  const timePoint = floored.getHours() * 60 + floored.getMinutes()
  return PERSIST_TIME_POINTS.has(timePoint)
}

/** 获取缓存数据 */
export function getCachedData(stockCode: string): CachedStockData | undefined {
  return stockDataCache.get(stockCode)
}

/** 设置缓存数据 */
export function setCachedData(stockCode: string, data: CachedStockData): void {
  stockDataCache.set(stockCode, data)
}

/** 删除缓存数据 */
export function deleteCachedData(stockCode: string): void {
  stockDataCache.delete(stockCode)
}

/** 获取所有缓存的股票代码 */
export function getAllCachedCodes(): string[] {
  return Array.from(stockDataCache.keys())
}

/** 检查缓存是否已初始化 */
export function isCacheInitialized(): boolean {
  return cacheInitialized
}

/** 确保缓存已初始化（懒加载） */
export async function ensureCacheInitialized(): Promise<void> {
  if (cacheInitialized) return
  if (cacheInitPromise) return cacheInitPromise

  cacheInitPromise = loadCacheFromDb()
  await cacheInitPromise
}

/** 从数据库加载缓存数据 */
async function loadCacheFromDb(): Promise<void> {
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
