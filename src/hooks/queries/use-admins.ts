/**
 * 管理员 React Query Hooks
 * @description 管理员 CRUD 操作的 React Query Hooks
 * @requirements 11.2
 */

import { type ClientResponse, getApiClient, unwrapApiData } from '@/lib/client'
import type {
  Admin,
  AdminQuery,
  CreateAdminInput,
  PaginatedAdmin,
  ResetPasswordInput,
  UpdateAdminInput,
  UpdateAdminRolesInput,
} from '@/server/routes/admins/dtos'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type AdminsClient = {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  $post: (args: { json: CreateAdminInput }) => Promise<ClientResponse<unknown>>
  ':id': {
    $get: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    $put: (args: { param: { id: string }; json: UpdateAdminInput }) => Promise<
      ClientResponse<unknown>
    >
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    roles: {
      $put: (args: {
        param: { id: string }
        json: UpdateAdminRolesInput
      }) => Promise<ClientResponse<unknown>>
    }
    'reset-password': {
      $put: (args: { param: { id: string }; json: ResetPasswordInput }) => Promise<
        ClientResponse<unknown>
      >
    }
  }
}

function adminsClient(): AdminsClient {
  const client = getApiClient() as unknown as { admins: AdminsClient }
  return client.admins
}

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
  return useQuery<PaginatedAdmin, Error>({
    queryKey: adminKeys.list(params),
    queryFn: async () => {
      const response = await adminsClient().$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.keyword && { keyword: params.keyword }),
          ...(params.status !== undefined && { status: String(params.status) }),
        },
      })
      return unwrapApiData<PaginatedAdmin>(response, '获取管理员列表失败')
    },
  })
}

/**
 * 获取管理员详情
 */
export function useAdmin(id: number) {
  return useQuery<Admin, Error>({
    queryKey: adminKeys.detail(id),
    queryFn: async () => {
      const response = await adminsClient()[':id'].$get({
        param: { id: String(id) },
      })
      return unwrapApiData<Admin>(response, '获取管理员详情失败')
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
      const response = await adminsClient().$post({
        json: input,
      })
      return unwrapApiData<Admin>(response, '创建管理员失败')
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
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateAdminInput
    }) => {
      const response = await adminsClient()[':id'].$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<Admin>(response, '更新管理员失败')
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
      const response = await adminsClient()[':id'].$delete({
        param: { id: String(id) },
      })
      return unwrapApiData<null>(response, '删除管理员失败')
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
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: ResetPasswordInput
    }) => {
      const response = await adminsClient()[':id']['reset-password'].$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<null>(response, '重置密码失败')
    },
  })
}

/**
 * 更新管理员角色
 */
export function useUpdateAdminRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateAdminRolesInput
    }) => {
      const response = await adminsClient()[':id'].roles.$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<null>(response, '更新管理员角色失败')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) })
    },
  })
}
