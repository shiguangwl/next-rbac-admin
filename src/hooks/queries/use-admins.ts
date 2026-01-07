/**
 * 管理员 React Query Hooks
 * @description 管理员 CRUD 操作的 React Query Hooks
 * @requirements 11.2
 */

import { getApiClient } from '@/lib/client'
import type {
  AdminQuery,
  CreateAdminInput,
  ResetPasswordInput,
  UpdateAdminInput,
  UpdateAdminRolesInput,
} from '@/server/routes/admins/dtos'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * 查询键
 */
export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (params: AdminQuery) => [...adminKeys.lists(), params] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminKeys.details(), id] as const,
}

/**
 * 获取管理员列表
 */
export function useAdmins(params: AdminQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: async () => {
      const response = await getApiClient().admins.$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.keyword && { keyword: params.keyword }),
          ...(params.status !== undefined && { status: String(params.status) }),
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '获取管理员列表失败')
      }
      return response.json()
    },
  })
}

/**
 * 获取管理员详情
 */
export function useAdmin(id: number) {
  return useQuery({
    queryKey: adminKeys.detail(id),
    queryFn: async () => {
      const response = await getApiClient().admins[':id'].$get({
        param: { id: String(id) },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '获取管理员详情失败')
      }
      return response.json()
    },
    enabled: id > 0,
  })
}

/**
 * 创建管理员
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAdminInput) => {
      const response = await getApiClient().admins.$post({
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '创建管理员失败')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}

/**
 * 更新管理员
 */
export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateAdminInput }) => {
      const response = await getApiClient().admins[':id'].$put({
        param: { id: String(id) },
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '更新管理员失败')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) })
    },
  })
}

/**
 * 删除管理员
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await getApiClient().admins[':id'].$delete({
        param: { id: String(id) },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '删除管理员失败')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}

/**
 * 重置密码
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: ResetPasswordInput }) => {
      const response = await getApiClient().admins[':id']['reset-password'].$put({
        param: { id: String(id) },
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '重置密码失败')
      }
      return response.json()
    },
  })
}

/**
 * 更新管理员角色
 */
export function useUpdateAdminRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateAdminRolesInput }) => {
      const response = await getApiClient().admins[':id'].roles.$put({
        param: { id: String(id) },
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '更新管理员角色失败')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) })
    },
  })
}
