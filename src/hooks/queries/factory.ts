/**
 * React Query Hooks 通用工厂
 * @description 消除 CRUD Hooks 的重复代码
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClientResponse } from 'hono/client'
import { getApiClient, unwrapApiData } from '@/lib/client'

/**
 * 资源配置接口
 */
export interface ResourceConfig<
  TList,
  TDetail,
  TCreateInput,
  TUpdateInput,
  TQuery extends Record<string, any> = Record<string, never>,
> {
  /** 资源名称（如 'admins', 'roles'） */
  resourceName: string
  /** 列表查询的错误提示 */
  listErrorMessage?: string
  /** 详情查询的错误提示 */
  detailErrorMessage?: string
  /** 创建的错误提示 */
  createErrorMessage?: string
  /** 更新的错误提示 */
  updateErrorMessage?: string
  /** 删除的错误提示 */
  deleteErrorMessage?: string
  /** 默认分页参数 */
  defaultPageSize?: number
}

/**
 * 标准 CRUD Client 接口
 */
export interface CRUDClient<TCreateInput, TUpdateInput> {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  $post: (args: { json: TCreateInput }) => Promise<ClientResponse<unknown>>
  ':id': {
    $get: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    $put: (args: { param: { id: string }; json: TUpdateInput }) => Promise<ClientResponse<unknown>>
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
  }
}

/**
 * 创建 Query Keys
 */
export function createQueryKeys(resourceName: string) {
  return {
    all: [resourceName] as const,
    lists: () => [resourceName, 'list'] as const,
    list: (params?: Record<string, any>) => [resourceName, 'list', params] as const,
    details: () => [resourceName, 'detail'] as const,
    detail: (id: number) => [resourceName, 'detail', id] as const,
  }
}

/**
 * 获取资源客户端
 */
function getResourceClient<TClient>(resourceName: string): TClient {
  const client = getApiClient() as any
  return client[resourceName] as TClient
}

/**
 * 创建标准 CRUD Hooks
 */
export function createResourceHooks<
  TList,
  TDetail,
  TCreateInput,
  TUpdateInput,
  TQuery extends Record<string, any> = Record<string, never>,
>(config: ResourceConfig<TList, TDetail, TCreateInput, TUpdateInput, TQuery>) {
  const {
    resourceName,
    listErrorMessage = `获取${resourceName}列表失败`,
    detailErrorMessage = `获取${resourceName}详情失败`,
    createErrorMessage = `创建${resourceName}失败`,
    updateErrorMessage = `更新${resourceName}失败`,
    deleteErrorMessage = `删除${resourceName}失败`,
    defaultPageSize = 20,
  } = config

  const queryKeys = createQueryKeys(resourceName)

  /**
   * 查询列表
   */
  function useList(params: TQuery & { page?: number; pageSize?: number } = {} as any) {
    return useQuery<TList, Error>({
      queryKey: queryKeys.list(params),
      queryFn: async () => {
        const client = getResourceClient<CRUDClient<TCreateInput, TUpdateInput>>(resourceName)

        // 构建查询参数
        const query: Record<string, string> = {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || defaultPageSize),
        }

        // 添加其他查询参数
        Object.keys(params).forEach((key) => {
          if (key !== 'page' && key !== 'pageSize' && params[key] !== undefined) {
            query[key] = String(params[key])
          }
        })

        const response = await client.$get({ query })
        return unwrapApiData<TList>(response, listErrorMessage)
      },
    })
  }

  /**
   * 查询详情
   */
  function useDetail(id: number) {
    return useQuery<TDetail, Error>({
      queryKey: queryKeys.detail(id),
      queryFn: async () => {
        const client = getResourceClient<CRUDClient<TCreateInput, TUpdateInput>>(resourceName)
        const response = await client[':id'].$get({ param: { id: String(id) } })
        return unwrapApiData<TDetail>(response, detailErrorMessage)
      },
      enabled: id > 0,
    })
  }

  /**
   * 创建
   */
  function useCreate() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (input: TCreateInput) => {
        const client = getResourceClient<CRUDClient<TCreateInput, TUpdateInput>>(resourceName)
        const response = await client.$post({ json: input })
        return unwrapApiData<TDetail>(response, createErrorMessage)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
      },
    })
  }

  /**
   * 更新
   */
  function useUpdate() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async ({ id, input }: { id: number; input: TUpdateInput }) => {
        const client = getResourceClient<CRUDClient<TCreateInput, TUpdateInput>>(resourceName)
        const response = await client[':id'].$put({
          param: { id: String(id) },
          json: input,
        })
        return unwrapApiData<TDetail>(response, updateErrorMessage)
      },
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) })
      },
    })
  }

  /**
   * 删除
   */
  function useDelete() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (id: number) => {
        const client = getResourceClient<CRUDClient<TCreateInput, TUpdateInput>>(resourceName)
        const response = await client[':id'].$delete({ param: { id: String(id) } })
        return unwrapApiData<null>(response, deleteErrorMessage)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
      },
    })
  }

  return {
    queryKeys,
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
  }
}
