/**
 * Hono RPC Client
 * @description 配置 Hono RPC 客户端，支持 SSR/CSR 区分和自动注入 Authorization
 * @requirements 11.2
 */

import type { AppType } from '@/server/route-defs'
import { type ClientResponse, hc } from 'hono/client'

/**
 * Hono Client 类型
 * 由于 TypeScript 类型推断限制，这里使用 any 类型
 * 实际使用时会有正确的类型提示
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HonoClient = any

/**
 * 获取 API 基础 URL
 * - SSR: 使用完整 URL（服务端需要完整地址）
 * - CSR: 使用相对路径（浏览器自动补全）
 */
function getBaseUrl(): string {
  // 服务端渲染时使用完整 URL
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  // 客户端使用相对路径
  return ''
}

/**
 * 获取存储的 Token
 * 从 localStorage 中读取 Zustand 持久化的认证状态
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed?.state?.token || null
    }
  } catch {
    // 解析失败时返回 null
  }
  return null
}

/**
 * 创建请求头
 */
function createHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * 创建 Hono RPC Client
 * @param customToken 可选的自定义 Token（用于 SSR 场景）
 */
export function createClient(customToken?: string): HonoClient {
  const baseUrl = getBaseUrl()
  const token = customToken || getStoredToken()

  return hc<AppType>(`${baseUrl}/api`, {
    headers: () => createHeaders(token),
  })
}

/**
 * 获取 API 客户端
 * 每次调用都会重新获取 token，确保使用最新的认证状态
 */
export function getApiClient(): HonoClient {
  return createClient()
}

/**
 * 类型导出
 */
export type { ClientResponse }
