"use client";

/**
 * 菜单表单对话框
 * @description 创建和编辑菜单的表单对话框
 * @requirements 5.2, 5.4
 */

import { CloseIcon, LoadingIcon } from "@/components/ui/icon";
import { useCreateMenu, useUpdateMenu } from "@/hooks/queries/use-menus";
import { useEffect, useState } from "react";
import { type MenuFormData, MenuFormFields } from "./menu-form-fields";

type MenuTreeNode = {
  id: number;
  parentId: number;
  menuType: "D" | "M" | "B";
  menuName: string;
  permission: string | null;
  path: string | null;
  component: string | null;
  icon: string | null;
  sort: number;
  visible: number;
  status: number;
  isExternal: number;
  isCache: number;
  remark: string | null;
};

interface MenuFormDialogProps {
  open: boolean;
  menu: MenuTreeNode | null;
  parentMenu: MenuTreeNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultFormData: MenuFormData = {
  parentId: 0,
  menuType: "M",
  menuName: "",
  permission: "",
  path: "",
  component: "",
  icon: "",
  sort: 0,
  visible: 1,
  status: 1,
  isExternal: 0,
  isCache: 1,
  remark: "",
};

export function MenuFormDialog({
  open,
  menu,
  parentMenu,
  onClose,
  onSuccess,
}: MenuFormDialogProps) {
  const isEdit = !!menu;
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData);
  const [error, setError] = useState("");

  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();

  useEffect(() => {
    if (open) {
      if (menu) {
        setFormData({
          parentId: menu.parentId,
          menuType: menu.menuType,
          menuName: menu.menuName,
          permission: menu.permission || "",
          path: menu.path || "",
          component: menu.component || "",
          icon: menu.icon || "",
          sort: menu.sort,
          visible: menu.visible,
          status: menu.status,
          isExternal: menu.isExternal,
          isCache: menu.isCache,
          remark: menu.remark || "",
        });
      } else {
        setFormData({
          ...defaultFormData,
          parentId: parentMenu?.id || 0,
          menuType: parentMenu
            ? parentMenu.menuType === "D"
              ? "M"
              : "B"
            : "D",
        });
      }
      setError("");
    }
  }, [open, menu, parentMenu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.menuName.trim()) {
      setError("请输入菜单名称");
      return;
    }

    try {
      const input = {
        parentId: formData.parentId,
        menuType: formData.menuType,
        menuName: formData.menuName,
        permission: formData.permission || undefined,
        path: formData.path || undefined,
        component: formData.component || undefined,
        icon: formData.icon || undefined,
        sort: formData.sort,
        visible: formData.visible,
        status: formData.status,
        isExternal: formData.isExternal,
        isCache: formData.isCache,
        remark: formData.remark || undefined,
      };

      if (isEdit && menu) {
        await updateMenu.mutateAsync({ id: menu.id, input });
      } else {
        await createMenu.mutateAsync(input);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  const isPending = createMenu.isPending || updateMenu.isPending;
  const parentMenuName =
    parentMenu?.menuName ||
    (formData.parentId === 0 ? "根目录" : `ID: ${formData.parentId}`);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl">
        {/* 标题 */}
        <div className="sticky top-0 flex items-center justify-between  bg-white px-6 py-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? "编辑菜单" : "新增菜单"}
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
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <MenuFormFields
            formData={formData}
            onChange={setFormData}
            parentMenuName={parentMenuName}
          />

          {/* 按钮 */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg  px-4 py-2 hover:bg-gray-50"
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
