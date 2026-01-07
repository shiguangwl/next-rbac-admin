/**
 * 数据库初始化脚本
 * @description 初始化超级管理员、基础角色、系统菜单及关联关系
 * @requirements 12.1, 12.2, 12.3, 12.4, 12.5
 *
 * 使用方式: pnpm db:seed
 */

import { hashPassword } from '@/lib/password'
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { sysAdmin, sysAdminRole, sysMenu, sysRole, sysRoleMenu } from './schema'
import { ADMIN_ROLES, MENUS, ROLES, ROLE_MENUS } from './seed-data'

// 直接读取环境变量（避免 @t3-oss/env-nextjs 在 CLI 环境下的问题）
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置')
  process.exit(1)
}

async function seed() {
  console.log('🌱 开始初始化数据...')

  const pool = mysql.createPool({ uri: DATABASE_URL })
  const db = drizzle(pool, { mode: 'default' })

  try {
    // 1. 初始化角色
    console.log('📦 初始化角色...')
    for (const role of ROLES) {
      await db
        .insert(sysRole)
        .values(role)
        .onDuplicateKeyUpdate({ set: { roleName: role.roleName } })
    }
    console.log(`   ✅ 已创建 ${ROLES.length} 个角色`)

    // 2. 初始化菜单
    console.log('📦 初始化菜单...')
    for (const menu of MENUS) {
      await db
        .insert(sysMenu)
        .values(menu)
        .onDuplicateKeyUpdate({ set: { menuName: menu.menuName } })
    }
    console.log(`   ✅ 已创建 ${MENUS.length} 个菜单`)

    // 3. 初始化超级管理员
    console.log('📦 初始化超级管理员...')
    const hashedPassword = await hashPassword('admin123')
    await db
      .insert(sysAdmin)
      .values({
        id: 1,
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        status: 1,
        remark: '系统初始化创建',
      })
      .onDuplicateKeyUpdate({ set: { nickname: '超级管理员' } })
    console.log('   ✅ 已创建超级管理员 (admin/admin123)')

    // 4. 初始化角色菜单关联
    console.log('📦 初始化角色菜单关联...')
    for (const rm of ROLE_MENUS) {
      await db
        .insert(sysRoleMenu)
        .values(rm)
        .onDuplicateKeyUpdate({ set: { roleId: rm.roleId } })
    }
    console.log(`   ✅ 已创建 ${ROLE_MENUS.length} 条角色菜单关联`)

    // 5. 初始化管理员角色关联
    console.log('📦 初始化管理员角色关联...')
    for (const ar of ADMIN_ROLES) {
      await db
        .insert(sysAdminRole)
        .values(ar)
        .onDuplicateKeyUpdate({ set: { adminId: ar.adminId } })
    }
    console.log(`   ✅ 已创建 ${ADMIN_ROLES.length} 条管理员角色关联`)

    console.log('\n🎉 数据初始化完成!')
    console.log('   登录账号: admin')
    console.log('   登录密码: admin123')
  } catch (error) {
    console.error('❌ 数据初始化失败:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// 执行 seed
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
