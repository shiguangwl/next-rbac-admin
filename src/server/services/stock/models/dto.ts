/**
 * 股票 - 输入模型
 */

/** 创建股票配置输入 */
export interface CreateStockConfigInput {
  stockCode: string
  industry?: string
  sortOrder?: number
}

/** 更新股票配置输入 */
export interface UpdateStockConfigInput {
  industry?: string
  sortOrder?: number
}

/** 股票数据推送输入 */
export interface StockPushInput {
  stockCode: string
  stockName?: string | null
  latestPrice?: number | null
  createTime?: string | null
  m5Percent?: number | null
  m10Percent?: number | null
  m20Percent?: number | null
  m0Percent?: number | null
  maMeanRatio?: number | null
  greaterThanM5Price?: number | null
  greaterThanM10Price?: number | null
  greaterThanM20Price?: number | null
  growthStockCount?: number | null
  totalStockCount?: number | null
  totalScore?: number | null
  isETF?: number | null
}
