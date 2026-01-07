'use client'

/**
 * 日志详情对话框
 * @description 显示操作日志的详细信息
 * @requirements 9.1
 */

type OperationLog = {
  id: number
  adminId: number | null
  adminName: string | null
  module: string | null
  operation: string | null
  description: string | null
  method: string | null
  requestMethod: string | null
  requestUrl: string | null
  requestParams: string | null
  responseResult: string | null
  ip: string | null
  ipLocation: string | null
  userAgent: string | null
  executionTime: number | null
  status: number
  errorMsg: string | null
  createdAt: string
}

interface LogDetailDialogProps {
  log: OperationLog
  onClose: () => void
}

export function LogDetailDialog({ log, onClose }: LogDetailDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-semibold">日志详情</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="关闭"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-6">
          <DetailItem label="ID" value={log.id} />
          <DetailItem label="管理员" value={log.adminName} />
          <DetailItem label="模块" value={log.module} />
          <DetailItem label="操作" value={log.operation} />
          <DetailItem label="描述" value={log.description} />
          <DetailItem label="请求方法" value={log.requestMethod} />
          <DetailItem label="请求URL" value={log.requestUrl} />
          <DetailItem label="请求参数" value={log.requestParams} isCode />
          <DetailItem label="IP" value={log.ip} />
          <DetailItem label="User-Agent" value={log.userAgent} />
          <DetailItem
            label="执行时间"
            value={log.executionTime !== null ? `${log.executionTime}ms` : null}
          />
          <DetailItem label="状态" value={log.status === 1 ? '成功' : '失败'} />
          {log.status === 0 && <DetailItem label="错误信息" value={log.errorMsg} isCode />}
          <DetailItem label="创建时间" value={new Date(log.createdAt).toLocaleString()} />
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  isCode,
}: { label: string; value: string | number | null | undefined; isCode?: boolean }) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-500">{label}</span>
      {isCode && value ? (
        <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-sm">{value}</pre>
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value ?? '-'}</p>
      )}
    </div>
  )
}

export type { OperationLog }
