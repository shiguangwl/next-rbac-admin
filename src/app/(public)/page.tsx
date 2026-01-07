/**
 * 公开首页
 * @description 项目首页，无需登录即可访问
 */

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-xl font-bold text-white">E</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">ETF Panel</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              登录
            </Link>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Hero Section */}
          <h1 className="mb-6 text-5xl font-bold text-gray-900">ETF 数据分析平台</h1>
          <p className="mb-8 text-xl text-gray-600">专业的 ETF 数据管理与分析系统</p>

          {/* 功能特性 */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="📊"
              title="数据分析"
              description="实时跟踪 ETF 市场动态，提供专业的数据分析服务"
            />
            <FeatureCard
              icon="🔒"
              title="安全可靠"
              description="企业级安全防护，RBAC 权限管理系统"
            />
            <FeatureCard icon="⚡" title="高效便捷" description="现代化界面设计，流畅的用户体验" />
          </div>

          {/* CTA */}
          <div className="mt-16">
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105"
            >
              立即开始
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 ETF Panel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/**
 * 功能特性卡片
 */
interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
