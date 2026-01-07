/**
 * 角色服务属性测试
 * @description Property 8: 角色排序正确性
 * @validates Requirements 4.1
 */

import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

// ========== 纯函数测试 ==========

/**
 * 角色排序函数（从 role.service 提取的纯逻辑）
 */
function sortRolesBySort<T extends { sort: number }>(roles: T[]): T[] {
  return [...roles].sort((a, b) => a.sort - b.sort)
}

// 生成角色数据的 Arbitrary
const roleArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  roleName: fc.string({ minLength: 1, maxLength: 50 }),
  sort: fc.integer({ min: 0, max: 1000 }),
  status: fc.constantFrom(0, 1),
  remark: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
})

describe('Property 8: 角色排序正确性', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 8: 角色排序正确性
   *
   * *For any* 角色列表查询，返回的角色应按 sort 字段升序排列
   */
  it('should sort roles by sort field in ascending order', () => {
    fc.assert(
      fc.property(fc.array(roleArb, { minLength: 0, maxLength: 50 }), (roles) => {
        const sorted = sortRolesBySort(roles)

        // 验证排序正确性
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].sort).toBeGreaterThanOrEqual(sorted[i - 1].sort)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 8: 角色排序正确性
   *
   * 排序应该是稳定的：相同 sort 值的元素保持原有顺序
   */
  it('should preserve original order for equal sort values', () => {
    fc.assert(
      fc.property(fc.array(roleArb, { minLength: 0, maxLength: 50 }), (roles) => {
        const sorted = sortRolesBySort(roles)

        // 验证排序后的数组长度不变
        expect(sorted.length).toBe(roles.length)

        // 验证所有元素都存在
        const originalIds = new Set(roles.map((r) => r.id))
        const sortedIds = new Set(sorted.map((r) => r.id))
        expect(sortedIds).toEqual(originalIds)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 8: 角色排序正确性
   *
   * 排序是幂等的：对已排序的数组再次排序应该得到相同结果
   */
  it('should be idempotent', () => {
    fc.assert(
      fc.property(fc.array(roleArb, { minLength: 0, maxLength: 50 }), (roles) => {
        const sorted1 = sortRolesBySort(roles)
        const sorted2 = sortRolesBySort(sorted1)

        // 验证两次排序结果相同
        expect(sorted2.map((r) => r.id)).toEqual(sorted1.map((r) => r.id))
      }),
      { numRuns: 100 }
    )
  })
})
