'use client'

/**
 * 管理员管理页面
 * @description 管理员列表、创建、编辑、删除
 * @requirements 3.1, 3.2, 3.4, 3.6
 */

import { PermissionGuard } from '@/components/permission-guard'
import { EditIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { useAdmins, useDeleteAdmin, useResetPassword } from '@/hooks/queries/use-admins'
import { useState } from 'react'
import { AdminFormDialog } from './admin-form-dialog'

type Admin = {
  id: number
  username: string
  nickname: string
  status: number
  loginIp: string | null
  loginTime: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
  roles?: Array<{ id: number; roleName: string }>
}

export default function AdminPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const { data, isLoading, refetch } = useAdmins({ page, pageSize, keyword: searchKeyword })
  const deleteAdmin = useDeleteAdmin()
  const resetPassword = useResetPassword()

  const handleSearch = () => {
    setSearchKeyword(keyword)
    setPage(1)
  }

  const handleCreate = () => {
    setEditingAdmin(null)
    setDialogOpen(true)
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setDialogOpen(true)
  }

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`确定要删除管理员 "${admin.username}" 吗？`)) return
    try {
      await deleteAdmin.mutateAsync(admin.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return
    try {
      await resetPassword.mutateAsync({ id: resetPasswordId, input: { newPassword } })
      setResetPasswordId(null)
      setNewPassword('')
      alert('密码重置成功')
    } catch (err) {
      alert(err instanceof Error ? err.message : '重置密码失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
        <PermissionGuard permission="system:admin:create">
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <PlusIcon size="sm" />
            新增管理员
          </button>
        </PermissionGuard>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索用户名或昵称"
            className="flex-1 rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <SearchIcon size="sm" />
            搜索
          </button>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">昵称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">最后登录</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.items.map((admin: Admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{admin.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{admin.username}</td>
                    <td className="px-4 py-3 text-sm">{admin.nickname || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {admin.roles?.map((r) => r.roleName).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          admin.status === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {admin.status === 1 ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {admin.loginTime ? new Date(admin.loginTime).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="system:admin:update">
                          <button
                            type="button"
                            onClick={() => handleEdit(admin)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title="编辑"
                          >
                            <EditIcon size="sm" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="system:admin:reset-password">
                          <button
                            type="button"
                            onClick={() => setResetPasswordId(admin.id)}
                            className="rounded p-1 text-orange-600 hover:bg-orange-50"
                            title="重置密码"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                              />
                            </svg>
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="system:admin:delete">
                          <button
                            type="button"
                            onClick={() => handleDelete(admin)}
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

        {/* 分页 */}
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

      {/* 表单对话框 */}
      <AdminFormDialog
        open={dialogOpen}
        admin={editingAdmin}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false)
          refetch()
        }}
      />

      {/* 重置密码对话框 */}
      {resetPasswordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">重置密码</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
              className="mb-4 w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetPasswordId(null)
                  setNewPassword('')
                }}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={!newPassword || resetPassword.isPending}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {resetPassword.isPending ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
