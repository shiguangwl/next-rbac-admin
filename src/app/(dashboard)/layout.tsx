"use client";

/**
 * 后台布局
 * @description 后台管理系统主布局，包含侧边栏和顶部导航
 */

import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { type ReactNode, useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard redirectTo="/login">
      <div className="flex h-screen overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />

        {/* 主内容区 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 顶部导航 */}
          <Header />

          {/* 页面内容 */}
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
