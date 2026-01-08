'use client'

/**
 * 菜单管理页面
 * @description 菜单列表、创建、编辑、删除
 * @requirements 5.1, 5.2, 5.4, 5.6
 */

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/permission-guard'
import { PlusIcon, RefreshIcon } from '@/components/ui/icon'
import { useDeleteMenu, useMenuTree } from '@/hooks/queries/use-menus'
import { MenuFormDialog } from './menu-form-dialog'
import { type MenuTreeNode, MenuTreeRow } from './menu-tree-row'

export default function MenuPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuTreeNode | null>(null)
  const [parentMenu, setParentMenu] = useState<MenuTreeNode | null>(null)
  const [expandedIds, setExpandedIds] = useState<number[]>([])

  const { data: menuTree, isLoading, refetch } = useMenuTree()
  const deleteMenu = useDeleteMenu()

  const allMenuIds = useMemo(() => {
    const ids: number[] = []
    const collect = (nodes: MenuTreeNode[]) => {
      for (const node of nodes) {
        ids.push(node.id)
        if (node.children) collect(node.children)
      }
    }
    if (menuTree) collect(menuTree)
    return ids
  }, [menuTree])

  const handleCreate = (parent?: MenuTreeNode) => {
    setEditingMenu(null)
    setParentMenu(parent || null)
    setDialogOpen(true)
  }

  const handleEdit = (menu: MenuTreeNode) => {
    setEditingMenu(menu)
    setParentMenu(null)
    setDialogOpen(true)
  }

  const handleDelete = async (menu: MenuTreeNode) => {
    if (!confirm(`确定要删除菜单 "${menu.menuName}" 吗？`)) return
    try {
      await deleteMenu.mutateAsync(menu.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const expandAll = () => setExpandedIds(allMenuIds)
  const collapseAll = () => setExpandedIds([])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">菜单管理</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            展开全部
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            折叠全部
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshIcon size="sm" />
            刷新
          </button>
          <PermissionGuard permission="system:menu:create">
            <button
              type="button"
              onClick={() => handleCreate()}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <PlusIcon size="sm" />
              新增菜单
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">菜单名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">图标</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">权限标识</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">路径</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">排序</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
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
              ) : !menuTree?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                menuTree.map((menu: MenuTreeNode) => (
                  <MenuTreeRow
                    key={menu.id}
                    menu={menu}
                    level={0}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreate={handleCreate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 表单对话框 */}
      <MenuFormDialog
        open={dialogOpen}
        menu={editingMenu}
        parentMenu={parentMenu}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
