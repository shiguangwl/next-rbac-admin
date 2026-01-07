'use client'

/**
 * 操作日志页面
 * @description 操作日志列表、多条件筛选
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import { RefreshIcon, SearchIcon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { useDeleteOperationLog, useOperationLogs } from '@/hooks/queries/use-operation-logs'
import { useState } from 'react'
import { LogDetailDialog, type OperationLog } from './log-detail-dialog'
import { LogTableRow } from './log-table-row'

export default function LogPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({
    adminName: '',
    module: '',
    operation: '',
    status: '' as '' | '0' | '1',
    startTime: '',
    endTime: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [detailLog, setDetailLog] = useState<OperationLog | null>(null)

  const { data, isLoading, refetch } = useOperationLogs({
    page,
    pageSize,
    adminName: appliedFilters.adminName || undefined,
    module: appliedFilters.module || undefined,
    operation: appliedFilters.operation || undefined,
    status: appliedFilters.status ? Number(appliedFilters.status) : undefined,
    startTime: appliedFilters.startTime || undefined,
    endTime: appliedFilters.endTime || undefined,
  })
  const deleteLog = useDeleteOperationLog()

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleReset = () => {
    const resetFilters = {
      adminName: '',
      module: '',
      operation: '',
      status: '' as const,
      startTime: '',
      endTime: '',
    }
    setFilters(resetFilters)
    setAppliedFilters(resetFilters)
    setPage(1)
  }

  const handleDelete = async (log: OperationLog) => {
    if (!confirm('确定要删除这条日志吗？')) return
    try {
      await deleteLog.mutateAsync(log.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          <RefreshIcon size="sm" />
          刷新
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="log-filter-adminName" className="mb-1 block text-sm text-gray-600">
              管理员
            </label>
            <input
              id="log-filter-adminName"
              type="text"
              value={filters.adminName}
              onChange={(e) => setFilters({ ...filters, adminName: e.target.value })}
              placeholder="请输入管理员名称"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="log-filter-module" className="mb-1 block text-sm text-gray-600">
              模块
            </label>
            <input
              id="log-filter-module"
              type="text"
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              placeholder="请输入模块名称"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="log-filter-operation" className="mb-1 block text-sm text-gray-600">
              操作类型
            </label>
            <input
              id="log-filter-operation"
              type="text"
              value={filters.operation}
              onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
              placeholder="请输入操作类型"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="log-filter-status" className="mb-1 block text-sm text-gray-600">
              状态
            </label>
            <select
              id="log-filter-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as '' | '0' | '1' })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">全部</option>
              <option value="1">成功</option>
              <option value="0">失败</option>
            </select>
          </div>
          <div>
            <label htmlFor="log-filter-startTime" className="mb-1 block text-sm text-gray-600">
              开始时间
            </label>
            <input
              id="log-filter-startTime"
              type="datetime-local"
              value={filters.startTime}
              onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="log-filter-endTime" className="mb-1 block text-sm text-gray-600">
              结束时间
            </label>
            <input
              id="log-filter-endTime"
              type="datetime-local"
              value={filters.endTime}
              onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <SearchIcon size="sm" />
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">管理员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模块</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">请求方法</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">耗时</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.items.map((log: OperationLog) => (
                  <LogTableRow
                    key={log.id}
                    log={log}
                    onViewDetail={setDetailLog}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="border-t px-4 py-3">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>

      {detailLog && <LogDetailDialog log={detailLog} onClose={() => setDetailLog(null)} />}
    </div>
  )
}
