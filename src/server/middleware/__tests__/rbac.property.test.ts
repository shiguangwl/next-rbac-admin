import type { AdminPayload, Env } from '@/server/context'
/**
 * Property 11: RBAC 权限验证
 * Property 12: 超级管理员特权
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.7
 *
 * 测试 RBAC 权限验证功能：
 * - 拥有权限时允许访问
 * - 缺少权限时返回 403
 * - 未登录时返回 401
 * - 超级管理员跳过权限验证
 */
import * as fc from 'fast-check'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createLoadPermissions,
  invalidateAllPermissionCache,
  invalidatePermissionCache,
  requirePermission,
} from '../rbac'

/** 超级管理员角色 ID */
const SUPER_ADMIN_ROLE_ID = 1

/** 生成有效的 adminId（正整数） */
const adminIdArbitrary = fc.integer({ min: 1, max: 2147483647 })

/** 生成有效的 username */
const usernameArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/)

/** 生成非超级管理员的 roleIds（不包含 1） */
const normalRoleIdsArbitrary = fc.array(fc.integer({ min: 2, max: 100 }), {
  minLength: 1,
  maxLength: 5,
})

/** 生成超级管理员的 roleIds（包含 1） */
const superAdminRoleIdsArbitrary = fc
  .array(fc.integer({ min: 1, max: 100 }), { minLength: 0, maxLength: 4 })
  .map((ids) => [SUPER_ADMIN_ROLE_ID, ...ids.filter((id) => id !== SUPER_ADMIN_ROLE_ID)])

/** 生成权限标识 */
const permissionArbitrary = fc.stringMatching(/^[a-z]+:[a-z]+:[a-z]+$/)

/**
 * 创建测试用的 Hono 应用
 */
function createTestApp(
  fetchPermissions: (adminId: number) => Promise<string[]>,
  requiredPermission: string
) {
  const app = new Hono<Env>()

  // 模拟设置 admin 上下文的中间件
  app.use('*', async (c, next) => {
    const adminHeader = c.req.header('X-Test-Admin')
    if (adminHeader) {
      c.set('admin', JSON.parse(adminHeader) as AdminPayload)
    } else {
      c.set('admin', null)
    }
    return next()
  })

  // 加载权限中间件
  app.use('*', createLoadPermissions(fetchPermissions))

  // 受保护的路由
  app.get('/protected', requirePermission(requiredPermission), (c) => {
    return c.json({ success: true })
  })

  return app
}

describe('Property 11: RBAC 权限验证', () => {
  beforeEach(() => {
    invalidateAllPermissionCache()
  })

  /**
   * Feature: admin-scaffold-rbac, Property 11: RBAC 权限验证 - 拥有权限时允许访问
   * Validates: Requirements 7.1, 7.2
   */
  it('should allow access when admin has required permission', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminIdArbitrary,
        usernameArbitrary,
        normalRoleIdsArbitrary,
        permissionArbitrary,
        async (adminId, username, roleIds, permission) => {
          invalidatePermissionCache(adminId)
          const admin: AdminPayload = { adminId, username, roleIds }
          const fetchPermissions = async () => [permission, 'other:permission:test']
          const app = createTestApp(fetchPermissions, permission)

          const res = await app.request('/protected', {
            headers: { 'X-Test-Admin': JSON.stringify(admin) },
          })

          expect(res.status).toBe(200)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 11: RBAC 权限验证 - 缺少权限时返回 403
   * Validates: Requirements 7.3
   */
  it('should return 403 when admin lacks required permission', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminIdArbitrary,
        usernameArbitrary,
        normalRoleIdsArbitrary,
        permissionArbitrary,
        permissionArbitrary,
        async (adminId, username, roleIds, requiredPermission, otherPermission) => {
          fc.pre(requiredPermission !== otherPermission)
          invalidatePermissionCache(adminId)
          const admin: AdminPayload = { adminId, username, roleIds }
          const fetchPermissions = async () => [otherPermission]
          const app = createTestApp(fetchPermissions, requiredPermission)

          const res = await app.request('/protected', {
            headers: { 'X-Test-Admin': JSON.stringify(admin) },
          })

          expect(res.status).toBe(403)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 11: RBAC 权限验证 - 未登录时返回 401
   * Validates: Requirements 7.4
   */
  it('should return 401 when not logged in', async () => {
    await fc.assert(
      fc.asyncProperty(permissionArbitrary, async (permission) => {
        const fetchPermissions = async () => []
        const app = createTestApp(fetchPermissions, permission)
        const res = await app.request('/protected')
        expect(res.status).toBe(401)
      }),
      { numRuns: 50 }
    )
  })
})

describe('Property 12: 超级管理员特权', () => {
  beforeEach(() => {
    invalidateAllPermissionCache()
  })

  /**
   * Feature: admin-scaffold-rbac, Property 12: 超级管理员特权 - 跳过权限验证
   * Validates: Requirements 7.7
   */
  it('should bypass permission check for super admin', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminIdArbitrary,
        usernameArbitrary,
        superAdminRoleIdsArbitrary,
        permissionArbitrary,
        async (adminId, username, roleIds, permission) => {
          const admin: AdminPayload = { adminId, username, roleIds }
          const fetchPermissions = async () => []
          const app = createTestApp(fetchPermissions, permission)

          const res = await app.request('/protected', {
            headers: { 'X-Test-Admin': JSON.stringify(admin) },
          })

          expect(res.status).toBe(200)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: admin-scaffold-rbac, Property 12: 超级管理员特权 - 权限列表为 ['*']
   * Validates: Requirements 7.7
   */
  it('should set permissions to ["*"] for super admin', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminIdArbitrary,
        usernameArbitrary,
        superAdminRoleIdsArbitrary,
        async (adminId, username, roleIds) => {
          const admin: AdminPayload = { adminId, username, roleIds }
          let capturedPermissions: string[] | null = null

          const app = new Hono<Env>()
          app.use('*', async (c, next) => {
            c.set('admin', admin)
            return next()
          })
          app.use(
            '*',
            createLoadPermissions(async () => [])
          )
          app.get('/test', (c) => {
            capturedPermissions = c.get('permissions')
            return c.json({ success: true })
          })

          await app.request('/test')
          expect(capturedPermissions).toEqual(['*'])
        }
      ),
      { numRuns: 50 }
    )
  })
})
