'use client'

import { type CSSProperties, useState } from 'react'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/permission-guard'
import { RefreshIcon, SearchIcon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { useConfigs, useCreateConfig, useDeleteConfig, useUpdateConfigValue } from '@/hooks/queries'

type Config = {
  id: number
  configKey: string
  configValue: string | null
  configType: 'string' | 'boolean' | 'number' | 'json' | 'array'
  configGroup: string
  configName: string
  remark: string | null
  isSystem: number
  status: number
  createdAt: string
  updatedAt: string
}

export default function ConfigPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({
    group: '',
    keyword: '',
    status: '' as '' | '0' | '1',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [editingConfig, setEditingConfig] = useState<Config | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [creatingConfig, setCreatingConfig] = useState(false)
  const [createForm, setCreateForm] = useState({
    configKey: '',
    configValue: '',
    configType: 'string' as Config['configType'],
    configGroup: '',
    configName: '',
    remark: '',
    isSystem: 0,
    status: 1,
  })

  const { data, isLoading, refetch } = useConfigs({
    page,
    pageSize,
    group: appliedFilters.group || undefined,
    status: appliedFilters.status ? Number(appliedFilters.status) : undefined,
  })

  const createConfig = useCreateConfig()
  const updateValue = useUpdateConfigValue()
  const deleteConfig = useDeleteConfig()

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleReset = () => {
    const reset = {
      group: '',
      keyword: '',
      status: '' as const,
    }
    setFilters(reset)
    setAppliedFilters(reset)
    setPage(1)
  }

  const openEditDialog = (config: Config) => {
    setEditingConfig(config)
    setEditingValue(config.configValue ?? '')
  }

  const openCreateDialog = () => {
    setCreateForm({
      configKey: '',
      configValue: '',
      configType: 'string',
      configGroup: '',
      configName: '',
      remark: '',
      isSystem: 0,
      status: 1,
    })
    setCreatingConfig(true)
  }

  const handleSaveValue = async () => {
    if (!editingConfig) return
    try {
      await updateValue.mutateAsync({
        id: editingConfig.id,
        input: {
          configValue: editingValue,
          configType: editingConfig.configType,
          status: editingConfig.status,
        },
      })
      setEditingConfig(null)
      toast.success('配置已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  const handleCreateSave = async () => {
    if (!createForm.configKey || !createForm.configName) {
      toast.error('请填写配置键和名称')
      return
    }
    try {
      await createConfig.mutateAsync({
        configKey: createForm.configKey.trim(),
        configGroup: createForm.configGroup.trim() || 'general',
        configName: createForm.configName.trim(),
        configType: createForm.configType,
        configValue: createForm.configValue === '' ? null : createForm.configValue,
        remark: createForm.remark.trim() || null,
        isSystem: createForm.isSystem,
        status: createForm.status,
      })
      setCreatingConfig(false)
      toast.success('配置已创建')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    }
  }

  const handleDelete = async (config: Config) => {
    if (config.isSystem === 1) {
      toast.error('系统配置不允许删除')
      return
    }
    if (!confirm(`确定要删除配置 "${config.configKey}" 吗？`)) return
    try {
      await deleteConfig.mutateAsync(config.id)
      toast.success('删除成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
        <div className="flex items-center gap-2">
          <PermissionGuard permission="system:config:create">
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              新增配置
            </button>
          </PermissionGuard>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg  px-4 py-2 hover:bg-gray-50"
          >
            <RefreshIcon size="sm" />
            刷新
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600">分组</label>
            <input
              type="text"
              value={filters.group}
              onChange={(e) => setFilters({ ...filters, group: e.target.value })}
              placeholder="如 security / upload / marketing"
              className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">状态</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as '' | '0' | '1',
                })
              }
              className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
            >
              <option value="">全部</option>
              <option value="1">启用</option>
              <option value="0">停用</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
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
              className="rounded-lg  px-4 py-2 hover:bg-gray-50"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">分组</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Key</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">系统</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无配置
                  </td>
                </tr>
              ) : (
                data.items.map((config: Config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{config.id}</td>
                    <td className="px-4 py-3 text-sm">{config.configGroup}</td>
                    <td className="px-4 py-3 text-sm font-mono">{config.configKey}</td>
                    <td className="px-4 py-3 text-sm">{config.configName}</td>
                    <td className="px-4 py-3 text-sm">{config.configType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          config.status === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {config.status === 1 ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{config.isSystem === 1 ? '是' : '否'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="system:config:update">
                          <button
                            type="button"
                            onClick={() => openEditDialog(config)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            编辑值
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="system:config:delete">
                          <button
                            type="button"
                            onClick={() => handleDelete(config)}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            删除
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
        <div className="border-t px-4 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {creatingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">新增配置</h2>
                <p className="mt-1 text-sm text-gray-500">
                  请按照规范填写配置键、分组和类型，配置值支持原始字符串或 JSON
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreatingConfig(false)}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                关闭
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-600">分组</label>
                <input
                  type="text"
                  value={createForm.configGroup}
                  onChange={(e) => setCreateForm({ ...createForm, configGroup: e.target.value })}
                  placeholder="如 system / auth / feature"
                  className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">配置键</label>
                <input
                  type="text"
                  value={createForm.configKey}
                  onChange={(e) => setCreateForm({ ...createForm, configKey: e.target.value })}
                  placeholder="如 system.site_name"
                  className="w-full rounded-lg  px-3 py-2 text-sm font-mono focus:lue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">名称</label>
                <input
                  type="text"
                  value={createForm.configName}
                  onChange={(e) => setCreateForm({ ...createForm, configName: e.target.value })}
                  placeholder="如 站点名称"
                  className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">类型</label>
                <select
                  value={createForm.configType}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      configType: e.target.value as Config['configType'],
                    })
                  }
                  className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="json">json</option>
                  <option value="array">array</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm text-gray-600">配置值</label>
              <textarea
                value={createForm.configValue}
                onChange={(e) => setCreateForm({ ...createForm, configValue: e.target.value })}
                rows={8}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:lue-500 focus:outline-none"
                placeholder="在此输入配置值，json/array 类型请填写合法 JSON"
              />
              <ConfigValuePreview value={createForm.configValue} type={createForm.configType} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">状态</label>
                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      status: Number(e.target.value) as 0 | 1,
                    })
                  }
                  className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
                >
                  <option value={1}>启用</option>
                  <option value={0}>停用</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">备注</label>
                <input
                  type="text"
                  value={createForm.remark}
                  onChange={(e) => setCreateForm({ ...createForm, remark: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-lg  px-3 py-2 text-sm focus:lue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreatingConfig(false)}
                className="rounded px-4 py-2 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateSave}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">编辑配置值：{editingConfig.configKey}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  类型：{editingConfig.configType}，名称：
                  {editingConfig.configName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                关闭
              </button>
            </div>
            <div className="mb-4">
              <textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                rows={10}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:lue-500 focus:outline-none"
                placeholder="在此编辑配置值（原始字符串或 JSON）"
              />
              {editingConfig.remark && (
                <p className="mt-2 text-xs text-gray-500">备注：{editingConfig.remark}</p>
              )}
              <ConfigValuePreview value={editingValue} type={editingConfig.configType} />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="rounded px-4 py-2 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveValue}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigValuePreview({ value, type }: { value: string; type: Config['configType'] }) {
  const isJsonLike = type === 'json' || type === 'array'

  if (!value) {
    return (
      <div className="mt-3">
        <div className="mb-1 text-xs font-medium text-gray-500">预览</div>
        <div className="rounded bg-gray-900 px-3 py-2 text-xs font-mono text-gray-400">(空)</div>
      </div>
    )
  }

  if (!isJsonLike) {
    return (
      <div className="mt-3">
        <div className="mb-1 text-xs font-medium text-gray-500">预览</div>
        <pre className="max-h-60 overflow-auto rounded bg-gray-900 px-3 py-2 text-xs font-mono text-gray-100">
          {value}
        </pre>
      </div>
    )
  }

  return <JsonPreview value={value} />
}

function JsonPreview({ value }: { value: string }) {
  let formatted = value
  let parseError: string | null = null

  try {
    const parsed = JSON.parse(value)
    formatted = JSON.stringify(parsed, null, 2)
  } catch {
    parseError = 'JSON 解析失败，以下为原始内容'
  }

  const content = syntaxHighlightJson(formatted)

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>预览（JSON 语法高亮）</span>
        {parseError && <span className="text-red-400">{parseError}</span>}
      </div>
      <pre className="max-h-60 overflow-auto rounded bg-[#1e1e1e] px-3 py-2 text-xs font-mono text-gray-100">
        {content}
      </pre>
    </div>
  )
}

function syntaxHighlightJson(json: string) {
  const regex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g
  const elements = []
  let lastIndex = 0

  json.replace(regex, (match, _group, _unicode, _colon, _bool, offset: number) => {
    if (lastIndex < offset) {
      elements.push(json.slice(lastIndex, offset))
    }

    let style: CSSProperties = {}

    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        style = { color: '#9cdcfe' }
      } else {
        style = { color: '#ce9178' }
      }
    } else if (/true|false/.test(match)) {
      style = { color: '#569cd6' }
    } else if (/null/.test(match)) {
      style = { color: '#569cd6', fontStyle: 'italic' }
    } else {
      style = { color: '#b5cea8' }
    }

    elements.push(
      <span style={style} key={elements.length}>
        {match}
      </span>
    )

    lastIndex = offset + match.length

    return match
  })

  if (lastIndex < json.length) {
    elements.push(json.slice(lastIndex))
  }

  return elements
}
