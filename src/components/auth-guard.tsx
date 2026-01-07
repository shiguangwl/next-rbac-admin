'use client'

/**
 * 认证守卫组件
 * @description 保护需要登录才能访问的内容
 * @requirements 11.4
 */

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

interface AuthGuardProps {
  /** 子组件 */
  children: ReactNode
  /** 未登录时重定向的路径，默认 /login */
  redirectTo?: string
  /** 加载中显示的内容 */
  fallback?: ReactNode
}

/**
 * 默认加载组件
 */
function DefaultLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

/**
 * 认证守卫组件
 * @description 检查用户是否已登录，未登录则重定向到登录页
 */
export function AuthGuard({ children, redirectTo = '/login', fallback }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, initialized, loading } = useAuth()

  useEffect(() => {
    // 等待初始化完成
    if (!initialized) return

    // 未登录则重定向
    if (!isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [initialized, isAuthenticated, redirectTo, router])

  // 初始化中或加载中显示 fallback
  if (!initialized || loading) {
    return <>{fallback ?? <DefaultLoading />}</>
  }

  // 未登录时不渲染内容（等待重定向）
  if (!isAuthenticated) {
    return <>{fallback ?? <DefaultLoading />}</>
  }

  return <>{children}</>
}

/**
 * 访客守卫组件
 * @description 保护只有未登录用户才能访问的内容（如登录页）
 */
export function GuestGuard({ children, redirectTo = '/', fallback }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, initialized, loading } = useAuth()

  useEffect(() => {
    // 等待初始化完成
    if (!initialized) return

    // 已登录则重定向
    if (isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [initialized, isAuthenticated, redirectTo, router])

  // 初始化中或加载中显示 fallback
  if (!initialized || loading) {
    return <>{fallback ?? <DefaultLoading />}</>
  }

  // 已登录时不渲染内容（等待重定向）
  if (isAuthenticated) {
    return <>{fallback ?? <DefaultLoading />}</>
  }

  return <>{children}</>
}
