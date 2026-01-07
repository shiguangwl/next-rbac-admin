# Implementation Plan: Admin Scaffold RBAC

## Overview

本实现计划将设计文档转化为可执行的编码任务，采用增量式开发方式，确保每个步骤都能构建在前一步骤之上。任务按照依赖关系排序：基础设施 → 数据层 → 服务层 → API 层 → UI 层。

**代码规范：单文件代码长度不超过 300 行，超过时需拆分为多个模块。**

## Tasks

- [x] 1. 项目初始化与基础配置
  - [x] 1.1 创建环境变量配置 (`src/env.mjs`)
    - 定义 DATABASE_URL、JWT_SECRET、JWT_EXPIRES_IN 等服务端变量
    - 定义 NEXT_PUBLIC_APP_URL 客户端变量
    - 使用 @t3-oss/env-nextjs 进行类型安全校验
    - _Requirements: 10.12_

  - [x] 1.2 创建数据库连接 (`src/db/index.ts`)
    - 配置 mysql2 连接池
    - 实现全局单例模式防止 HMR 重复创建连接
    - _Requirements: 1.1_

  - [x] 1.3 创建 Drizzle 配置 (`drizzle.config.ts`)
    - 配置 MySQL dialect
    - 指定 schema 和迁移输出目录
    - _Requirements: 1.1_

- [x] 2. 数据库 Schema 定义
  - [x] 2.1 创建 Drizzle Schema (`src/db/schema/`)
    - 创建 `admin.ts`（sysAdmin 表）
    - 创建 `role.ts`（sysRole 表）
    - 创建 `menu.ts`（sysMenu 表）
    - 创建 `admin-role.ts`（sysAdminRole 关联表）
    - 创建 `role-menu.ts`（sysRoleMenu 关联表）
    - 创建 `operation-log.ts`（sysOperationLog 表）
    - 创建 `relations.ts`（Drizzle relations）
    - 创建 `index.ts`（统一导出）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 编写 Schema 属性测试
    - **Property 9: 菜单树形结构正确性**
    - **Validates: Requirements 5.1**

- [x] 3. 基础工具库
  - [x] 3.1 创建自定义错误类 (`src/lib/errors.ts`)
    - 实现 AppError 基类
    - 实现 NotFoundError、ConflictError、ForbiddenError、UnauthorizedError、ValidationError、BusinessError
    - _Requirements: 7.3, 7.4_

  - [x] 3.2 创建错误处理映射 (`src/lib/error-handler.ts`)
    - 实现 Service 层错误到 HTTP 状态码的映射
    - _Requirements: 7.3, 7.4_

  - [x] 3.3 创建 JWT 工具 (`src/lib/jwt.ts`)
    - 实现 signToken 函数
    - 实现 verifyToken 函数
    - _Requirements: 2.1, 2.7_

  - [x] 3.4 创建密码工具 (`src/lib/password.ts`)
    - 实现 hashPassword 函数（bcrypt）
    - 实现 verifyPassword 函数
    - _Requirements: 2.6, 3.2_

  - [x] 3.5 编写密码加密属性测试
    - **Property 1: 密码加密验证**
    - **Validates: Requirements 2.6, 3.2, 3.5**

  - [x] 3.6 创建日志工具 (`src/lib/logger.ts`)
    - 实现结构化日志输出
    - 支持 requestId 上下文
    - _Requirements: 8.2_

  - [x] 3.7 创建请求上下文 (`src/lib/request-context.ts`)
    - 使用 AsyncLocalStorage 实现请求上下文传递
    - _Requirements: 8.2_

- [x] 4. Code Review - 基础设施
  - 检查所有文件是否符合 300 行限制
  - 检查代码风格一致性
  - 确保数据库连接正常
  - 确保 Schema 可以正确生成迁移
  - 运行 `pnpm drizzle-kit push` 验证

