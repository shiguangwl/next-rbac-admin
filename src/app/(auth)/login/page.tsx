"use client";

/**
 * 登录页面
 * @description 管理员登录页面
 * @requirements 2.1
 */

import { LoadingIcon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

/** 错误类型映射 */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  用户名或密码错误: {
    title: "登录失败",
    description: "用户名或密码不正确，请检查后重试",
  },
  账号已禁用: {
    title: "账号已禁用",
    description: "您的账号已被管理员禁用，请联系管理员处理",
  },
};

/** 获取友好的错误提示 */
function getErrorInfo(message: string): { title: string; description: string } {
  return (
    ERROR_MESSAGES[message] || {
      title: "登录失败",
      description: message || "发生未知错误，请稍后重试",
    }
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError({ title: "请输入用户名", description: "用户名不能为空" });
      return;
    }
    if (!password) {
      setError({ title: "请输入密码", description: "密码不能为空" });
      return;
    }

    try {
      await login(username, password);
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "登录失败";
      setError(getErrorInfo(message));
    }
  };

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
              <title>系统登录</title>
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
          {error && (
            <div className="flex items-start gap-3 rounded-lg  ed-200 bg-red-50 p-4">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>错误</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {error.title}
                </p>
                <p className="mt-1 text-sm text-red-600">{error.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-red-400 transition-colors hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>关闭</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* 用户名 */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg  -gray-300 px-4 py-3 focus:lue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入用户名"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* 密码 */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg  -gray-300 px-4 py-3 focus:lue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
