'use client'

/**
 * 菜单树行组件
 * @description 菜单管理表格的树形行显示
 * @requirements 5.1
 */

import { PermissionGuard } from '@/components/permission-guard'
import { EditIcon, PlusIcon, TrashIcon } from '@/components/ui/icon'

export type MenuTreeNode = {
  id: number
  parentId: number
  menuType: 'D' | 'M' | 'B'
  menuName: string
  permission: string | null
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  visible: number
  status: number
  isExternal: number
  isCache: number
  remark: string | null
  createdAt: string
  updatedAt: string
  children?: MenuTreeNode[]
}

interface MenuTreeRowProps {
  menu: MenuTreeNode
  level: number
  expandedIds: number[]
  onToggleExpand: (id: number) => void
  onEdit: (menu: MenuTreeNode) => void
  onDelete: (menu: MenuTreeNode) => void
  onCreate: (parent: MenuTreeNode) => void
}

const typeLabel = {
  D: { text: '目录', class: 'bg-blue-100 text-blue-600' },
  M: { text: '菜单', class: 'bg-green-100 text-green-600' },
  B: { text: '按钮', class: 'bg-orange-100 text-orange-600' },
}

export function MenuTreeRow({
  menu,
  level,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onCreate,
}: MenuTreeRowProps) {
  const hasChildren = menu.children && menu.children.length > 0
  const isExpanded = expandedIds.includes(menu.id)

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(menu.id)}
                className="flex h-5 w-5 items-center justify-center"
                aria-label={isExpanded ? '收起' : '展开'}
              >
                <svg
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="text-sm font-medium">{menu.menuName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded px-2 py-1 text-xs font-medium ${typeLabel[menu.menuType].class}`}
          >
            {typeLabel[menu.menuType].text}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{menu.permission || '-'}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{menu.path || '-'}</td>
        <td className="px-4 py-3 text-sm">{menu.sort}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              menu.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {menu.status === 1 ? '正常' : '禁用'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {menu.menuType !== 'B' && (
              <PermissionGuard permission="system:menu:create">
                <button
                  type="button"
                  onClick={() => onCreate(menu)}
                  className="rounded p-1 text-green-600 hover:bg-green-50"
                  title="新增子菜单"
                >
                  <PlusIcon size="sm" />
                </button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="system:menu:update">
              <button
                type="button"
                onClick={() => onEdit(menu)}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                title="编辑"
              >
                <EditIcon size="sm" />
              </button>
            </PermissionGuard>
            <PermissionGuard permission="system:menu:delete">
              <button
                type="button"
                onClick={() => onDelete(menu)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                title="删除"
              >
                <TrashIcon size="sm" />
              </button>
            </PermissionGuard>
          </div>
        </td>
      </tr>
      {hasChildren &&
        isExpanded &&
        menu.children!.map((child) => (
          <MenuTreeRow
            key={child.id}
            menu={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreate={onCreate}
          />
        ))}
    </>
  )
}