- [x] 5. Hono 服务端基础架构
  - [x] 5.1 创建 Hono Context 类型定义 (`src/server/context.ts`)
    - 定义 AdminPayload 类型
    - 定义 Bindings 和 Variables 类型
    - 定义 Env 类型
    - _Requirements: 2.7_

  - [x] 5.2 创建 JWT 认证中间件 (`src/server/middleware/jwt-auth.ts`)
    - 实现 jwtAuth 中间件（解析 Token）
    - 实现 requireAuth 中间件（强制登录）
    - _Requirements: 7.4_

  - [x] 5.3 编写 JWT Token 属性测试
    - **Property 2: JWT Token 结构完整性**
    - **Validates: Requirements 2.1, 2.7**

  - [x] 5.4 创建 RBAC 权限中间件 (`src/server/middleware/rbac.ts`)
    - 实现权限缓存（5 分钟 TTL）
    - 实现 loadPermissions 中间件
    - 实现 requirePermission 中间件
    - 实现超级管理员（role_id=1）跳过验证
    - 实现缓存失效函数
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

  - [x] 5.5 编写 RBAC 权限属性测试
    - **Property 11: RBAC 权限验证**
    - **Property 12: 超级管理员特权**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.7**

  - [x] 5.6 创建操作日志中间件 (`src/server/middleware/audit-log.ts`)
    - 实现 auditLog 中间件工厂函数
    - 支持异步记录日志
    - 记录执行时间、状态、错误信息
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 5.7 创建其他中间件
    - 创建 CORS 中间件 (`src/server/middleware/cors.ts`)
    - 创建 CSRF 中间件 (`src/server/middleware/csrf.ts`)
    - 创建速率限制中间件 (`src/server/middleware/rate-limit.ts`)
    - _Requirements: 10.12_

- [x] 6. Code Review - 中间件层
  - 检查所有中间件文件是否符合 300 行限制
  - 检查中间件职责是否单一
  - 验证中间件链顺序正确

- [x] 7. Service 层实现
  - [x] 7.1 创建认证服务 (`src/server/services/auth.service.ts`)
    - 实现 login 函数（验证凭据、更新登录信息、生成 Token）
    - 实现 getAdminPermissions 函数
    - 实现 getAdminMenuTree 函数
    - 实现 getAdminRoleIds 函数
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 11.1_

  - [x] 7.2 编写登录凭据属性测试
    - **Property 3: 登录凭据验证**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 7.3 创建管理员服务 (`src/server/services/admin.service.ts`)
    - 实现 getAdminList 函数（分页）
    - 实现 getAdminById 函数
    - 实现 createAdmin 函数（事务：插入管理员 + 角色关联）
    - 实现 updateAdmin 函数
    - 实现 deleteAdmin 函数（事务：删除管理员 + 角色关联）
    - 实现 resetPassword 函数
    - 实现 updateAdminRoles 函数（事务 + 清除权限缓存）
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.1, 6.2, 6.3_

  - [x] 7.4 编写管理员服务属性测试
    - **Property 4: 分页查询正确性**
    - **Property 5: 唯一性约束**
    - **Property 6: 级联删除完整性**
    - **Property 7: 自我保护约束**
    - **Property 16: 角色分配事务原子性**
    - **Validates: Requirements 3.1, 3.3, 3.6, 3.7, 6.3**

  - [x] 7.5 创建角色服务 (`src/server/services/role.service.ts`)
    - 实现 getRoleList 函数（按 sort 排序）
    - 实现 getRoleById 函数
    - 实现 createRole 函数
    - 实现 updateRole 函数
    - 实现 deleteRole 函数（检查是否有管理员关联）
    - 实现 updateRoleMenus 函数（清除所有权限缓存）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.6 编写角色服务属性测试
    - **Property 8: 角色排序正确性**
    - **Validates: Requirements 4.1**

  - [x] 7.7 创建菜单服务 (`src/server/services/menu.service.ts`)
    - 实现 getMenuList 函数
    - 实现 getMenuTree 函数（内存构建树形结构）
    - 实现 getMenuById 函数
    - 实现 createMenu 函数
    - 实现 updateMenu 函数
    - 实现 deleteMenu 函数（检查子菜单）
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 7.8 编写菜单服务属性测试
    - **Property 10: 子菜单删除约束**
    - **Validates: Requirements 5.5**

  - [x] 7.9 创建审计日志服务 (`src/server/services/audit.service.ts`)
    - 实现 createOperationLog 函数
    - 实现 getOperationLogList 函数（分页 + 多条件筛选）
    - 实现 deleteOperationLog 函数
    - _Requirements: 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 7.10 编写审计日志属性测试
    - **Property 14: 操作日志完整性**
    - **Property 15: 日志筛选正确性**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 9.2-9.7**

  - [x] 7.11 编写权限聚合属性测试
    - **Property 13: 权限聚合正确性**
    - **Validates: Requirements 7.6, 11.1**

