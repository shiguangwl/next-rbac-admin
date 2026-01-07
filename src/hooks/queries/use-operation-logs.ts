/**
 * 操作日志 React Query Hooks
 * @description 操作日志查询和删除的 React Query Hooks
 * @requirements 11.2
 */

import { getApiClient } from "@/lib/client";
import type { LogQuery } from "@/server/routes/operation-logs/dtos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * 查询键
 */
export const operationLogKeys = {
  all: ["operation-logs"] as const,
  lists: () => [...operationLogKeys.all, "list"] as const,
  list: (params: LogQuery) => [...operationLogKeys.lists(), params] as const,
};

/**
 * 获取操作日志列表
 */
export function useOperationLogs(params: LogQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: operationLogKeys.list(params),
    queryFn: async () => {
      const response = await getApiClient()["operation-logs"].$get({
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
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          (error as { message?: string }).message || "获取操作日志列表失败"
        );
      }
      const result = await response.json();
      return (result as { data: unknown }).data;
    },
  });
}

/**
 * 删除操作日志
 */
export function useDeleteOperationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await getApiClient()["operation-logs"][":id"].$delete({
        param: { id: String(id) },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          (error as { message?: string }).message || "删除操作日志失败"
        );
      }
      const result = await response.json();
      return (result as { data: unknown }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationLogKeys.lists() });
    },
  });
}
