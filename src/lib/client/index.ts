/**
 * Hono RPC Client
 * @description 配置 Hono RPC 客户端，支持 SSR/CSR 区分和自动注入 Authorization
 */

import { type ClientResponse, hc } from 'hono/client'
import { env } from '@/env'
import type { AppType } from '@/server/types'

const hcApp = hc<AppType>

export type HonoClient = ReturnType<typeof hcApp>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export type ApiErrorResponse = {
  code: string
  message: string
  details?: unknown
}

export type ApiSuccessResponse<T> = {
  code: string
  message?: string
  data: T
}

export async function unwrapApiData<T>(
  response: Pick<ClientResponse<unknown>, 'ok' | 'json'>,
  fallbackMessage: string
): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (isRecord(payload) && typeof payload.message === 'string' && payload.message.trim()) {
      throw new Error(payload.message)
    }
    throw new Error(fallbackMessage)
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new Error(fallbackMessage)
  }

  return (payload as ApiSuccessResponse<T>).data
}

/**
 * 获取 API 基础 URL
 * - SSR: 使用完整 URL（服务端需要完整地址）
 * - CSR: 使用相对路径（浏览器自动补全）
 */
function getBaseUrl(): string {
  // 服务端渲染时使用完整 URL
  if (typeof window === 'undefined') {
    return env.NEXT_PUBLIC_APP_URL
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

  return hcApp(`${baseUrl}/api`, {
    headers: () => createHeaders(customToken ?? getStoredToken()),
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