- [x] 8. Code Review - Service 层
  - 检查所有 Service 文件是否符合 300 行限制
  - 如超过限制，拆分为多个子模块（如 admin.service.ts → admin-crud.service.ts + admin-role.service.ts）
  - 检查事务操作是否正确
  - 验证错误处理一致性
  - 运行属性测试验证正确性

- [x] 9. API 路由实现
  - [x] 9.1 创建通用 DTO (`src/server/routes/common/dtos.ts`)
    - 定义 ErrorSchema
    - 定义 PaginationSchema
    - 定义 createPaginatedSchema 工厂函数
    - _Requirements: 10.12_

  - [x] 9.2 创建认证路由 (`src/server/routes/auth/`)
    - 创建 dtos.ts（LoginInput、LoginResult、AuthInfoResult）
    - 创建 defs.ts（loginRoute、logoutRoute、getAuthInfoRoute）
    - 创建 index.ts（实现路由处理）
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 9.3 创建管理员路由 (`src/server/routes/admins/`)
    - 创建 dtos.ts（AdminSchema、CreateAdminInput、UpdateAdminInput）
    - 创建 defs.ts（listAdminsRoute、createAdminRoute、getAdminRoute、updateAdminRoute、deleteAdminRoute、resetPasswordRoute、updateAdminRolesRoute）
    - 创建 index.ts（实现路由处理 + 权限检查 + 审计日志）
    - _Requirements: 10.4, 10.5, 10.6_

  - [x] 9.4 创建角色路由 (`src/server/routes/roles/`)
    - 创建 dtos.ts（RoleSchema、CreateRoleInput、UpdateRoleInput）
    - 创建 defs.ts（listRolesRoute、createRoleRoute、getRoleRoute、updateRoleRoute、deleteRoleRoute、updateRoleMenusRoute）
    - 创建 index.ts（实现路由处理 + 权限检查 + 审计日志）
    - _Requirements: 10.7, 10.8_

  - [x] 9.5 创建菜单路由 (`src/server/routes/menus/`)
    - 创建 dtos.ts（MenuSchema、MenuTreeNodeSchema、CreateMenuInput、UpdateMenuInput）
    - 创建 defs.ts（listMenusRoute、getMenuTreeRoute、createMenuRoute、getMenuRoute、updateMenuRoute、deleteMenuRoute）
    - 创建 index.ts（实现路由处理 + 权限检查 + 审计日志）
    - _Requirements: 10.9, 10.10_

  - [x] 9.6 创建操作日志路由 (`src/server/routes/operation-logs/`)
    - 创建 dtos.ts（OperationLogSchema、LogQueryParams）
    - 创建 defs.ts（listLogsRoute、deleteLogRoute）
    - 创建 index.ts（实现路由处理 + 权限检查）
    - _Requirements: 10.11_

  - [x] 9.7 创建路由拼装 (`src/server/route-defs.ts`)
    - 拼装所有路由模块
    - 导出 AppType 类型
    - _Requirements: 10.12_

  - [x] 9.8 创建 Hono 应用实例 (`src/server/app.ts`)
    - 按顺序注册中间件（CORS → RequestId → Logger → CSRF → Rate-limit → JWT → LoadPermissions）
    - 挂载路由
    - 配置 OpenAPI 文档和 Swagger UI
    - 实现全局错误处理
    - _Requirements: 10.12_

  - [x] 9.9 创建类型导出 (`src/server/types.ts`)
    - 仅导出 AppType 类型（零副作用）
    - _Requirements: 10.12_

  - [x] 9.10 创建 API Route Handler (`src/app/api/[[...route]]/route.ts`)
    - 导出 GET、POST、PUT、PATCH、DELETE 处理函数
    - _Requirements: 10.12_

