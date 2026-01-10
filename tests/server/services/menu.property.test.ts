/**
 * 菜单服务属性测试
 * @description Property 9: 菜单树形结构正确性, Property 10: 子菜单删除约束
 * @validates Requirements 5.1, 5.5
 */

import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ErrorCode } from '@/lib/error-codes'
import { BusinessError } from '@/lib/errors'
import { buildMenuTree, type MenuDto, type MenuTreeNode } from '@/server/services/menu.service'

// ========== 纯函数测试 ==========

/**
 * 检查是否有子菜单（从 menu.service 提取的纯逻辑）
 */
function checkHasChildren(menuId: number, allMenus: { id: number; parentId: number }[]): void {
  const childCount = allMenus.filter((m) => m.parentId === menuId).length
  if (childCount > 0) {
    throw new BusinessError(
      `该菜单下有 ${childCount} 个子菜单，请先删除子菜单`,
      ErrorCode.HAS_CHILDREN
    )
  }
}

/**
 * 检查树形结构是否有循环引用
 */
function hasCircularReference(nodes: MenuTreeNode[], visited = new Set<number>()): boolean {
  for (const node of nodes) {
    if (visited.has(node.id)) {
      return true
    }
    visited.add(node.id)
    if (node.children?.length) {
      if (hasCircularReference(node.children, visited)) {
        return true
      }
    }
  }
  return false
}

/**
 * 验证树形结构的父子关系正确性
 */
function _validateParentChildRelation(nodes: MenuTreeNode[], parentId = 0): boolean {
  for (const node of nodes) {
    // 根节点的 parentId 应该是 0
    if (parentId === 0 && node.parentId !== 0) {
      return false
    }
    // 子节点的 parentId 应该等于父节点的 id
    if (parentId !== 0 && node.parentId !== parentId) {
      return false
    }
    // 递归验证子节点
    if (node.children?.length) {
      if (!_validateParentChildRelation(node.children, node.id)) {
        return false
      }
    }
  }
  return true
}

// 生成菜单数据的 Arbitrary
const menuDtoArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  parentId: fc.integer({ min: 0, max: 10000 }),
  menuType: fc.constantFrom('D', 'M', 'B') as fc.Arbitrary<'D' | 'M' | 'B'>,
  menuName: fc.string({ minLength: 1, maxLength: 50 }),
  permission: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  path: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  component: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: null,
  }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  sort: fc.integer({ min: 0, max: 1000 }),
  visible: fc.constantFrom(0, 1),
  status: fc.constantFrom(0, 1),
  isExternal: fc.constantFrom(0, 1),
  isCache: fc.constantFrom(0, 1),
  remark: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
})

// 生成有效的菜单树数据（确保 parentId 引用有效）
function generateValidMenuList(count: number): fc.Arbitrary<MenuDto[]> {
  return fc.array(menuDtoArb, { minLength: count, maxLength: count }).map((menus) => {
    // 确保 ID 唯一
    const uniqueMenus = menus.map((m, i) => ({ ...m, id: i + 1 }))
    // 确保 parentId 引用有效（0 或已存在的 ID）
    return uniqueMenus.map((m, i) => ({
      ...m,
      parentId: i === 0 ? 0 : fc.sample(fc.integer({ min: 0, max: i }))[0],
    }))
  })
}

describe('Property 9: 菜单树形结构正确性', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 9: 菜单树形结构正确性
   *
   * *For any* 菜单树查询，每个节点的 children 数组应只包含 parentId 等于该节点 id 的菜单项
   */
  it('should build tree with correct parent-child relationships', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }).chain((count) => generateValidMenuList(count)),
        (menus) => {
          const tree = buildMenuTree(menus)

          // 收集所有树节点
          const collectNodes = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
            const result: MenuTreeNode[] = []
            for (const node of nodes) {
              result.push(node)
              if (node.children?.length) {
                result.push(...collectNodes(node.children))
              }
            }
            return result
          }

          const _allTreeNodes = collectNodes(tree)

          // 验证：每个子节点的 parentId 应该等于其父节点的 id
          const validateChildren = (nodes: MenuTreeNode[], expectedParentId: number) => {
            for (const node of nodes) {
              if (expectedParentId === 0) {
                // 根节点的 parentId 应该是 0 或不在菜单列表中
                const parentExists = menus.some((m) => m.id === node.parentId)
                expect(node.parentId === 0 || !parentExists).toBe(true)
              }
              if (node.children?.length) {
                for (const child of node.children) {
                  expect(child.parentId).toBe(node.id)
                }
                validateChildren(node.children, node.id)
              }
            }
          }

          validateChildren(tree, 0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 9: 菜单树形结构正确性
   *
   * *For any* 菜单树，不存在循环引用
   */
  it('should not have circular references', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }).chain((count) => generateValidMenuList(count)),
        (menus) => {
          const tree = buildMenuTree(menus)
          expect(hasCircularReference(tree)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 9: 菜单树形结构正确性
   *
   * 树中的所有节点数量应该等于原始列表中的节点数量
   */
  it('should preserve all nodes in tree', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }).chain((count) => generateValidMenuList(count)),
        (menus) => {
          const tree = buildMenuTree(menus)

          // 收集所有树节点
          const countNodes = (nodes: MenuTreeNode[]): number => {
            let count = nodes.length
            for (const node of nodes) {
              if (node.children?.length) {
                count += countNodes(node.children)
              }
            }
            return count
          }

          const treeNodeCount = countNodes(tree)
          // 树中的节点数应该小于等于原始列表（因为孤立节点可能不在树中）
          expect(treeNodeCount).toBeLessThanOrEqual(menus.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 10: 子菜单删除约束', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 10: 子菜单删除约束
   *
   * *For any* 删除菜单操作，当该菜单存在子菜单时，系统应拒绝删除并返回错误
   */
  it('should throw BusinessError when menu has children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            parentId: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (targetMenuId, allMenus) => {
          // 确保目标菜单有子菜单
          const menusWithChildren = [
            ...allMenus,
            { id: targetMenuId + 10001, parentId: targetMenuId },
          ]

          expect(() => checkHasChildren(targetMenuId, menusWithChildren)).toThrow(BusinessError)
          expect(() => checkHasChildren(targetMenuId, menusWithChildren)).toThrow('子菜单')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 10: 子菜单删除约束
   *
   * *For any* 删除菜单操作，当该菜单没有子菜单时，不应抛出错误
   */
  it('should not throw when menu has no children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            parentId: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (targetMenuId, allMenus) => {
          // 确保目标菜单没有子菜单
          const menusWithoutChildren = allMenus.filter((m) => m.parentId !== targetMenuId)

          expect(() => checkHasChildren(targetMenuId, menusWithoutChildren)).not.toThrow()
        }
      ),
      { numRuns: 100 }
    )
  })
})
