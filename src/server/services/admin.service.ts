/**
 * 管理员服务
 * @description 管理员 CRUD 及角色分配业务逻辑
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.1, 6.2, 6.3
 */

import { db } from '@/db'
import { sysAdmin, sysAdminRole, sysRole } from '@/db/schema'
import { BusinessError, ConflictError, NotFoundError } from '@/lib/errors'
import { hashPassword } from '@/lib/password'
import { invalidatePermissionCache } from '@/server/middleware/rbac'
import { and, count, eq, inArray, like, sql } from 'drizzle-orm'
import type {
  AdminDto,
  CreateAdminInput,
  PaginatedResult,
  PaginationOptions,
  UpdateAdminInput,
} from './types'
import { toAdminDto } from './utils'

// 重新导出类型供外部使用
export type { PaginationOptions, PaginatedResult, AdminDto, CreateAdminInput, UpdateAdminInput }

/**
 * 获取管理员列表（分页）
 */
export async function getAdminList(
  options: PaginationOptions = {}
): Promise<PaginatedResult<AdminDto>> {
  const { page = 1, pageSize = 20, keyword, status } = options
  const offset = (page - 1) * pageSize

  // 构建查询条件
  const conditions = []
  if (keyword) {
    conditions.push(like(sysAdmin.username, `%${keyword}%`))
  }
  if (status !== undefined) {
    conditions.push(eq(sysAdmin.status, status))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // 查询总数
  const [{ total }] = await db.select({ total: count() }).from(sysAdmin).where(whereClause)

  // 查询列表
  const admins = await db
    .select()
    .from(sysAdmin)
    .where(whereClause)
    .orderBy(sql`${sysAdmin.id} DESC`)
    .limit(pageSize)
    .offset(offset)

  // 获取管理员角色
  const adminIds = admins.map((a) => a.id)
  const adminRoles =
    adminIds.length > 0
      ? await db
          .select({
            adminId: sysAdminRole.adminId,
            roleId: sysRole.id,
            roleName: sysRole.roleName,
          })
          .from(sysAdminRole)
          .innerJoin(sysRole, eq(sysAdminRole.roleId, sysRole.id))
          .where(inArray(sysAdminRole.adminId, adminIds))
      : []

  // 组装结果
  const roleMap = new Map<number, { id: number; roleName: string }[]>()
  for (const ar of adminRoles) {
    if (!roleMap.has(ar.adminId)) {
      roleMap.set(ar.adminId, [])
    }
    roleMap.get(ar.adminId)!.push({ id: ar.roleId, roleName: ar.roleName })
  }

  const items = admins.map((admin) => ({
    ...toAdminDto(admin),
    roles: roleMap.get(admin.id) || [],
  }))

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 获取管理员详情
 */
export async function getAdminById(id: number): Promise<AdminDto> {
  const admin = await db
    .select()
    .from(sysAdmin)
    .where(eq(sysAdmin.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!admin) {
    throw new NotFoundError('Admin', id)
  }

  // 获取角色
  const roles = await db
    .select({
      id: sysRole.id,
      roleName: sysRole.roleName,
    })
    .from(sysAdminRole)
    .innerJoin(sysRole, eq(sysAdminRole.roleId, sysRole.id))
    .where(eq(sysAdminRole.adminId, id))

  return {
    ...toAdminDto(admin),
    roles,
  }
}

/**
 * 创建管理员
 * @description 使用事务：同时插入 sys_admin 和 sys_admin_role
 */
export async function createAdmin(input: CreateAdminInput): Promise<AdminDto> {
  // 检查用户名是否已存在
  const existing = await db
    .select({ id: sysAdmin.id })
    .from(sysAdmin)
    .where(eq(sysAdmin.username, input.username))
    .limit(1)
    .then((rows) => rows[0])

  if (existing) {
    throw new ConflictError(`用户名 ${input.username} 已存在`)
  }

  // 加密密码
  const hashedPassword = await hashPassword(input.password)

  // 使用事务创建管理员和角色关联
  const result = await db.transaction(async (tx) => {
    // 插入管理员
    const [insertResult] = await tx.insert(sysAdmin).values({
      username: input.username,
      password: hashedPassword,
      nickname: input.nickname || '',
      status: input.status ?? 1,
      remark: input.remark,
    })

    const adminId = insertResult.insertId

    // 插入角色关联
    if (input.roleIds?.length) {
      await tx.insert(sysAdminRole).values(
        input.roleIds.map((roleId) => ({
          adminId: Number(adminId),
          roleId,
        }))
      )
    }

    return Number(adminId)
  })

  return getAdminById(result)
}

/**
 * 更新管理员
 */
export async function updateAdmin(id: number, input: UpdateAdminInput): Promise<AdminDto> {
  // 检查管理员是否存在
  const existing = await db
    .select({ id: sysAdmin.id })
    .from(sysAdmin)
    .where(eq(sysAdmin.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!existing) {
    throw new NotFoundError('Admin', id)
  }

  // 更新管理员
  await db
    .update(sysAdmin)
    .set({
      nickname: input.nickname,
      status: input.status,
      remark: input.remark,
    })
    .where(eq(sysAdmin.id, id))

  return getAdminById(id)
}

/**
 * 删除管理员
 * @description 使用事务：同时删除 sys_admin 和 sys_admin_role
 */
export async function deleteAdmin(id: number, currentAdminId: number): Promise<void> {
  // 检查是否删除自己
  if (id === currentAdminId) {
    throw new BusinessError('不能删除自己的账号', 'CANNOT_DELETE_SELF')
  }

  // 检查管理员是否存在
  const existing = await db
    .select({ id: sysAdmin.id })
    .from(sysAdmin)
    .where(eq(sysAdmin.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!existing) {
    throw new NotFoundError('Admin', id)
  }

  // 使用事务删除管理员和角色关联
  await db.transaction(async (tx) => {
    await tx.delete(sysAdminRole).where(eq(sysAdminRole.adminId, id))
    await tx.delete(sysAdmin).where(eq(sysAdmin.id, id))
  })

  invalidatePermissionCache(id)
}

/**
 * 重置密码
 */
export async function resetPassword(id: number, newPassword: string): Promise<void> {
  const existing = await db
    .select({ id: sysAdmin.id })
    .from(sysAdmin)
    .where(eq(sysAdmin.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!existing) {
    throw new NotFoundError('Admin', id)
  }

  const hashedPassword = await hashPassword(newPassword)

  await db.update(sysAdmin).set({ password: hashedPassword }).where(eq(sysAdmin.id, id))
}

/**
 * 更新管理员角色
 * @description 使用事务：先删除旧关联，再插入新关联
 */
export async function updateAdminRoles(id: number, roleIds: number[]): Promise<void> {
  const existing = await db
    .select({ id: sysAdmin.id })
    .from(sysAdmin)
    .where(eq(sysAdmin.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!existing) {
    throw new NotFoundError('Admin', id)
  }

  await db.transaction(async (tx) => {
    await tx.delete(sysAdminRole).where(eq(sysAdminRole.adminId, id))

    if (roleIds.length > 0) {
      await tx.insert(sysAdminRole).values(roleIds.map((roleId) => ({ adminId: id, roleId })))
    }
  })

  invalidatePermissionCache(id)
}
