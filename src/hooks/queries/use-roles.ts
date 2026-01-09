/**
 * 角色 React Query Hooks
 * @description 角色 CRUD 操作的 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ClientResponse, getApiClient, unwrapApiData } from '@/lib/client'
import type {
  CreateRoleInput,
  PaginatedRole,
  Role,
  RoleQuery,
  UpdateRoleInput,
  UpdateRoleMenusInput,
} from '@/server/routes/roles/dtos'

type RolesClient = {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  $post: (args: { json: CreateRoleInput }) => Promise<ClientResponse<unknown>>
  all: {
    $get: () => Promise<ClientResponse<unknown>>
  }
  ':id': {
    $get: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    $put: (args: {
      param: { id: string }
      json: UpdateRoleInput
    }) => Promise<ClientResponse<unknown>>
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    menus: {
      $put: (args: {
        param: { id: string }
        json: UpdateRoleMenusInput
      }) => Promise<ClientResponse<unknown>>
    }
  }
}

function rolesClient(): RolesClient {
  const client = getApiClient() as unknown as { roles: RolesClient }
  return client.roles
}

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
  return useQuery<PaginatedRole, Error>({
    queryKey: roleKeys.list(params),
    queryFn: async () => {
      const response = await rolesClient().$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.keyword && { keyword: params.keyword }),
          ...(params.status !== undefined && { status: String(params.status) }),
        },
      })
      return unwrapApiData<PaginatedRole>(response, '获取角色列表失败')
    },
  })
}

/**
 * 获取所有角色（不分页，用于下拉选择）
 */
export function useAllRoles() {
  return useQuery<Role[], Error>({
    queryKey: [...roleKeys.all, 'all'],
    queryFn: async () => {
      const response = await rolesClient().all.$get()
      return unwrapApiData<Role[]>(response, '获取角色列表失败')
    },
  })
}

/**
 * 获取角色详情
 */
export function useRole(id: number) {
  return useQuery<Role, Error>({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await rolesClient()[':id'].$get({
        param: { id: String(id) },
      })
      return unwrapApiData<Role>(response, '获取角色详情失败')
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
      const response = await rolesClient().$post({
        json: input,
      })
      return unwrapApiData<Role>(response, '创建角色失败')
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
      const response = await rolesClient()[':id'].$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<Role>(response, '更新角色失败')
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
      const response = await rolesClient()[':id'].$delete({
        param: { id: String(id) },
      })
      return unwrapApiData<null>(response, '删除角色失败')
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
      const response = await rolesClient()[':id'].menus.$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<null>(response, '更新角色菜单权限失败')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
    },
  })
}
