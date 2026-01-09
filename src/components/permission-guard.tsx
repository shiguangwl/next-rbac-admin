'use client'

/**
 * 权限守卫组件
 * @description 根据权限条件渲染受保护内容
 */

import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/use-permission'

interface PermissionGuardProps {
  /** 子组件 */
  children: ReactNode
  /** 需要的权限标识（单个） */
  permission?: string
  /** 需要的权限标识列表（满足任意一个） */
  anyPermissions?: string[]
  /** 需要的权限标识列表（满足所有） */
  allPermissions?: string[]
  /** 无权限时显示的内容 */
  fallback?: ReactNode
}

/**
 * 权限守卫组件
 * @description 根据权限条件决定是否渲染子组件
 *
 * @example
 * // 单个权限检查
 * <PermissionGuard permission="system:admin:list">
 *   <AdminList />
 * </PermissionGuard>
 *
 * @example
 * // 任意权限检查
 * <PermissionGuard anyPermissions={['system:admin:create', 'system:admin:update']}>
 *   <AdminForm />
 * </PermissionGuard>
 *
 * @example
 * // 所有权限检查
 * <PermissionGuard allPermissions={['system:admin:list', 'system:admin:delete']}>
 *   <AdminBatchDelete />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  // 检查单个权限
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // 检查任意权限
  if (anyPermissions?.length && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>
  }

  // 检查所有权限
  if (allPermissions?.length && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 无权限提示组件
 */
export function NoPermission({ message = '暂无权限访问' }: { message?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-4 text-6xl">🔒</div>
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
