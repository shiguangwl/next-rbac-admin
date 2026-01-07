import * as fc from 'fast-check'
/**
 * Property 9: 菜单树形结构正确性
 * Validates: Requirements 5.1
 *
 * 测试菜单树构建函数的正确性：
 * - 每个节点的 children 数组应只包含 parentId 等于该节点 id 的菜单项
 * - 不存在循环引用
 */
import { describe, expect, it } from 'vitest'

// 菜单类型定义
interface MenuDto {
  id: number
  parentId: number
  menuType: 'D' | 'M' | 'B'
  menuName: string
  sort: number
}

interface MenuTreeNode extends MenuDto {
  children?: MenuTreeNode[]
}

/**
 * 从扁平列表构建树形结构
 * 这是设计文档中定义的算法实现
 */
function buildMenuTree(menus: MenuDto[]): MenuTreeNode[] {
  const menuMap = new Map<number, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  // 第一遍：创建所有节点
  for (const menu of menus) {
    menuMap.set(menu.id, { ...menu, children: [] })
  }

  // 第二遍：建立父子关系
  for (const menu of menus) {
    const node = menuMap.get(menu.id)!
    if (menu.parentId === 0) {
      roots.push(node)
    } else {
      const parent = menuMap.get(menu.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  }

  // 按 sort 排序
  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort)
    for (const node of nodes) {
      if (node.children?.length) {
        sortNodes(node.children)
      }
    }
  }
  sortNodes(roots)

  return roots
}

/**
 * 生成有效的菜单扁平列表
 * 确保 parentId 引用有效的父节点或为 0（根节点）
 */
const menuArbitrary = fc
  .array(
    fc.record({
      id: fc.integer({ min: 1, max: 1000 }),
      menuType: fc.constantFrom('D' as const, 'M' as const, 'B' as const),
      menuName: fc.string({ minLength: 1, maxLength: 20 }),
      sort: fc.integer({ min: 0, max: 100 }),
    }),
    { minLength: 0, maxLength: 50 }
  )
  .map((items) => {
    // 为每个项分配唯一 ID
    const menus: MenuDto[] = items.map((item, index) => ({
      ...item,
      id: index + 1,
      parentId: 0, // 先设为根节点
    }))

    // 随机分配父节点（确保不会循环引用）
    for (let i = 1; i < menus.length; i++) {
      // 只能引用 id 比自己小的节点作为父节点，或者为 0
      const maxParentId = menus[i].id - 1
      if (maxParentId > 0 && Math.random() > 0.3) {
        menus[i].parentId = Math.floor(Math.random() * maxParentId) + 1
      }
    }

    return menus
  })

/**
 * 收集树中所有节点的 ID
 */
function collectAllIds(nodes: MenuTreeNode[]): Set<number> {
  const ids = new Set<number>()
  const traverse = (nodeList: MenuTreeNode[]) => {
    for (const node of nodeList) {
      ids.add(node.id)
      if (node.children?.length) {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return ids
}

/**
 * 验证树中没有循环引用
 */
function hasNoCycle(nodes: MenuTreeNode[]): boolean {
  const visited = new Set<number>()
  const inStack = new Set<number>()

  const dfs = (node: MenuTreeNode): boolean => {
    if (inStack.has(node.id)) return false // 发现循环
    if (visited.has(node.id)) return true // 已访问过

    visited.add(node.id)
    inStack.add(node.id)

    for (const child of node.children || []) {
      if (!dfs(child)) return false
    }

    inStack.delete(node.id)
    return true
  }

  for (const root of nodes) {
    if (!dfs(root)) return false
  }
  return true
}

/**
 * 验证每个节点的 children 只包含 parentId 等于该节点 id 的菜单项
 */
function validateParentChildRelation(nodes: MenuTreeNode[], originalMenus: MenuDto[]): boolean {
  const menuMap = new Map(originalMenus.map((m) => [m.id, m]))

  const validate = (nodeList: MenuTreeNode[], expectedParentId: number): boolean => {
    for (const node of nodeList) {
      const original = menuMap.get(node.id)
      if (!original) return false

      // 根节点的 parentId 应该是 0
      if (expectedParentId === 0 && original.parentId !== 0) {
        // 如果父节点不存在于原始列表中，也算作根节点
        if (menuMap.has(original.parentId)) {
          return false
        }
      } else if (expectedParentId !== 0 && original.parentId !== expectedParentId) {
        return false
      }

      // 递归验证子节点
      if (node.children?.length) {
        if (!validate(node.children, node.id)) return false
      }
    }
    return true
  }

  return validate(nodes, 0)
}

describe('Property 9: 菜单树形结构正确性', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 9: 菜单树形结构正确性
   * Validates: Requirements 5.1
   */
  it('should build valid tree structure with correct parent-child relationships', () => {
    fc.assert(
      fc.property(menuArbitrary, (menus) => {
        const tree = buildMenuTree(menus)

        // 验证 1: 没有循环引用
        expect(hasNoCycle(tree)).toBe(true)

        // 验证 2: 父子关系正确
        expect(validateParentChildRelation(tree, menus)).toBe(true)

        // 验证 3: 树中的节点数量不超过原始列表
        const treeIds = collectAllIds(tree)
        expect(treeIds.size).toBeLessThanOrEqual(menus.length)

        // 验证 4: 所有根节点的 parentId 为 0 或父节点不存在
        const menuIds = new Set(menus.map((m) => m.id))
        for (const root of tree) {
          const original = menus.find((m) => m.id === root.id)
          expect(original?.parentId === 0 || !menuIds.has(original?.parentId ?? -1)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 9: 菜单树排序正确性
   * Validates: Requirements 5.1
   */
  it('should sort children by sort field', () => {
    fc.assert(
      fc.property(menuArbitrary, (menus) => {
        const tree = buildMenuTree(menus)

        // 验证每一层的节点都按 sort 排序
        const validateSorting = (nodes: MenuTreeNode[]): boolean => {
          for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].sort < nodes[i - 1].sort) return false
          }
          for (const node of nodes) {
            if (node.children?.length && !validateSorting(node.children)) {
              return false
            }
          }
          return true
        }

        expect(validateSorting(tree)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
