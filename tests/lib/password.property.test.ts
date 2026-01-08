import { hashPassword, verifyPassword } from '@/lib/password'
import * as fc from 'fast-check'
/**
 * Property 1: 密码加密验证
 * Validates: Requirements 2.6, 3.2, 3.5
 *
 * 测试密码加密和验证功能的正确性：
 * - 任意密码加密后，使用原始密码验证应返回 true
 * - 任意密码加密后，使用不同密码验证应返回 false
 */
import { describe, expect, it } from 'vitest'

/**
 * 生成有效的密码字符串
 * 密码长度 1-50，包含可打印 ASCII 字符
 * 注意：bcrypt 是 CPU 密集型操作，需要限制密码长度和测试次数
 */
const passwordArbitrary = fc.string({ minLength: 1, maxLength: 50 })

/** bcrypt 操作较慢，设置较长的超时时间 */
const TEST_TIMEOUT = 60000

describe('Property 1: 密码加密验证', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 1: 密码加密验证 - 正确密码验证
   * Validates: Requirements 2.6, 3.2, 3.5
   *
   * For any 管理员密码，存储时必须使用 bcrypt 加密，
   * 且原始密码与加密后的哈希值通过 bcrypt.compare 验证应返回 true
   */
  it(
    'should verify correct password after hashing',
    async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, async (password) => {
          const hash = await hashPassword(password)

          // 验证 1: 哈希值不等于原始密码
          expect(hash).not.toBe(password)

          // 验证 2: 哈希值是有效的 bcrypt 格式（以 $2a$ 或 $2b$ 开头）
          expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/)

          // 验证 3: 使用原始密码验证应返回 true
          const isValid = await verifyPassword(password, hash)
          expect(isValid).toBe(true)
        }),
        { numRuns: 20 } // bcrypt 较慢，减少迭代次数
      )
    },
    TEST_TIMEOUT
  )

  /**
   * Feature: admin-scaffold-rbac, Property 1: 密码加密验证 - 错误密码验证
   * Validates: Requirements 2.6, 3.2, 3.5
   *
   * For any 两个不同的密码，使用一个密码的哈希值验证另一个密码应返回 false
   */
  it(
    'should reject incorrect password',
    async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, passwordArbitrary, async (password1, password2) => {
          // 跳过两个密码相同的情况
          fc.pre(password1 !== password2)

          const hash = await hashPassword(password1)

          // 使用不同密码验证应返回 false
          const isValid = await verifyPassword(password2, hash)
          expect(isValid).toBe(false)
        }),
        { numRuns: 20 } // bcrypt 较慢，减少迭代次数
      )
    },
    TEST_TIMEOUT
  )

  /**
   * Feature: admin-scaffold-rbac, Property 1: 密码加密验证 - 哈希唯一性
   * Validates: Requirements 2.6, 3.2, 3.5
   *
   * For any 密码，每次加密应产生不同的哈希值（因为 salt 不同）
   */
  it(
    'should produce different hashes for same password',
    async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, async (password) => {
          const hash1 = await hashPassword(password)
          const hash2 = await hashPassword(password)

          // 两次加密应产生不同的哈希值
          expect(hash1).not.toBe(hash2)

          // 但两个哈希值都应能验证原始密码
          expect(await verifyPassword(password, hash1)).toBe(true)
          expect(await verifyPassword(password, hash2)).toBe(true)
        }),
        { numRuns: 20 } // bcrypt 较慢，减少迭代次数
      )
    },
    TEST_TIMEOUT
  )
})
