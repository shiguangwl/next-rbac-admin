/**
 * 股票配置 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateStockConfig, StockConfig, UpdateStockConfig } from '@/server/routes/stock/dtos'

/** 获取存储的 Token */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
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

/** 创建带认证的请求头 */
function createAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/** 查询键 */
export const stockConfigKeys = {
  all: ['stockConfig'] as const,
  list: () => [...stockConfigKeys.all, 'list'] as const,
}

/** 获取股票配置列表 */
export function useStockConfigs() {
  return useQuery<StockConfig[], Error>({
    queryKey: stockConfigKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/stock/config', {
        headers: createAuthHeaders(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '获取股票配置失败')
      }
      return data.data
    },
  })
}

/** 创建股票配置 */
export function useCreateStockConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStockConfig) => {
      const response = await fetch('/api/stock/config', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '创建股票配置失败')
      }
      return data.data as StockConfig
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockConfigKeys.list() })
    },
  })
}

/** 更新股票配置 */
export function useUpdateStockConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateStockConfig }) => {
      const response = await fetch(`/api/stock/config/${id}`, {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '更新股票配置失败')
      }
      return data.data as StockConfig
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockConfigKeys.list() })
    },
  })
}

/** 删除股票配置 */
export function useDeleteStockConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/stock/config/${id}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '删除股票配置失败')
      }
      return null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockConfigKeys.list() })
    },
  })
}
