/**
 * 操作日志 React Query Hooks
 * @description 操作日志查询和删除的 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ClientResponse, getApiClient, unwrapApiData } from '@/lib/client'
import type { LogQuery, OperationLog } from '@/server/routes/operation-logs/dtos'

/**
 * 查询键
 */
export const operationLogKeys = {
  all: ['operation-logs'] as const,
  lists: () => [...operationLogKeys.all, 'list'] as const,
  list: (params: LogQuery) => [...operationLogKeys.lists(), params] as const,
}

type OperationLogPage = {
  items: OperationLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type OperationLogsClient = {
  $get: (args: { query: Record<string, string> }) => Promise<ClientResponse<unknown>>
  ':id': {
    $delete: (args: { param: { id: string } }) => Promise<ClientResponse<unknown>>
  }
}

function operationLogsClient(): OperationLogsClient {
  const client = getApiClient() as unknown as {
    'operation-logs': OperationLogsClient
  }
  return client['operation-logs']
}

/**
 * 获取操作日志列表
 */
export function useOperationLogs(params: LogQuery = { page: 1, pageSize: 20 }) {
  return useQuery<OperationLogPage, Error>({
    queryKey: operationLogKeys.list(params),
    queryFn: async () => {
      const response = await operationLogsClient().$get({
        query: {
          page: String(params.page || 1),
          pageSize: String(params.pageSize || 20),
          ...(params.adminId && { adminId: String(params.adminId) }),
          ...(params.adminName && { adminName: params.adminName }),
          ...(params.module && { module: params.module }),
          ...(params.operation && { operation: params.operation }),
          ...(params.status !== undefined && { status: String(params.status) }),
          ...(params.startTime && { startTime: params.startTime }),
          ...(params.endTime && { endTime: params.endTime }),
        },
      })
      return unwrapApiData<OperationLogPage>(response, '获取操作日志列表失败')
    },
  })
}

/**
 * 删除操作日志
 */
export function useDeleteOperationLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await operationLogsClient()[':id'].$delete({
        param: { id: String(id) },
      })
      return unwrapApiData<null>(response, '删除操作日志失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationLogKeys.lists() })
    },
  })
}
