/**
 * 认证服务属性测试
 * @description Property 3: 登录凭据验证
 * @validates Requirements 2.2, 2.3
 */

import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessError, UnauthorizedError } from '@/lib/errors'
import { hashPassword } from '@/lib/password'

// Mock 数据库模块
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))

// Mock JWT 模块
vi.mock('@/lib/jwt', () => ({
  signToken: vi.fn(() => 'mock-token'),
}))

// 生成有效用户名的 Arbitrary
const validUsername = fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length > 0)

// 生成有效密码的 Arbitrary
const validPassword = fc.string({ minLength: 6, maxLength: 20 }).filter((s) => s.trim().length > 0)

describe('Property 3: 登录凭据验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Feature: admin-scaffold-rbac, Property 3: 登录凭据验证
   *
   * *For any* 登录请求，当用户名不存在时，系统应返回 401 错误
   */
  it('should return 401 when username does not exist', async () => {
    const { db } = await import('@/db')
    const { login } = await import('@/server/services/auth.service')

    await fc.assert(
      fc.asyncProperty(validUsername, validPassword, async (username, password) => {
        // Mock: 用户不存在
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)

        await expect(login({ username, password })).rejects.toThrow(UnauthorizedError)
        await expect(login({ username, password })).rejects.toThrow('用户名或密码错误')
      }),
      { numRuns: 100 }
    )
  }, 30000)

  /**
   * Feature: admin-scaffold-rbac, Property 3: 登录凭据验证
   *
   * *For any* 登录请求，当密码不匹配时，系统应返回 401 错误
   */
  it('should return 401 when password does not match', async () => {
    const { db } = await import('@/db')
    const { login } = await import('@/server/services/auth.service')

    await fc.assert(
      fc.asyncProperty(
        validUsername,
        validPassword,
        validPassword,
        async (username, correctPassword, wrongPassword) => {
          // 确保密码不同
          fc.pre(correctPassword !== wrongPassword)

          const hashedPassword = await hashPassword(correctPassword)

          // Mock: 用户存在但密码不匹配
          vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 1,
                    username,
                    password: hashedPassword,
                    nickname: 'Test',
                    status: 1,
                    loginIp: null,
                    loginTime: null,
                    remark: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]),
              }),
            }),
          } as unknown as ReturnType<typeof db.select>)

          await expect(login({ username, password: wrongPassword })).rejects.toThrow(
            UnauthorizedError
          )
          await expect(login({ username, password: wrongPassword })).rejects.toThrow(
            '用户名或密码错误'
          )
        }
      ),
      { numRuns: 20 } // 减少运行次数因为 bcrypt 较慢
    )
  }, 60000)

  /**
   * Feature: admin-scaffold-rbac, Property 3: 登录凭据验证
   *
   * *For any* 登录请求，当账号状态为禁用时，系统应返回账号已禁用错误
   */
  it('should return disabled error when account status is 0', async () => {
    const { db } = await import('@/db')
    const { login } = await import('@/server/services/auth.service')

    await fc.assert(
      fc.asyncProperty(validUsername, validPassword, async (username, password) => {
        const hashedPassword = await hashPassword(password)

        // Mock: 用户存在但状态为禁用
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  username,
                  password: hashedPassword,
                  nickname: 'Test',
                  status: 0, // 禁用状态
                  loginIp: null,
                  loginTime: null,
                  remark: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)

        await expect(login({ username, password })).rejects.toThrow(BusinessError)
        await expect(login({ username, password })).rejects.toThrow('账号已禁用')
      }),
      { numRuns: 20 } // 减少运行次数因为 bcrypt 较慢
    )
  }, 60000)
})
