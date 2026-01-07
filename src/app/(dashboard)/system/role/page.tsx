"use client";

/**
 * 角色管理页面
 * @description 角色列表、创建、编辑、删除、权限分配
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.6
 */

import { PermissionGuard } from "@/components/permission-guard";
import {
  EditIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import { useDeleteRole, useRoles } from "@/hooks/queries/use-roles";
import { useState } from "react";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleMenuDialog } from "./role-menu-dialog";

type Role = {
  id: number;
  roleName: string;
  sort: number;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function RolePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [menuDialogRole, setMenuDialogRole] = useState<Role | null>(null);

  const { data, isLoading, refetch } = useRoles({
    page,
    pageSize,
    keyword: searchKeyword,
  });
  const deleteRole = useDeleteRole();

  const handleSearch = () => {
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`确定要删除角色 "${role.roleName}" 吗？`)) return;
    try {
      await deleteRole.mutateAsync(role.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">角色管理</h1>
        <PermissionGuard permission="system:role:create">
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <PlusIcon size="sm" />
            新增角色
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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索角色名称"
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  角色名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  排序
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  备注
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  创建时间
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    加载中...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.items.map((role: Role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{role.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {role.roleName}
                    </td>
                    <td className="px-4 py-3 text-sm">{role.sort}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          role.status === 1
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {role.status === 1 ? "正常" : "禁用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {role.remark || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(role.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="system:role:update">
                          <button
                            type="button"
                            onClick={() => handleEdit(role)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title="编辑"
                          >
                            <EditIcon size="sm" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="system:role:assignMenu">
                          <button
                            type="button"
                            onClick={() => setMenuDialogRole(role)}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                            title="分配权限"
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
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="system:role:delete">
                          <button
                            type="button"
                            onClick={() => handleDelete(role)}
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
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 表单对话框 */}
      <RoleFormDialog
        open={dialogOpen}
        role={editingRole}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          refetch();
        }}
      />

      {/* 权限分配对话框 */}
      <RoleMenuDialog
        open={!!menuDialogRole}
        role={menuDialogRole}
        onClose={() => setMenuDialogRole(null)}
        onSuccess={() => setMenuDialogRole(null)}
      />
    </div>
  );
}
