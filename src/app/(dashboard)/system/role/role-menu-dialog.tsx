"use client";

/**
 * 角色菜单权限分配对话框
 * @description 为角色分配菜单权限
 * @requirements 4.6
 */

import { CloseIcon, LoadingIcon } from "@/components/ui/icon";
import { useMenuTree } from "@/hooks/queries/use-menus";
import { useRole, useUpdateRoleMenus } from "@/hooks/queries/use-roles";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuTreeItem, type MenuTreeNode } from "./menu-tree-item";

type Role = {
  id: number;
  roleName: string;
};

interface RoleMenuDialogProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleMenuDialog({
  open,
  role,
  onClose,
  onSuccess,
}: RoleMenuDialogProps) {
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const expandedInitializedRef = useRef(false);

  const { data: menuTree, isLoading: menuLoading } = useMenuTree();
  const { data: roleDetail, isLoading: roleLoading } = useRole(role?.id || 0);
  const updateRoleMenus = useUpdateRoleMenus();

  const allMenuIds = useMemo(() => {
    const ids: number[] = [];
    const collect = (nodes: MenuTreeNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        if (node.children) collect(node.children);
      }
    };
    if (menuTree) collect(menuTree);
    return ids;
  }, [menuTree]);

  // 构建父节点映射表
  const parentMap = useMemo(() => {
    const map = new Map<number, number>();
    const buildMap = (nodes: MenuTreeNode[]) => {
      for (const node of nodes) {
        if (node.children) {
          for (const child of node.children) {
            map.set(child.id, node.id);
          }
          buildMap(node.children);
        }
      }
    };
    if (menuTree) buildMap(menuTree);
    return map;
  }, [menuTree]);

  useEffect(() => {
    if (open && roleDetail?.menuIds) {
      setCheckedIds(roleDetail.menuIds);
    } else if (open) {
      setCheckedIds([]);
    }
    setError("");
  }, [open, roleDetail]);

  useEffect(() => {
    if (!open) {
      expandedInitializedRef.current = false;
      return;
    }
    if (menuTree && !expandedInitializedRef.current) {
      setExpandedIds(allMenuIds);
      expandedInitializedRef.current = true;
    }
  }, [open, menuTree, allMenuIds]);

  const handleSubmit = async () => {
    if (!role) return;
    setError("");

    try {
      await updateRoleMenus.mutateAsync({
        id: role.id,
        input: { menuIds: checkedIds },
      });
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

    // 获取所有父节点 ID
    const getAncestorIds = (id: number): number[] => {
      const ids: number[] = [];
      let currentId: number | undefined = id;
      while (currentId !== undefined) {
        const parentId = parentMap.get(currentId);
        if (parentId !== undefined) {
          ids.push(parentId);
          currentId = parentId;
        } else {
          currentId = undefined;
        }
      }
      return ids;
    };

    const descendantIds = getDescendantIds(node);
    const ancestorIds = getAncestorIds(node.id);
    const isChecked = checkedIds.includes(node.id);

    if (isChecked) {
      // 取消勾选：移除当前节点和所有子节点
      setCheckedIds((prev) => prev.filter((id) => !descendantIds.includes(id)));
    } else {
      // 勾选：添加当前节点、所有子节点和所有父节点
      setCheckedIds((prev) => [
        ...new Set([...prev, ...descendantIds, ...ancestorIds]),
      ]);
    }
  };

  const handleSelectAll = () => {
    if (checkedIds.length === allMenuIds.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(allMenuIds);
    }
  };

  const isLoading = menuLoading || roleLoading;
  const isPending = updateRoleMenus.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between  px-6 py-4">
          <h3 className="text-lg font-semibold">分配权限 - {role?.roleName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingIcon size="lg" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2  pb-4">
                <input
                  type="checkbox"
                  checked={
                    checkedIds.length === allMenuIds.length &&
                    allMenuIds.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded -gray-300"
                />
                <span className="text-sm font-medium">全选/取消全选</span>
                <span className="text-sm text-gray-500">
                  (已选 {checkedIds.length}/{allMenuIds.length})
                </span>
              </div>

              <div className="space-y-1">
                {menuTree?.map((node: MenuTreeNode) => (
                  <MenuTreeItem
                    key={node.id}
                    node={node}
                    checkedIds={checkedIds}
                    expandedIds={expandedIds}
                    onToggleCheck={toggleCheck}
                    onToggleExpand={toggleExpand}
                    level={0}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2  px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg  px-4 py-2 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending && <LoadingIcon size="sm" />}
            {isPending ? "提交中..." : "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}
