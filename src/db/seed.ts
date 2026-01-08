/**
 * 数据库初始化脚本（CLI）
 * 使用方式: pnpm db:seed
 */

import 'dotenv/config'
import { env } from '@/env'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { runSeed } from './seed-runner'

const DATABASE_URL = env.DATABASE_URL
const SEED_ADMIN_USERNAME = env.SEED_ADMIN_USERNAME?.trim()
const SEED_ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD
const SEED_ADMIN_NICKNAME = env.SEED_ADMIN_NICKNAME

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置')
  process.exit(1)
}

if (!SEED_ADMIN_PASSWORD) {
  console.error('❌ SEED_ADMIN_PASSWORD 环境变量未设置')
  process.exit(1)
}

const seedConfig = {
  databaseUrl: DATABASE_URL,
  username: SEED_ADMIN_USERNAME,
  password: SEED_ADMIN_PASSWORD,
  nickname: SEED_ADMIN_NICKNAME,
}

async function main() {
  console.log('🌱 开始初始化数据...')

  const pool = mysql.createPool({ uri: seedConfig.databaseUrl })
  const db = drizzle(pool, { mode: 'default' })

  try {
    await runSeed(db, {
      username: seedConfig.username,
      password: seedConfig.password,
      nickname: seedConfig.nickname,
    })

    console.log('\n🎉 数据初始化完成!')
    console.log(`   登录账号: ${seedConfig.username}`)
  } catch (error) {
    console.error('❌ 数据初始化失败:', error)
    throw error
  } finally {
    await pool.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
