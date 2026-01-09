/**
 * 股票配置表 Schema
 * @description 存储股票/ETF代码配置及所属行业
 */
import { sql } from 'drizzle-orm'
import { bigint, datetime, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

export const stockConfig = mysqlTable(
  'stock_config',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    stockCode: varchar('stock_code', { length: 20 }).notNull(),
    industry: varchar('industry', { length: 100 }).notNull().default(''),
    sortOrder: int('sort_order', { unsigned: true }).notNull().default(0),
    createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    stockCodeIdx: uniqueIndex('uk_stock_code').on(table.stockCode),
  })
)

export type StockConfig = typeof stockConfig.$inferSelect
export type NewStockConfig = typeof stockConfig.$inferInsert
