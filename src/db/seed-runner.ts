import type { MySql2Database, MySql2DrizzleConfig } from 'drizzle-orm/mysql2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = MySql2Database<any>
import { sysAdmin, sysAdminRole, sysMenu, sysRole, sysRoleMenu } from '@/db/schema'
import { MENUS, ROLES } from '@/db/seed-data'
import { SUPER_ADMIN_ID } from '@/lib/constants'
import { hashPassword } from '@/lib/password'
import { eq } from 'drizzle-orm'

export interface SeedOptions {
  username: string
  password: string
  nickname: string
}

/**
 * 执行数据库 Seed
 */
export async function runSeed(db: AnyDatabase, options: SeedOptions): Promise<void> {
  await db.transaction(async (tx) => {
    // 初始化角色
    for (const role of ROLES) {
      await tx
        .insert(sysRole)
        .values(role)
        .onDuplicateKeyUpdate({
          set: {
            roleName: role.roleName,
            sort: role.sort,
            status: role.status,
            remark: role.remark,
          },
        })
    }

    // 初始化菜单
    for (const menu of MENUS) {
      await tx
        .insert(sysMenu)
        .values(menu)
        .onDuplicateKeyUpdate({
          set: {
            parentId: menu.parentId,
            menuType: menu.menuType,
            menuName: menu.menuName,
            permission: menu.permission,
            path: menu.path,
            component: menu.component,
            icon: menu.icon,
            sort: menu.sort,
            visible: menu.visible,
            status: menu.status,
          },
        })
    }

    // 初始化超级管理员
    const [superAdmin] = await tx
      .select({ id: sysAdmin.id })
      .from(sysAdmin)
      .where(eq(sysAdmin.id, SUPER_ADMIN_ID))
      .limit(1)

    if (!superAdmin) {
      await tx.insert(sysAdmin).values({
        id: SUPER_ADMIN_ID,
        username: options.username,
        password: await hashPassword(options.password),
        nickname: options.nickname,
        status: 1,
        remark: '系统初始化创建',
      })
    }

    // 为基础角色分配所有菜单权限
    const baseRoleId = ROLES[0]?.id
    if (!baseRoleId) {
      throw new Error('ROLES seed data is empty')
    }

    for (const menu of MENUS) {
      await tx
        .insert(sysRoleMenu)
        .values({ roleId: baseRoleId, menuId: menu.id })
        .onDuplicateKeyUpdate({ set: { roleId: baseRoleId } })
    }

    // 为超级管理员分配基础角色
    await tx
      .insert(sysAdminRole)
      .values({ adminId: SUPER_ADMIN_ID, roleId: baseRoleId })
      .onDuplicateKeyUpdate({ set: { adminId: SUPER_ADMIN_ID } })
  })
}
