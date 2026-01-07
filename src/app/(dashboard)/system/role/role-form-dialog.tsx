'use client'

/**
 * 角色表单对话框
 * @description 创建和编辑角色的表单对话框
 * @requirements 4.2, 4.3
 */

import { CloseIcon, LoadingIcon } from '@/components/ui/icon'
import { useCreateRole, useUpdateRole } from '@/hooks/queries/use-roles'
import { useEffect, useState } from 'react'

type Role = {
  id: number
  roleName: string
  sort: number
  status: number
  remark: string | null
}

interface RoleFormDialogProps {
  open: boolean
  role: Role | null
  onClose: () => void
  onSuccess: () => void
}

export function RoleFormDialog({ open, role, onClose, onSuccess }: RoleFormDialogProps) {
  const isEdit = !!role
  const [formData, setFormData] = useState({
    roleName: '',
    sort: 0,
    status: 1,
    remark: '',
  })
  const [error, setError] = useState('')

  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  useEffect(() => {
    if (open) {
      if (role) {
        setFormData({
          roleName: role.roleName,
          sort: role.sort,
          status: role.status,
          remark: role.remark || '',
        })
      } else {
        setFormData({
          roleName: '',
          sort: 0,
          status: 1,
          remark: '',
        })
      }
      setError('')
    }
  }, [open, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.roleName.trim()) {
      setError('请输入角色名称')
      return
    }

    try {
      if (isEdit) {
        await updateRole.mutateAsync({
          id: role.id,
          input: {
            roleName: formData.roleName,
            sort: formData.sort,
            status: formData.status,
            remark: formData.remark || undefined,
          },
        })
      } else {
        await createRole.mutateAsync({
          roleName: formData.roleName,
          sort: formData.sort,
          status: formData.status,
          remark: formData.remark || undefined,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  const isPending = createRole.isPending || updateRole.isPending

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{isEdit ? '编辑角色' : '新增角色'}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-4">
            {/* 角色名称 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                角色名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="请输入角色名称"
              />
            </div>

            {/* 排序 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">排序</label>
              <input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="请输入排序值"
              />
            </div>

            {/* 状态 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value={1}>正常</option>
                <option value={0}>禁用</option>
              </select>
            </div>

            {/* 备注 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                rows={3}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="请输入备注"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isPending && <LoadingIcon size="sm" />}
              {isPending ? '提交中...' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
