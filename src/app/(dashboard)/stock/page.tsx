'use client'

/**
 * 股票配置管理页面
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/permission-guard'
import { EditIcon, PlusIcon, RefreshIcon, TrashIcon } from '@/components/ui/icon'
import {
  useCreateStockConfig,
  useDeleteStockConfig,
  useStockConfigs,
  useUpdateStockConfig,
} from '@/hooks/queries/use-stock-config'

type StockConfig = {
  id: number
  stockCode: string
  industry: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type FormData = {
  stockCode: string
  industry: string
  sortOrder: number
}

const defaultFormData: FormData = {
  stockCode: '',
  industry: '',
  sortOrder: 0,
}

export default function StockConfigPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<StockConfig | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [error, setError] = useState('')

  const { data: configs, isLoading, refetch } = useStockConfigs()
  const createConfig = useCreateStockConfig()
  const updateConfig = useUpdateStockConfig()
  const deleteConfig = useDeleteStockConfig()

  const handleCreate = () => {
    setEditingConfig(null)
    setFormData(defaultFormData)
    setError('')
    setDialogOpen(true)
  }

  const handleEdit = (config: StockConfig) => {
    setEditingConfig(config)
    setFormData({
      stockCode: config.stockCode,
      industry: config.industry,
      sortOrder: config.sortOrder,
    })
    setError('')
    setDialogOpen(true)
  }

  const handleDelete = async (config: StockConfig) => {
    if (!confirm(`确定要删除股票代码 "${config.stockCode}" 吗？`)) return
    try {
      await deleteConfig.mutateAsync(config.id)
      toast.success('删除成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.stockCode.trim()) {
      setError('请输入股票代码')
      return
    }

    try {
      if (editingConfig) {
        await updateConfig.mutateAsync({
          id: editingConfig.id,
          input: {
            industry: formData.industry,
            sortOrder: formData.sortOrder,
          },
        })
        toast.success('更新成功')
      } else {
        await createConfig.mutateAsync({
          stockCode: formData.stockCode.trim(),
          industry: formData.industry.trim(),
          sortOrder: formData.sortOrder,
        })
        toast.success('创建成功')
      }
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  const isPending = createConfig.isPending || updateConfig.isPending

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">股票配置</h1>
        <PermissionGuard permission="stock:config:create">
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <PlusIcon size="sm" />
            新增配置
          </button>
        </PermissionGuard>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">配置股票/ETF代码列表，供量化客户端获取进行计算</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          <RefreshIcon size="sm" />
          刷新
        </button>
      </div>

      {/* 表格 */}
      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">排序</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">股票代码</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">所属行业</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : !configs?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    暂无数据，请点击"新增配置"添加股票代码
                  </td>
                </tr>
              ) : (
                configs.map((config: StockConfig) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{config.sortOrder}</td>
                    <td className="px-4 py-3 text-sm font-mono font-medium">{config.stockCode}</td>
                    <td className="px-4 py-3 text-sm">{config.industry || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(config.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="stock:config:update">
                          <button
                            type="button"
                            onClick={() => handleEdit(config)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title="编辑"
                          >
                            <EditIcon size="sm" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="stock:config:delete">
                          <button
                            type="button"
                            onClick={() => handleDelete(config)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title="删除"
                          >
                            <TrashIcon size="sm" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 表单对话框 */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">
              {editingConfig ? '编辑配置' : '新增配置'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div>
                <label htmlFor="stockCode" className="mb-1 block text-sm text-gray-600">
                  股票代码 <span className="text-red-500">*</span>
                </label>
                <input
                  id="stockCode"
                  type="text"
                  value={formData.stockCode}
                  onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
                  disabled={!!editingConfig}
                  placeholder="如：588000.SH"
                  className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label htmlFor="industry" className="mb-1 block text-sm text-gray-600">
                  所属行业
                </label>
                <input
                  id="industry"
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="如：科技、金融、医药"
                  className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="sortOrder" className="mb-1 block text-sm text-gray-600">
                  排序值
                </label>
                <input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  placeholder="数值越小越靠前，默认按添加顺序"
                  className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isPending ? '提交中...' : '确定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
