'use client'

/**
 * 侧边栏组件
 * @description 后台管理系统侧边栏，显示菜单导航
 * @requirements 11.5
 */

import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useMemo, useState } from 'react'

/**
 * 菜单树节点类型
 */
interface MenuTreeNode {
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

interface SidebarProps {
  /** 是否折叠 */
  collapsed?: boolean
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void
}

/**
 * 菜单图标映射
 */
const iconMap: Record<string, ReactNode> = {
  system: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  role: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  menu: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  log: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  dashboard: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  default: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
}

/**
 * 获取菜单图标
 */
function getMenuIcon(icon: string | null): ReactNode {
  if (!icon) return iconMap.default
  return iconMap[icon] || iconMap.default
}

/**
 * 菜单项组件
 */
function MenuItem({
  menu,
  collapsed,
  level = 0,
}: {
  menu: MenuTreeNode
  collapsed: boolean
  level?: number
}) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  const hasChildren = menu.children && menu.children.length > 0
  const isActive = menu.path ? pathname === menu.path : false
  const isChildActive = useMemo(() => {
    if (!menu.children) return false
    const checkActive = (items: MenuTreeNode[]): boolean => {
      for (const item of items) {
        if (item.path && pathname === item.path) return true
        if (item.children && checkActive(item.children)) return true
      }
      return false
    }
    return checkActive(menu.children)
  }, [menu.children, pathname])

  // 如果子菜单激活，自动展开
  const isExpanded = expanded || isChildActive

  // 不显示隐藏的菜单
  if (menu.visible === 0 || menu.status === 0) return null

  // 按钮类型不在侧边栏显示
  if (menu.menuType === 'B') return null

  const content = (
    <>
      <span className="flex-shrink-0">{getMenuIcon(menu.icon)}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{menu.menuName}</span>
          {hasChildren && (
            <svg
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </>
      )}
    </>
  )

  const itemClass = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
    'hover:bg-gray-100',
    (isActive || isChildActive) && 'bg-blue-50 text-blue-600',
    level > 0 && !collapsed && 'ml-4'
  )

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          className={cn(itemClass, 'w-full')}
          onClick={() => setExpanded(!isExpanded)}
        >
          {content}
        </button>
        {isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {menu.children?.map((child) => (
              <MenuItem key={child.id} menu={child} collapsed={collapsed} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (menu.path) {
    if (menu.isExternal === 1) {
      return (
        <a href={menu.path} target="_blank" rel="noopener noreferrer" className={itemClass}>
          {content}
        </a>
      )
    }
    return (
      <Link href={menu.path} className={itemClass}>
        {content}
      </Link>
    )
  }

  return <div className={itemClass}>{content}</div>
}

/**
 * 侧边栏组件
 */
export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { menus } = useAuth()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-lg font-semibold">Admin</span>}
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          <svg
            className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menus.map((menu) => (
          <MenuItem key={menu.id} menu={menu} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  )
}
