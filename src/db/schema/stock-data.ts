/**
 * 股票数据表 Schema
 * @description 存储外部推送的股票/ETF行情数据
 */
import { sql } from 'drizzle-orm'
import {
  bigint,
  datetime,
  double,
  index,
  int,
  mysqlTable,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core'

export const stockData = mysqlTable(
  'stock_data',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    stockCode: varchar('stock_code', { length: 20 }).notNull(),
    stockName: varchar('stock_name', { length: 255 }),
    totalScore: tinyint('total_score'),
    greaterThanM5Price: tinyint('greater_than_m5_price'),
    greaterThanM10Price: tinyint('greater_than_m10_price'),
    greaterThanM20Price: tinyint('greater_than_m20_price'),
    m0Percent: double('m0_percent', { precision: 10, scale: 2 }),
    m5Percent: double('m5_percent', { precision: 10, scale: 2 }),
    m10Percent: double('m10_percent', { precision: 10, scale: 2 }),
    m20Percent: double('m20_percent', { precision: 10, scale: 2 }),
    maMeanRatio: double('ma_mean_ratio', { precision: 10, scale: 2 }),
    growthStockCount: int('growth_stock_count'),
    totalStockCount: int('total_stock_count'),
    latestPrice: double('latest_price', { precision: 10, scale: 2 }),
    isEtf: tinyint('is_etf').default(0),
    createTime: datetime('create_time').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    stockCodeIdx: index('idx_stock_code').on(table.stockCode),
    createTimeIdx: index('idx_create_time').on(table.createTime),
  })
)

export type StockData = typeof stockData.$inferSelect
export type NewStockData = typeof stockData.$inferInsert
