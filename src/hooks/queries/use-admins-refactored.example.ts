/**
 * 管理员 React Query Hooks（重构版）
 * @description 使用工厂函数消除重复代码
 */

import type { Admin, AdminQuery, CreateAdminInput, PaginatedAdmin, UpdateAdminInput } from '@/server/routes/admins/dtos'
import { createResourceHooks } from './factory'

/**
 * 创建管理员 CRUD Hooks
 */
const adminHooks = createResourceHooks<
  PaginatedAdmin,
  Admin,
  CreateAdminInput,
  UpdateAdminInput,
  AdminQuery
>({
  resourceName: 'admins',
  listErrorMessage: '获取管理员列表失败',
  detailErrorMessage: '获取管理员详情失败',
  createErrorMessage: '创建管理员失败',
  updateErrorMessage: '更新管理员失败',
  deleteErrorMessage: '删除管理员失败',
})

// 导出标准接口
export const adminKeys = adminHooks.queryKeys
export const useAdmins = adminHooks.useList
export const useAdmin = adminHooks.useDetail
export const useCreateAdmin = adminHooks.useCreate
export const useUpdateAdmin = adminHooks.useUpdate
export const useDeleteAdmin = adminHooks.useDelete

/**
 * 自定义 Hooks（不在标准 CRUD 范围内的）
 */

// 如果有特殊的 Hooks（如 useResetPassword、useUpdateAdminRoles）
// 可以在这里单独实现，保持与原来相同的方式
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrapApiData } from '@/lib/client'
import type { ResetPasswordInput, UpdateAdminRolesInput } from '@/server/routes/admins/dtos'

type AdminsClient = {
  ':id': {
    'reset-password': {
      $put: (args: { param: { id: string }; json: ResetPasswordInput }) => Promise<any>
    }
    roles: {
      $put: (args: { param: { id: string }; json: UpdateAdminRolesInput }) => Promise<any>
    }
  }
}

function adminsClient(): AdminsClient {
  const client = getApiClient() as any
  return client.admins
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: ResetPasswordInput }) => {
      const response = await adminsClient()[':id']['reset-password'].$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<null>(response, '重置密码失败')
    },
  })
}

export function useUpdateAdminRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateAdminRolesInput }) => {
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