- [x] 10. Code Review - API 层
  - 检查所有路由文件是否符合 300 行限制
  - 检查 defs.ts 和 index.ts 职责分离是否清晰
  - 使用 Swagger UI 测试所有 API
  - 验证权限检查正常工作
  - 验证审计日志正常记录

- [x] 11. 前端基础架构
  - [x] 11.1 创建 Hono RPC Client (`src/lib/client.ts`)
    - 配置 baseUrl（SSR/CSR 区分）
    - 配置 headers（自动注入 Authorization）
    - _Requirements: 11.2_

  - [x] 11.2 创建工具函数 (`src/lib/utils.ts`)
    - 实现 cn 函数（clsx + tailwind-merge）
    - _Requirements: 11.5_

  - [x] 11.3 创建 useAuth Hook (`src/hooks/use-auth.ts`)
    - 使用 Zustand 管理认证状态
    - 实现 login、logout、refreshAuth 方法
    - 使用 persist 中间件持久化 token
    - _Requirements: 11.2_

  - [x] 11.4 创建 usePermission Hook (`src/hooks/use-permission.ts`)
    - 实现 hasPermission 函数
    - 实现 hasAnyPermission 函数
    - 实现 hasAllPermissions 函数
    - _Requirements: 11.3_

  - [x] 11.5 创建 React Query Hooks (`src/hooks/queries/`)
    - 创建 use-admins.ts（useAdmins、useCreateAdmin、useUpdateAdmin、useDeleteAdmin）
    - 创建 use-roles.ts（useRoles、useCreateRole、useUpdateRole、useDeleteRole）
    - 创建 use-menus.ts（useMenus、useMenuTree、useCreateMenu、useUpdateMenu、useDeleteMenu）
    - 创建 use-operation-logs.ts（useOperationLogs、useDeleteOperationLog）
    - _Requirements: 11.2_

- [x] 12. 前端组件实现
  - [x] 12.1 创建权限守卫组件
    - 创建 AuthGuard (`src/components/auth-guard.tsx`)
    - 创建 PermissionGuard (`src/components/permission-guard.tsx`)
    - _Requirements: 11.4_

  - [x] 12.2 创建布局组件
    - 创建 Sidebar (`src/components/layout/sidebar.tsx`)
    - 创建 Header (`src/components/layout/header.tsx`)
    - _Requirements: 11.5_

  - [x] 12.3 创建通用 UI 组件
    - 创建 Icon 组件 (`src/components/ui/icon.tsx`)
    - 创建 Pagination 组件 (`src/components/ui/pagination.tsx`)
    - _Requirements: 11.5_

  - [x] 12.4 创建 Providers (`src/app/providers.tsx`)
    - 配置 QueryClientProvider
    - 配置 AuthInitializer
    - _Requirements: 11.2_

- [x] 13. Code Review - 前端基础架构
  - 检查所有 Hook 文件是否符合 300 行限制
  - 检查组件职责是否单一
  - 验证类型定义完整性

