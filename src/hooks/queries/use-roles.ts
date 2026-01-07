/**
 * 角色 React Query Hooks
 * @description 角色 CRUD 操作的 React Query Hooks
 * @requirements 11.2
 */

import { getApiClient } from '@/lib/client'
import type {
  CreateRoleInput,
  RoleQuery,
  UpdateRoleInput,
  UpdateRoleMenusInput,
} from '@/server/routes/roles/dtos'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * 查询键
 */
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params: RoleQuery) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
}

/**
 * 获取角色列表
 */
export function useRoles(params: RoleQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: async () => {
      const response = await getApiClient().roles.$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.keyword && { keyword: params.keyword }),
          ...(params.status !== undefined && { status: String(params.status) }),
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '获取角色列表失败')
      }
      return response.json()
    },
  })
}

/**
 * 获取所有角色（不分页，用于下拉选择）
 */
export function useAllRoles() {
  return useQuery({
    queryKey: [...roleKeys.all, 'all'],
    queryFn: async () => {
      const response = await getApiClient().roles.$get({
        query: {
          page: '1',
          pageSize: '1000', // 获取所有角色
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '获取角色列表失败')
      }
      const data = await response.json()
      return data.items
    },
  })
}

/**
 * 获取角色详情
 */
export function useRole(id: number) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await getApiClient().roles[':id'].$get({
        param: { id: String(id) },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '获取角色详情失败')
      }
      return response.json()
    },
    enabled: id > 0,
  })
}

/**
 * 创建角色
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const response = await getApiClient().roles.$post({
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '创建角色失败')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}

/**
 * 更新角色
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateRoleInput }) => {
      const response = await getApiClient().roles[':id'].$put({
        param: { id: String(id) },
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '更新角色失败')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
    },
  })
}

/**
 * 删除角色
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await getApiClient().roles[':id'].$delete({
        param: { id: String(id) },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '删除角色失败')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}

/**
 * 更新角色菜单权限
 */
export function useUpdateRoleMenus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateRoleMenusInput }) => {
      const response = await getApiClient().roles[':id'].menus.$put({
        param: { id: String(id) },
        json: input,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error as { message?: string }).message || '更新角色菜单权限失败')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
    },
  })
}
