/**
 * 角色 React Query Hooks（重构版）
 * @description 使用工厂函数消除重复代码
 */

import type { CreateRoleInput, PaginatedRole, Role, RoleQuery, UpdateRoleInput } from '@/server/routes/roles/dtos'
import { createResourceHooks } from './factory'

/**
 * 创建角色标准 CRUD Hooks
 */
const roleHooks = createResourceHooks<
  PaginatedRole,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  RoleQuery
>({
  resourceName: 'roles',
  listErrorMessage: '获取角色列表失败',
  detailErrorMessage: '获取角色详情失败',
  createErrorMessage: '创建角色失败',
  updateErrorMessage: '更新角色失败',
  deleteErrorMessage: '删除角色失败',
})

// 导出标准接口
export const roleKeys = roleHooks.queryKeys
export const useRoles = roleHooks.useList
export const useRole = roleHooks.useDetail
export const useCreateRole = roleHooks.useCreate
export const useUpdateRole = roleHooks.useUpdate
export const useDeleteRole = roleHooks.useDelete

/**
 * 自定义 Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrapApiData } from '@/lib/client'
import type { UpdateRoleMenusInput } from '@/server/routes/roles/dtos'

type RolesClient = {
  all: {
    $get: () => Promise<any>
  }
  ':id': {
    menus: {
      $put: (args: { param: { id: string }; json: UpdateRoleMenusInput }) => Promise<any>
    }
  }
}

function rolesClient(): RolesClient {
  const client = getApiClient() as any
  return client.roles
}

// 获取所有角色（不分页，用于下拉选择）
export function useAllRoles() {
  return useQuery<Role[], Error>({
    queryKey: [...roleKeys.all, 'all'],
    queryFn: async () => {
      const response = await rolesClient().all.$get()
      return unwrapApiData<Role[]>(response, '获取角色列表失败')
    },
  })
}

// 更新角色菜单权限
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

