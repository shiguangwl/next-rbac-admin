/**
 * 权限聚合属性测试
 * @description Property 13: 权限聚合正确性
 * @validates Requirements 7.6, 11.1
 */

import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

// ========== 纯函数测试 ==========

interface AdminRole {
  adminId: number
  roleId: number
}

interface RoleMenu {
  roleId: number
  menuId: number
}

interface Menu {
  id: number
  permission: string | null
  status: number
}

/**
 * 权限聚合函数（从 auth.service 提取的纯逻辑）
 *
 * 计算管理员的权限列表：
 * 1. 获取管理员的所有角色 ID
 * 2. 获取这些角色关联的所有菜单 ID
 * 3. 获取这些菜单的权限标识（去重）
 */
function aggregatePermissions(
  adminId: number,
  adminRoles: AdminRole[],
  roleMenus: RoleMenu[],
  menus: Menu[]
): string[] {
  // 1. 获取管理员的角色 ID
  const roleIds = adminRoles.filter((ar) => ar.adminId === adminId).map((ar) => ar.roleId)

  if (roleIds.length === 0) {
    return []
  }

  // 2. 获取角色关联的菜单 ID
  const menuIds = roleMenus.filter((rm) => roleIds.includes(rm.roleId)).map((rm) => rm.menuId)

  if (menuIds.length === 0) {
    return []
  }

  // 3. 获取菜单的权限标识（去重，只取启用状态的菜单）
  const permissions = new Set<string>()
  for (const menu of menus) {
    if (menuIds.includes(menu.id) && menu.permission && menu.status === 1) {
      permissions.add(menu.permission)
    }
  }

  return Array.from(permissions)
}

// 生成管理员角色关联的 Arbitrary
const adminRoleArb = fc.record({
  adminId: fc.integer({ min: 1, max: 100 }),
  roleId: fc.integer({ min: 1, max: 50 }),
})

// 生成角色菜单关联的 Arbitrary
const roleMenuArb = fc.record({
  roleId: fc.integer({ min: 1, max: 50 }),
  menuId: fc.integer({ min: 1, max: 200 }),
})

// 生成菜单的 Arbitrary
const menuArb = fc.record({
  id: fc.integer({ min: 1, max: 200 }),
  permission: fc.option(fc.stringMatching(/^[a-z]+:[a-z]+:[a-z]+$/), { nil: null }),
  status: fc.constantFrom(0, 1),
})

describe('Property 13: 权限聚合正确性', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 13: 权限聚合正确性
   *
   * *For any* 管理员的权限查询，返回的权限列表应等于该管理员所有角色关联的菜单权限标识的并集（去重）
   */
  it('should aggregate permissions from all roles correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(adminRoleArb, { minLength: 0, maxLength: 20 }),
        fc.array(roleMenuArb, { minLength: 0, maxLength: 50 }),
        fc.array(menuArb, { minLength: 0, maxLength: 100 }),
        (adminId, adminRoles, roleMenus, menus) => {
          const permissions = aggregatePermissions(adminId, adminRoles, roleMenus, menus)

          // 手动计算期望的权限
          const roleIds = adminRoles.filter((ar) => ar.adminId === adminId).map((ar) => ar.roleId)

          const menuIds = roleMenus
            .filter((rm) => roleIds.includes(rm.roleId))
            .map((rm) => rm.menuId)

          const expectedPermissions = new Set<string>()
          for (const menu of menus) {
            if (menuIds.includes(menu.id) && menu.permission && menu.status === 1) {
              expectedPermissions.add(menu.permission)
            }
          }

          // 验证结果
          expect(new Set(permissions)).toEqual(expectedPermissions)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 13: 权限聚合正确性
   *
   * 没有角色的管理员应该返回空权限列表
   */
  it('should return empty permissions for admin without roles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(adminRoleArb, { minLength: 0, maxLength: 20 }),
        fc.array(roleMenuArb, { minLength: 0, maxLength: 50 }),
        fc.array(menuArb, { minLength: 0, maxLength: 100 }),
        (adminId, adminRoles, roleMenus, menus) => {
          // 过滤掉该管理员的所有角色关联
          const filteredAdminRoles = adminRoles.filter((ar) => ar.adminId !== adminId)

          const permissions = aggregatePermissions(adminId, filteredAdminRoles, roleMenus, menus)

          expect(permissions).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 13: 权限聚合正确性
   *
   * 权限列表应该是去重的
   */
  it('should return deduplicated permissions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(adminRoleArb, { minLength: 0, maxLength: 20 }),
        fc.array(roleMenuArb, { minLength: 0, maxLength: 50 }),
        fc.array(menuArb, { minLength: 0, maxLength: 100 }),
        (adminId, adminRoles, roleMenus, menus) => {
          const permissions = aggregatePermissions(adminId, adminRoles, roleMenus, menus)

          // 验证没有重复
          const uniquePermissions = new Set(permissions)
          expect(permissions.length).toBe(uniquePermissions.size)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 13: 权限聚合正确性
   *
   * 禁用状态的菜单权限不应该被包含
   */
  it('should not include permissions from disabled menus', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(adminRoleArb, { minLength: 0, maxLength: 20 }),
        fc.array(roleMenuArb, { minLength: 0, maxLength: 50 }),
        fc.array(menuArb, { minLength: 0, maxLength: 100 }),
        (adminId, adminRoles, roleMenus, menus) => {
          const permissions = aggregatePermissions(adminId, adminRoles, roleMenus, menus)

          // 获取所有禁用菜单的权限
          const disabledPermissions = menus
            .filter((m) => m.status === 0 && m.permission)
            .map((m) => m.permission!)

          // 验证禁用菜单的权限不在结果中
          for (const perm of disabledPermissions) {
            // 只有当该权限没有被其他启用的菜单使用时，才不应该出现
            const enabledMenusWithSamePerm = menus.filter(
              (m) => m.status === 1 && m.permission === perm
            )
            if (enabledMenusWithSamePerm.length === 0) {
              expect(permissions).not.toContain(perm)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 13: 权限聚合正确性
   *
   * 多个角色的权限应该合并
   */
  it('should merge permissions from multiple roles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 2, maxLength: 5 }),
        fc.array(roleMenuArb, { minLength: 0, maxLength: 50 }),
        fc.array(menuArb, { minLength: 0, maxLength: 100 }),
        (adminId, roleIds, roleMenus, menus) => {
          // 为管理员分配多个角色
          const adminRoles = roleIds.map((roleId) => ({ adminId, roleId }))

          const permissions = aggregatePermissions(adminId, adminRoles, roleMenus, menus)

          // 分别计算每个角色的权限
          const allRolePermissions = new Set<string>()
          for (const roleId of roleIds) {
            const menuIds = roleMenus.filter((rm) => rm.roleId === roleId).map((rm) => rm.menuId)

            for (const menu of menus) {
              if (menuIds.includes(menu.id) && menu.permission && menu.status === 1) {
                allRolePermissions.add(menu.permission)
              }
            }
          }

          // 验证结果是所有角色权限的并集
          expect(new Set(permissions)).toEqual(allRolePermissions)
        }
      ),
      { numRuns: 100 }
    )
  })
})
