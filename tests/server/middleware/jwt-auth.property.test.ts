import { type AdminPayload, signToken, verifyToken } from '@/lib/jwt'
/**
 * Property 2: JWT Token 结构完整性
 * Validates: Requirements 2.1, 2.7
 *
 * 测试 JWT Token 的签发和验证功能：
 * - 任意有效的 AdminPayload，签发的 Token 解码后应包含相同的 adminId 和 username
 * - Token 结构应完整，包含所有必要字段
 */
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

/**
 * 生成有效的 adminId（正整数）
 */
const adminIdArbitrary = fc.integer({ min: 1, max: 2147483647 })

/**
 * 生成有效的 username（1-50 字符，字母数字下划线）
 */
const usernameArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/)

/**
 * 生成有效的 AdminPayload
 */
const adminPayloadArbitrary = fc.record({
  adminId: adminIdArbitrary,
  username: usernameArbitrary,
})

describe('Property 2: JWT Token 结构完整性', () => {
  /**
   * Feature: admin-scaffold-rbac, Property 2: JWT Token 结构完整性 - 签发验证往返
   * Validates: Requirements 2.1, 2.7
   *
   * For any 成功登录的管理员，生成的 JWT Token 解码后必须包含 adminId 和 username 字段，
   * 且这些字段值与原始数据一致
   */
  it('should preserve adminId and username after sign and verify', () => {
    fc.assert(
      fc.property(adminPayloadArbitrary, (payload: AdminPayload) => {
        // 签发 Token
        const token = signToken(payload)

        // 验证 Token 是有效的 JWT 格式（三段式）
        expect(token.split('.')).toHaveLength(3)

        // 验证 Token
        const decoded = verifyToken(token)

        // 解码后应不为 null
        expect(decoded).not.toBeNull()

        // adminId 应一致
        expect(decoded!.adminId).toBe(payload.adminId)

        // username 应一致
        expect(decoded!.username).toBe(payload.username)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 2: JWT Token 结构完整性 - 相同 Payload 产生可验证 Token
   * Validates: Requirements 2.1, 2.7
   *
   * For any AdminPayload，多次签发的 Token 都应能正确验证并返回相同的 payload 数据
   */
  it('should produce verifiable tokens for same payload', () => {
    fc.assert(
      fc.property(adminPayloadArbitrary, (payload: AdminPayload) => {
        const token1 = signToken(payload)
        const token2 = signToken(payload)

        // 两个 Token 都应能验证
        const decoded1 = verifyToken(token1)
        const decoded2 = verifyToken(token2)

        expect(decoded1).not.toBeNull()
        expect(decoded2).not.toBeNull()

        // 两个 Token 解码后的 payload 数据应一致
        expect(decoded1!.adminId).toBe(decoded2!.adminId)
        expect(decoded1!.username).toBe(decoded2!.username)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 2: JWT Token 结构完整性 - 无效 Token 拒绝
   * Validates: Requirements 2.1, 2.7
   *
   * For any 被篡改的 Token，验证应返回 null
   */
  it('should reject tampered tokens', () => {
    fc.assert(
      fc.property(adminPayloadArbitrary, fc.string({ minLength: 1 }), (payload, tamper) => {
        const token = signToken(payload)

        // 篡改 Token（在中间插入字符）
        const parts = token.split('.')
        const tamperedPayload = parts[1] + tamper
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

        // 篡改后的 Token 应验证失败
        const decoded = verifyToken(tamperedToken)
        expect(decoded).toBeNull()
      }),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 2: JWT Token 结构完整性 - 空/无效 Token
   * Validates: Requirements 2.1, 2.7
   *
   * For any 无效格式的字符串，验证应返回 null
   */
  it('should reject invalid token formats', () => {
    fc.assert(
      fc.property(fc.string(), (invalidToken) => {
        // 跳过恰好是有效 JWT 格式的字符串（极低概率）
        if (invalidToken.split('.').length === 3) {
          return true
        }

        const decoded = verifyToken(invalidToken)
        expect(decoded).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})
