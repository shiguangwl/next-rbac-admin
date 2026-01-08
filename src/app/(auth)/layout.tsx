'use client'

/**
 * 认证布局
 * @description 登录等认证页面的布局，已登录用户会被重定向到仪表盘首页
 * @requirements 2.1
 */

import type { ReactNode } from 'react'
import { GuestGuard } from '@/components/auth-guard'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <GuestGuard redirectTo="/dashboard">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        {children}
      </div>
    </GuestGuard>
  )
}
