import { env } from '@/env'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

/**
 * 全局单例模式（防止 HMR 时重复创建连接和 drizzle 实例）
 */
declare global {
  var __dbPool: mysql.Pool | undefined
  var __db: ReturnType<typeof drizzle> | undefined
}

/**
 * 创建 MySQL 连接池
 */
function createPool(): mysql.Pool {
  return mysql.createPool({
    uri: env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: env.DATABASE_MAX_CONNECTIONS,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT * 1000, // 转换为毫秒
    connectTimeout: env.DATABASE_CONNECT_TIMEOUT * 1000, // 转换为毫秒
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  })
}

/**
 * 获取数据库连接池（单例）
 */
const pool = globalThis.__dbPool ?? createPool()

if (env.NODE_ENV !== 'production') {
  globalThis.__dbPool = pool
}

/**
 * Drizzle ORM 实例
 */
export const db = globalThis.__db ?? drizzle(pool, { mode: 'default' })

if (env.NODE_ENV !== 'production') {
  globalThis.__db = db
}

/**
 * 导出连接池（用于需要直接操作连接的场景）
 */
export { pool }