- [x] 14. 前端页面实现
  - [x] 14.1 创建根布局 (`src/app/layout.tsx`)
    - 配置 Providers
    - 配置全局样式
    - _Requirements: 11.5_

  - [x] 14.2 创建认证布局和登录页
    - 创建 `src/app/(auth)/layout.tsx`
    - 创建 `src/app/(auth)/login/page.tsx`
    - _Requirements: 2.1_

  - [x] 14.3 创建后台布局
    - 创建 `src/app/(dashboard)/layout.tsx`（包含 AuthGuard、Sidebar、Header）
    - 创建 `src/app/(dashboard)/page.tsx`（仪表盘首页）
    - _Requirements: 11.5_

  - [x] 14.4 创建用户管理页面
    - 创建 `src/app/(dashboard)/system/admin/page.tsx`
    - 创建 `src/app/(dashboard)/system/admin/admin-form-dialog.tsx`
    - _Requirements: 3.1, 3.2, 3.4, 3.6_

  - [x] 14.5 创建角色管理页面
    - 创建 `src/app/(dashboard)/system/role/page.tsx`
    - 创建角色表单对话框
    - 创建菜单权限分配对话框
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 14.6 创建菜单管理页面
    - 创建 `src/app/(dashboard)/system/menu/page.tsx`
    - 创建菜单表单对话框
    - _Requirements: 5.1, 5.2, 5.4, 5.6_

  - [x] 14.7 创建操作日志页面
    - 创建 `src/app/(dashboard)/system/log/page.tsx`
    - 实现多条件筛选
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 14.8 创建 Next.js Middleware (`middleware.ts`)
    - 实现页面级路由守卫
    - 配置公开路由和受保护路由
    - _Requirements: 11.5_

- [x] 15. Code Review - 前端页面
  - 检查所有页面文件是否符合 300 行限制
  - 如超过限制，拆分为子组件（如 page.tsx → page.tsx + components/admin-table.tsx + components/admin-filters.tsx）
  - 验证登录流程正常
  - 验证权限控制正常
  - 验证所有 CRUD 操作正常

- [x] 16. 初始化数据
  - [x] 16.1 创建 Seed 脚本 (`src/db/seed.ts`)
    - 初始化超级管理员账号（admin/admin123）
    - 初始化基础角色（超级管理员、管理员、运营）
    - 初始化系统管理菜单
    - 初始化角色菜单关联
    - 初始化管理员角色关联
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 16.2 配置 package.json 脚本
    - 添加 `db:seed` 脚本
    - 添加 `db:push` 脚本
    - 添加 `db:studio` 脚本
    - _Requirements: 12.1_

- [x] 17. Final Code Review & Verification
  - 全局检查所有文件是否符合 300 行限制
  - 检查代码风格一致性（使用 Biome）
  - 运行 `pnpm db:push` 同步数据库
  - 运行 `pnpm db:seed` 初始化数据
  - 启动开发服务器验证完整流程
  - 使用 admin/admin123 登录测试
  - 验证所有功能正常工作

- [x] 18.编写readme.md文件

## Notes

- Code Review 任务用于阶段性代码审查，确保代码质量
- **单文件代码长度不超过 300 行**，超过时需拆分为多个模块
- 属性测试使用 Vitest + fast-check 框架
- 所有时间字段在 DTO 中序列化为 ISO 8601 字符串
- 事务操作使用 `db.transaction()` 确保原子性
- 所有属性测试任务均为必须执行

## File Size Guidelines

当文件超过 300 行时，按以下方式拆分：

| 原文件 | 拆分方案 |
|--------|----------|
| `schema.ts` | 按表拆分为 `schema/admin.ts`、`schema/role.ts` 等 |
| `admin.service.ts` | 按功能拆分为 `admin-crud.service.ts`、`admin-role.service.ts` |
| `page.tsx` | 拆分为 `page.tsx` + `components/xxx-table.tsx` + `components/xxx-form.tsx` |
| `defs.ts` | 按操作类型拆分为 `defs/list.ts`、`defs/create.ts` 等 |
