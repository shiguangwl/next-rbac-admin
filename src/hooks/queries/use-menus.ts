/**
 * 菜单 React Query Hooks
 * @description 菜单 CRUD 操作的 React Query Hooks
 * @requirements 11.2
 */

import { type ClientResponse, getApiClient, unwrapApiData } from '@/lib/client'
import type {
  CreateMenuInput,
  Menu,
  MenuQuery,
  MenuTreeNodeDto,
  UpdateMenuInput,
} from '@/server/routes/menus/dtos'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type MenusClient = {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  $post: (args: { json: CreateMenuInput }) => Promise<ClientResponse<unknown>>
  tree: {
    $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  }
  ':id': {
    $get: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    $put: (args: { param: { id: string }; json: UpdateMenuInput }) => Promise<
      ClientResponse<unknown>
    >
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
  }
}

function menusClient(): MenusClient {
  const client = getApiClient() as unknown as { menus: MenusClient }
  return client.menus
}

/**
 * 查询键
 */
export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (params?: MenuQuery) => [...menuKeys.lists(), params] as const,
  tree: () => [...menuKeys.all, 'tree'] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: number) => [...menuKeys.details(), id] as const,
}

/**
 * 获取菜单列表
 */
export function useMenus(params?: MenuQuery) {
  return useQuery<Menu[], Error>({
    queryKey: menuKeys.list(params),
    queryFn: async () => {
      const response = await menusClient().$get({
        query: {
          ...(params?.menuType && { menuType: params.menuType }),
          ...(params?.status !== undefined && {
            status: String(params.status),
          }),
        },
      })
      return unwrapApiData<Menu[]>(response, '获取菜单列表失败')
    },
  })
}

/**
 * 获取菜单树
 */
export function useMenuTree() {
  return useQuery<MenuTreeNodeDto[], Error>({
    queryKey: menuKeys.tree(),
    queryFn: async () => {
      const response = await menusClient().tree.$get({ query: {} })
      return unwrapApiData<MenuTreeNodeDto[]>(response, '获取菜单树失败')
    },
  })
}

/**
 * 获取菜单详情
 */
export function useMenu(id: number) {
  return useQuery<Menu, Error>({
    queryKey: menuKeys.detail(id),
    queryFn: async () => {
      const response = await menusClient()[':id'].$get({
        param: { id: String(id) },
      })
      return unwrapApiData<Menu>(response, '获取菜单详情失败')
    },
    enabled: id > 0,
  })
}

/**
 * 创建菜单
 */
export function useCreateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMenuInput) => {
      const response = await menusClient().$post({
        json: input,
      })
      return unwrapApiData<Menu>(response, '创建菜单失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}

/**
 * 更新菜单
 */
export function useUpdateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number
      input: UpdateMenuInput
    }) => {
      const response = await menusClient()[':id'].$put({
        param: { id: String(id) },
        json: input,
      })
      return unwrapApiData<Menu>(response, '更新菜单失败')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(id) })
    },
  })
}

/**
 * 删除菜单
 */
export function useDeleteMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await menusClient()[':id'].$delete({
        param: { id: String(id) },
      })
      return unwrapApiData<null>(response, '删除菜单失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}
