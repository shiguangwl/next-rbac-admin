"use client";

/**
 * 角色表单对话框
 * @description 创建和编辑角色的表单对话框，集成权限分配功能
 * @requirements 4.2, 4.3, 4.6
 */

import { CloseIcon, LoadingIcon } from "@/components/ui/icon";
import { useMenuTree } from "@/hooks/queries/use-menus";
import {
  useCreateRole,
  useRole,
  useUpdateRole,
  useUpdateRoleMenus,
} from "@/hooks/queries/use-roles";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuTreeItem, type MenuTreeNode } from "./menu-tree-item";

type Role = {
  id: number;
  roleName: string;
  sort: number;
  status: number;
  remark: string | null;
};

interface RoleFormDialogProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleFormDialog({
  open,
  role,
  onClose,
  onSuccess,
}: RoleFormDialogProps) {
  const isEdit = !!role;
  const [formData, setFormData] = useState({
    roleName: "",
    sort: 0,
    status: 1,
    remark: "",
  });
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const expandedInitializedRef = useRef(false);

  const { data: menuTreeData, isLoading: menuLoading } = useMenuTree();
  const menuTree = (menuTreeData as MenuTreeNode[] | undefined) || [];
  const { data: roleDetailData, isLoading: roleLoading } = useRole(
    role?.id || 0
  );
  const roleDetail =
    (roleDetailData as { menuIds?: number[] } | undefined) || null;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const updateRoleMenus = useUpdateRoleMenus();

  const allMenuIds = useMemo(() => {
    const ids: number[] = [];
    const collect = (nodes: MenuTreeNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        if (node.children) collect(node.children);
      }
    };
    collect(menuTree);
    return ids;
  }, [menuTree]);

  useEffect(() => {
    if (open) {
      if (role && roleDetail) {
        setFormData({
          roleName: role.roleName,
          sort: role.sort,
          status: role.status,
          remark: role.remark || "",
        });
        setCheckedMenuIds(roleDetail.menuIds || []);
      } else {
        setFormData({
          roleName: "",
          sort: 0,
          status: 1,
          remark: "",
        });
        setCheckedMenuIds([]);
      }
      setError("");
    }
  }, [open, role, roleDetail]);

  useEffect(() => {
    if (!open) {
      expandedInitializedRef.current = false;
      return;
    }
    if (!expandedInitializedRef.current) {
      setExpandedIds(allMenuIds);
      expandedInitializedRef.current = true;
    }
  }, [open, allMenuIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.roleName.trim()) {
      setError("请输入角色名称");
      return;
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
        });
        await updateRoleMenus.mutateAsync({
          id: role.id,
          input: { menuIds: checkedMenuIds },
        });
      } else {
        await createRole.mutateAsync({
          roleName: formData.roleName,
          sort: formData.sort,
          status: formData.status,
          remark: formData.remark || undefined,
          menuIds: checkedMenuIds,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCheck = (node: MenuTreeNode) => {
    const getDescendantIds = (n: MenuTreeNode): number[] => {
      const ids = [n.id];
      if (n.children) {
        for (const child of n.children) {
          ids.push(...getDescendantIds(child));
        }
      }
      return ids;
    };

    const descendantIds = getDescendantIds(node);
    const isChecked = checkedMenuIds.includes(node.id);

    if (isChecked) {
      setCheckedMenuIds((prev) =>
        prev.filter((id) => !descendantIds.includes(id))
      );
    } else {
      setCheckedMenuIds((prev) => [...new Set([...prev, ...descendantIds])]);
    }
  };

  const handleSelectAll = () => {
    if (checkedMenuIds.length === allMenuIds.length) {
      setCheckedMenuIds([]);
    } else {
      setCheckedMenuIds(allMenuIds);
    }
  };

  const isPending =
    createRole.isPending || updateRole.isPending || updateRoleMenus.isPending;
  const isLoading = menuLoading || (isEdit && roleLoading);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? "编辑角色" : "新增角色"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* 表单 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h4 className="mb-4 font-medium text-gray-900">基本信息</h4>
                <div className="space-y-4">
                  {/* 角色名称 */}
                  <div>
                    <label
                      htmlFor="roleName"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      角色名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="roleName"
                      type="text"
                      value={formData.roleName}
                      onChange={(e) =>
                        setFormData({ ...formData, roleName: e.target.value })
                      }
                      className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="请输入角色名称"
                    />
                  </div>

                  {/* 排序和状态 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="roleSort"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        排序
                      </label>
                      <input
                        id="roleSort"
                        type="number"
                        value={formData.sort}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sort: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="请输入排序值"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="roleStatus"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        状态
                      </label>
                      <select
                        id="roleStatus"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value={1}>正常</option>
                        <option value={0}>禁用</option>
                      </select>
                    </div>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label
                      htmlFor="roleRemark"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      备注
                    </label>
                    <textarea
                      id="roleRemark"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="请输入备注"
                    />
                  </div>
                </div>
              </div>

              {/* 权限分配 */}
              <div>
                <h4 className="mb-4 font-medium text-gray-900">权限分配</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingIcon size="lg" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          checkedMenuIds.length === allMenuIds.length &&
                          allMenuIds.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">全选/取消全选</span>
                      <span className="text-sm text-gray-500">
                        (已选 {checkedMenuIds.length}/{allMenuIds.length})
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      <div className="space-y-1 p-2">
                        {menuTree.map((node: MenuTreeNode) => (
                          <MenuTreeItem
                            key={node.id}
                            node={node}
                            checkedIds={checkedMenuIds}
                            expandedIds={expandedIds}
                            onToggleCheck={toggleCheck}
                            onToggleExpand={toggleExpand}
                            level={0}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 border-t px-6 py-4">
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
              {isPending ? "提交中..." : "确定"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
