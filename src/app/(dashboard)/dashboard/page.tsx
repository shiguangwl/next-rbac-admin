'use client'

/**
 * 仪表盘首页
 * @description 后台管理系统首页，显示欢迎信息和统计数据
 * @requirements 11.5
 */

import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

export default function DashboardPage() {
  const { admin } = useAuth()

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">欢迎回来,{admin?.nickname || admin?.username}!</h1>
        <p className="mt-2 text-blue-100">这是您的后台管理系统控制台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="管理员"
          value="-"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>管理员</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="角色"
          value="-"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>角色</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="菜单"
          value="-"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>菜单</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="操作日志"
          value="-"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>操作日志</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          color="orange"
        />
      </div>

      {/* 快捷入口 */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">快捷入口</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/system/admin" title="用户管理" description="管理系统管理员账号" />
          <QuickLink href="/system/role" title="角色管理" description="配置角色和权限" />
          <QuickLink href="/system/menu" title="菜单管理" description="管理系统菜单结构" />
          <QuickLink href="/system/log" title="操作日志" description="查看系统操作记录" />
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

interface QuickLinkProps {
  href: string
  title: string
  description: string
}

function QuickLink({ href, title, description }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  )
}
