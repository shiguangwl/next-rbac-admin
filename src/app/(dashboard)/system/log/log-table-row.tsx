'use client'

/**
 * 日志表格行组件
 * @description 操作日志表格的单行显示
 */

import { PermissionGuard } from '@/components/permission-guard'
import { TrashIcon } from '@/components/ui/icon'
import type { OperationLog } from './log-detail-dialog'

interface LogTableRowProps {
  log: OperationLog
  onViewDetail: (log: OperationLog) => void
  onDelete: (log: OperationLog) => void
}

export function LogTableRow({ log, onViewDetail, onDelete }: LogTableRowProps) {
  const methodColorClass = getMethodColorClass(log.requestMethod)
  const statusColorClass =
    log.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">{log.id}</td>
      <td className="px-4 py-3 text-sm">{log.adminName || '-'}</td>
      <td className="px-4 py-3 text-sm">{log.module || '-'}</td>
      <td className="px-4 py-3 text-sm">{log.operation || '-'}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${methodColorClass}`}>
          {log.requestMethod || '-'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{log.ip || '-'}</td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {log.executionTime !== null ? `${log.executionTime}ms` : '-'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColorClass}`}
        >
          {log.status === 1 ? '成功' : '失败'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(log.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetail(log)}
            className="rounded p-1 text-blue-600 hover:bg-blue-50"
            title="详情"
            aria-label="查看详情"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <PermissionGuard permission="system:log:delete">
            <button
              type="button"
              onClick={() => onDelete(log)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="删除"
            >
              <TrashIcon size="sm" />
            </button>
          </PermissionGuard>
        </div>
      </td>
    </tr>
  )
}

function getMethodColorClass(method: string | null): string {
  switch (method) {
    case 'GET':
      return 'bg-green-100 text-green-700'
    case 'POST':
      return 'bg-blue-100 text-blue-700'
    case 'PUT':
      return 'bg-orange-100 text-orange-700'
    case 'DELETE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
