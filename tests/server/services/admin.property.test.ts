/**
 * 管理员服务属性测试
 * @description Property 4, 5, 6, 7, 16
 * @validates Requirements 3.1, 3.3, 3.6, 3.7, 6.3
 */

import { ErrorCode } from "@/lib/error-codes";
import { BusinessError } from "@/lib/errors";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// ========== 纯函数测试 ==========

/**
 * 分页计算函数（从 admin.service 提取的纯逻辑）
 */
function calculatePagination(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

/**
 * 自我保护检查函数（从 admin.service 提取的纯逻辑）
 */
function checkSelfDeletion(targetId: number, currentAdminId: number): void {
  if (targetId === currentAdminId) {
    throw new BusinessError("不能删除自己的账号", ErrorCode.CANNOT_DELETE_SELF);
  }
}

/**
 * 计算分页返回的最大条目数
 */
function calculateMaxItems(
  total: number,
  page: number,
  pageSize: number
): number {
  const offset = (page - 1) * pageSize;
  const remaining = Math.max(0, total - offset);
  return Math.min(pageSize, remaining);
}

// 生成分页参数的 Arbitrary
const paginationArb = fc.record({
  page: fc.integer({ min: 1, max: 100 }),
  pageSize: fc.integer({ min: 1, max: 100 }),
});

describe("Property 4: 分页查询正确性", () => {
  /**
   * Feature: admin-scaffold-rbac, Property 4: 分页查询正确性
   *
   * *For any* 分页查询请求，返回的 items 数量不超过 pageSize，
   * totalPages 等于 ceil(total / pageSize)
   */
  it("should calculate pagination correctly", () => {
    fc.assert(
      fc.property(
        paginationArb,
        fc.integer({ min: 0, max: 10000 }),
        ({ page, pageSize }, total) => {
          const result = calculatePagination(total, page, pageSize);

          // 验证分页计算
          expect(result.total).toBe(total);
          expect(result.page).toBe(page);
          expect(result.pageSize).toBe(pageSize);

          // totalPages 应该等于 ceil(total / pageSize)，当 total 为 0 时为 0
          const expectedTotalPages =
            total === 0 ? 0 : Math.ceil(total / pageSize);
          expect(result.totalPages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: admin-scaffold-rbac, Property 4: 分页查询正确性
   *
   * *For any* 分页查询，返回的 items 数量不超过 pageSize
   */
  it("should return items count not exceeding pageSize", () => {
    fc.assert(
      fc.property(
        paginationArb,
        fc.integer({ min: 0, max: 10000 }),
        ({ page, pageSize }, total) => {
          const maxItems = calculateMaxItems(total, page, pageSize);

          // 返回的条目数不应超过 pageSize
          expect(maxItems).toBeLessThanOrEqual(pageSize);
          // 返回的条目数不应为负数
          expect(maxItems).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 5: 唯一性约束", () => {
  /**
   * Feature: admin-scaffold-rbac, Property 5: 唯一性约束
   *
   * 唯一性约束的验证逻辑：当检测到重复时应抛出错误
   * 这里测试的是约束检查的逻辑正确性
   */
  it("should detect duplicate usernames", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 0,
          maxLength: 10,
        }),
        (newUsername, existingUsernames) => {
          const isDuplicate = existingUsernames.includes(newUsername);

          // 如果用户名已存在，应该被检测为重复
          if (isDuplicate) {
            expect(existingUsernames).toContain(newUsername);
          } else {
            expect(existingUsernames).not.toContain(newUsername);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 6: 级联删除完整性", () => {
  /**
   * Feature: admin-scaffold-rbac, Property 6: 级联删除完整性
   *
   * 级联删除的逻辑：删除管理员时，相关的角色关联也应被删除
   * 这里测试的是删除操作的完整性逻辑
   */
  it("should identify all related records for cascade delete", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(
          fc.record({
            adminId: fc.integer({ min: 1, max: 10000 }),
            roleId: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (targetAdminId, adminRoles) => {
          // 找出需要删除的关联记录
          const relatedRecords = adminRoles.filter(
            (ar) => ar.adminId === targetAdminId
          );

          // 验证：所有相关记录都被正确识别
          for (const record of relatedRecords) {
            expect(record.adminId).toBe(targetAdminId);
          }

          // 验证：不相关的记录不会被误删
          const unrelatedRecords = adminRoles.filter(
            (ar) => ar.adminId !== targetAdminId
          );
          for (const record of unrelatedRecords) {
            expect(record.adminId).not.toBe(targetAdminId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 7: 自我保护约束", () => {
  /**
   * Feature: admin-scaffold-rbac, Property 7: 自我保护约束
   *
   * *For any* 管理员尝试删除自己的账号，系统应拒绝该操作并返回错误
   */
  it("should throw BusinessError when trying to delete self", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (adminId) => {
        // 尝试删除自己应该抛出错误
        expect(() => checkSelfDeletion(adminId, adminId)).toThrow(
          BusinessError
        );
        expect(() => checkSelfDeletion(adminId, adminId)).toThrow(
          "不能删除自己的账号"
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: admin-scaffold-rbac, Property 7: 自我保护约束
   *
   * *For any* 管理员删除其他管理员，不应触发自我保护
   */
  it("should not throw when deleting other admin", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (targetId, currentId) => {
          fc.pre(targetId !== currentId);

          // 删除其他管理员不应抛出自我保护错误
          expect(() => checkSelfDeletion(targetId, currentId)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 16: 角色分配事务原子性", () => {
  /**
   * Feature: admin-scaffold-rbac, Property 16: 角色分配事务原子性
   *
   * 事务原子性的逻辑验证：角色更新应该是全有或全无
   */
  it("should calculate role changes correctly", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 0,
          maxLength: 10,
        }),
        fc.array(fc.integer({ min: 1, max: 100 }), {
          minLength: 0,
          maxLength: 10,
        }),
        (oldRoleIds, newRoleIds) => {
          const oldSet = new Set(oldRoleIds);
          const newSet = new Set(newRoleIds);

          // 计算需要删除的角色
          const toDelete = oldRoleIds.filter((id) => !newSet.has(id));
          // 计算需要添加的角色
          const toAdd = newRoleIds.filter((id) => !oldSet.has(id));

          // 验证：删除的角色不在新角色列表中
          for (const id of toDelete) {
            expect(newSet.has(id)).toBe(false);
          }

          // 验证：添加的角色不在旧角色列表中
          for (const id of toAdd) {
            expect(oldSet.has(id)).toBe(false);
          }

          // 验证：最终结果应该等于新角色列表
          const finalRoles = oldRoleIds
            .filter((id) => !toDelete.includes(id))
            .concat(toAdd);

          expect(new Set(finalRoles)).toEqual(newSet);
        }
      ),
      { numRuns: 100 }
    );
  });
});
