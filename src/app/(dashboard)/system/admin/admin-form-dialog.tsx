'use client'

/**
 * 管理员表单对话框
 * @description 创建和编辑管理员的表单对话框
 * @requirements 3.2, 3.4
 */

import { useEffect, useState } from 'react'
import { CloseIcon, LoadingIcon } from '@/components/ui/icon'
import { useCreateAdmin, useUpdateAdmin, useUpdateAdminRoles } from '@/hooks/queries/use-admins'
import { useAllRoles } from '@/hooks/queries/use-roles'
import { SUPER_ADMIN_ID } from '@/lib/constants'

type Admin = {
  id: number
  username: string
  nickname: string
  status: number
  remark: string | null
  roles?: Array<{ id: number; roleName: string }>
}

interface AdminFormDialogProps {
  open: boolean
  admin: Admin | null
  onClose: () => void
  onSuccess: () => void
}

export function AdminFormDialog({ open, admin, onClose, onSuccess }: AdminFormDialogProps) {
  const isEdit = !!admin
  const isSuperAdmin = admin?.id === SUPER_ADMIN_ID
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nickname: '',
    status: 1,
    remark: '',
    roleIds: [] as number[],
  })
  const [error, setError] = useState('')

  const { data: rolesData } = useAllRoles()
  const roles = (rolesData as Array<{ id: number; roleName: string }> | undefined) || []
  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin()
  const updateAdminRoles = useUpdateAdminRoles()

  useEffect(() => {
    if (open) {
      if (admin) {
        setFormData({
          username: admin.username,
          password: '',
          nickname: admin.nickname || '',
          status: admin.status,
          remark: admin.remark || '',
          roleIds: admin.roles?.map((r) => r.id) || [],
        })
      } else {
        setFormData({
          username: '',
          password: '',
          nickname: '',
          status: 1,
          remark: '',
          roleIds: [],
        })
      }
      setError('')
    }
  }, [open, admin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!isEdit && !formData.password) {
      setError('请输入密码')
      return
    }

    try {
      if (isEdit) {
        await updateAdmin.mutateAsync({
          id: admin.id,
          input: {
            nickname: formData.nickname,
            status: formData.status,
            remark: formData.remark || undefined,
          },
        })
        // 超级管理员不能修改角色
        if (!isSuperAdmin) {
          await updateAdminRoles.mutateAsync({
            id: admin.id,
            input: { roleIds: formData.roleIds },
          })
        }
      } else {
        await createAdmin.mutateAsync({
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname || undefined,
          status: formData.status,
          remark: formData.remark || undefined,
          roleIds: formData.roleIds.length > 0 ? formData.roleIds : undefined,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  const isPending = createAdmin.isPending || updateAdmin.isPending || updateAdminRoles.isPending

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{isEdit ? '编辑管理员' : '新增管理员'}</h3>
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
            {/* 用户名 */}
            <div>
              <label
                htmlFor="adminUsername"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                id="adminUsername"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isEdit}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                placeholder="请输入用户名"
              />
            </div>

            {/* 密码 */}
            {!isEdit && (
              <div>
                <label
                  htmlFor="adminPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  密码 <span className="text-red-500">*</span>
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="请输入密码"
                />
              </div>
            )}

            {/* 昵称 */}
            <div>
              <label
                htmlFor="adminNickname"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                昵称
              </label>
              <input
                id="adminNickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="请输入昵称"
              />
            </div>

            {/* 状态 */}
            <div>
              <label htmlFor="adminStatus" className="mb-1 block text-sm font-medium text-gray-700">
                状态
              </label>
              <select
                id="adminStatus"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value={1}>正常</option>
                <option value={0}>禁用</option>
              </select>
            </div>

            {/* 角色 */}
            <div>
              <div className="mb-1 block text-sm font-medium text-gray-700">角色</div>
              {isSuperAdmin ? (
                <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">
                  超级管理员角色不可修改
                </div>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              roleIds: [...formData.roleIds, role.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              roleIds: formData.roleIds.filter((id) => id !== role.id),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{role.roleName}</span>
                    </label>
                  ))}
                  {roles.length === 0 && <p className="text-sm text-gray-500">暂无角色</p>}
                </div>
              )}
            </div>

            {/* 备注 */}
            <div>
              <label htmlFor="adminRemark" className="mb-1 block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                id="adminRemark"
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
