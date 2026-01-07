'use client'

/**
 * 登录页面
 * @description 管理员登录页面
 * @requirements 2.1
 */

import { LoadingIcon } from '@/components/ui/icon'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    try {
      await login(username, password)
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">后台管理系统</h1>
          <p className="mt-2 text-sm text-gray-500">请登录您的管理员账号</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 错误提示 */}
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入用户名"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入密码"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <LoadingIcon size="sm" />}
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
