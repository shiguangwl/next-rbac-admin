import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ClientResponse, getApiClient, unwrapApiData } from '@/lib/client'
import type {
  Config,
  ConfigQuery,
  PaginatedConfig,
  UpdateConfigValueInput,
} from '@/server/routes/configs/dtos'

type ConfigsClient = {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  $post: (args: { json: unknown }) => Promise<ClientResponse<unknown>>
  ':id': {
    $get: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
    $put: (args: { param: { id: string }; json: unknown }) => Promise<ClientResponse<unknown>>
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
  }
}

function configsClient(): ConfigsClient {
  const client = getApiClient() as unknown as { configs: ConfigsClient }
  return client.configs
}

export const configKeys = {
  all: ['configs'] as const,
  lists: () => [...configKeys.all, 'list'] as const,
  list: (params: ConfigQuery) => [...configKeys.lists(), params] as const,
  details: () => [...configKeys.all, 'detail'] as const,
  detail: (id: number) => [...configKeys.details(), id] as const,
}

export function useConfigs(params: ConfigQuery = { page: 1, pageSize: 20 }) {
  return useQuery<PaginatedConfig, Error>({
    queryKey: configKeys.list(params),
    queryFn: async () => {
      const response = await configsClient().$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.group && { group: params.group }),
          ...(params.status !== undefined && { status: String(params.status) }),
        },
      })
      return unwrapApiData<PaginatedConfig>(response, '获取配置列表失败')
    },
  })
}

export function useConfig(id: number) {
  return useQuery<Config, Error>({
    queryKey: configKeys.detail(id),
    queryFn: async () => {
      const response = await configsClient()[':id'].$get({
        param: { id: String(id) },
      })
      return unwrapApiData<Config>(response, '获取配置详情失败')
    },
    enabled: id > 0,
  })
}

export function useCreateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      configKey: string
      configValue: string | null
      configType: string
      configGroup: string
      configName: string
      remark?: string | null
      isSystem?: number
      status?: number
    }) => {
      const response = await configsClient().$post({
        json: input,
      })
      return unwrapApiData<Config>(response, '创建配置失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() })
    },
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: { id: number; input: Partial<Config> }) => {
      const response = await configsClient()[':id'].$put({
        param: { id: String(args.id) },
        json: args.input,
      })
      return unwrapApiData<Config>(response, '更新配置失败')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() })
      queryClient.invalidateQueries({ queryKey: configKeys.detail(id) })
    },
  })
}

export function useUpdateConfigValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: { id: number; input: UpdateConfigValueInput }) => {
      const response = await configsClient()[':id'].$put({
        param: { id: String(args.id) },
        json: args.input,
      })
      return unwrapApiData<Config>(response, '更新配置值失败')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() })
      queryClient.invalidateQueries({ queryKey: configKeys.detail(id) })
    },
  })
}

export function useDeleteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await configsClient()[':id'].$delete({
        param: { id: String(id) },
      })
      return unwrapApiData<null>(response, '删除配置失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.lists() })
    },
  })
}
