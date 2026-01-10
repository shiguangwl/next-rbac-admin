/**
 * 股票 - 输出模型
 */

/** 股票配置 VO */
export interface StockConfigVo {
  id: number
  stockCode: string
  industry: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** 股票数据 VO */
export interface StockDataVo {
  id: number
  stockCode: string
  stockName: string | null
  industry: string
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
  createTime: string
}

/** 缓存股票数据结构 */
export interface CachedStockData {
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
