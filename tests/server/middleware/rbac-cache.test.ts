import type { AdminPayload } from '@/lib/jwt'
import type { Env } from '@/server/context'
import {
  createLoadPermissions,
  getPermissionCacheSize,
  invalidateAllPermissionCache,
  invalidatePermissionCache,
} from '@/server/middleware/rbac'
import { Hono } from 'hono'
/**
 * RBAC 权限缓存测试
 * 测试权限缓存功能
 */
import { beforeEach, describe, expect, it } from 'vitest'

describe('RBAC 权限缓存', () => {
  beforeEach(() => {
    invalidateAllPermissionCache()
  })

  /**
   * 测试权限缓存功能
   */
  it('should cache permissions and reuse them', async () => {
    let fetchCount = 0
    const fetchPermissions = async () => {
      fetchCount++
      return ['test:permission:read']
    }

    const admin: AdminPayload = { adminId: 2, username: 'test' }

    const app = new Hono<Env>()
    app.use('*', async (c, next) => {
      c.set('admin', admin)
      return next()
    })
    app.use('*', createLoadPermissions(fetchPermissions))
    app.get('/test', (c) => c.json({ success: true }))

    // 第一次请求
    await app.request('/test')
    expect(fetchCount).toBe(1)

    // 第二次请求应使用缓存
    await app.request('/test')
    expect(fetchCount).toBe(1)

    expect(getPermissionCacheSize()).toBe(1)
  })

  /**
   * 测试缓存失效功能
   */
  it('should invalidate cache for specific admin', async () => {
    let fetchCount = 0
    const fetchPermissions = async () => {
      fetchCount++
      return ['test:permission:read']
    }

    const admin: AdminPayload = { adminId: 100, username: 'test' }

    const app = new Hono<Env>()
    app.use('*', async (c, next) => {
      c.set('admin', admin)
      return next()
    })
    app.use('*', createLoadPermissions(fetchPermissions))
    app.get('/test', (c) => c.json({ success: true }))

    // 第一次请求
    await app.request('/test')
    expect(fetchCount).toBe(1)

    // 清除缓存
    invalidatePermissionCache(100)

    // 第三次请求应重新获取
    await app.request('/test')
    expect(fetchCount).toBe(2)
  })
})
