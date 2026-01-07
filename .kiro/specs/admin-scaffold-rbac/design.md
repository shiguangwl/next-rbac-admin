# Design Document: Admin Scaffold RBAC

## Overview

本设计文档描述了一个基于 Next.js 15 + Hono + Drizzle ORM 技术栈的后台管理系统基础脚手架。系统采用独立的管理员认证体系（与 C 端用户分离），实现基于角色的访问控制（RBAC）和完整的操作日志记录功能。

### 技术选型调整

| 原规范 | 本项目调整 | 原因 |
|--------|-----------|------|
| PostgreSQL | MySQL 8.0+ | 用户现有数据库设计基于 MySQL |
| Auth.js | 自定义 JWT 认证 | 独立管理员体系，不依赖 OAuth |
| `postgres` driver | `mysql2` driver | 适配 MySQL |

### 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────┐        ┌────────────────────────┐     │
│  │  Next.js Pages   │        │   Client Components    │     │
│  │  (RSC/SSR)       │        │   (React Query)        │     │
│  └────────┬─────────┘        └───────────┬────────────┘     │
└───────────┼──────────────────────────────┼──────────────────┘
            │ Direct Import                │ HTTP (Hono RPC)
            │ (Service Layer)              │ (client.api.*)
            │                              │
            │ ⚠️ RSC 直接调用 Service      │ ⚠️ Client 通过 RPC 调用 API
            │ 如: adminService.getList()   │ 如: client.api.admins.$get()
┌───────────┼──────────────────────────────┼──────────────────┐
│           ▼                              ▼                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (Hono OpenAPI Routes)          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │  │ JWT Auth    │  │ RBAC Check  │  │ Audit Logger │  │   │
│  │  │ Middleware  │  │ Middleware  │  │ Middleware   │  │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │   │
│  └─────────────────────────┬────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer (Business Logic)           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ AdminService │  │ RoleService  │  │ MenuService│  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │ AuthService  │  │ AuditService │                  │   │
│  │  └──────────────┘  └──────────────┘                  │   │
│  └─────────────────────────┬────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Data Access Layer (Drizzle ORM)             │   │
│  │                    MySQL 8.0+                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流规则（重要）

| 调用方 | 目标 | 方式 | 示例 |
|--------|------|------|------|
| **RSC (Server Component)** | Service 层 | 直接导入 | `await adminService.getAdminList()` |
| **Client Component** | API 层 | Hono RPC | `client.api.admins.$get()` |
| API 层 | Service 层 | 函数调用 | `await getAdminById(id)` |
| Service 层 | 数据库 | Drizzle ORM | `db.query.sysAdmin.findMany()` |

**⚠️ 禁止事项：**
- ❌ RSC 调用 `client.api.*`（会发起不必要的 HTTP 请求，性能浪费）
- ❌ Client Component 直接导入 Service 层（会暴露服务端代码）
- ❌ API 层直接写 SQL（应通过 Service 层）
- ❌ Service 层包含 HTTP 逻辑（应保持纯业务逻辑）

## Architecture

### 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── [[...route]]/
│   │       └── route.ts              # Hono 入口
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # 登录页
│   ├── (dashboard)/
│   │   ├── layout.tsx                # 后台布局
│   │   ├── page.tsx                  # 仪表盘首页
│   │   └── system/
│   │       ├── admin/page.tsx        # 管理员管理
│   │       ├── role/page.tsx         # 角色管理
│   │       └── menu/page.tsx         # 菜单管理
│   ├── providers.tsx
│   └── layout.tsx
├── db/
│   ├── schema.ts                     # Drizzle Schema (MySQL)
│   ├── index.ts                      # 数据库连接
│   └── seed.ts                       # 初始化数据脚本
├── lib/
│   ├── jwt.ts                        # JWT 工具
│   ├── password.ts                   # 密码加密工具
│   ├── errors.ts                     # 自定义错误类
│   ├── error-handler.ts              # 错误映射
│   ├── logger.ts                     # 日志工具
│   ├── client.ts                     # Hono RPC Client
│   └── request-context.ts            # AsyncLocalStorage
├── hooks/
│   ├── use-auth.ts                   # 认证状态 Hook
│   ├── use-permission.ts             # 权限检查 Hook
│   └── queries/                      # React Query Hooks
│       ├── use-admins.ts
│       ├── use-roles.ts
│       └── use-menus.ts
├── components/
│   ├── permission-guard.tsx          # 权限守卫组件
│   └── ...
├── server/
│   ├── app.ts                        # Hono 实例
│   ├── context.ts                    # 共享类型定义
│   ├── types.ts                      # 类型导出
│   ├── route-defs.ts                 # 路由拼装
│   ├── middleware/
│   │   ├── jwt-auth.ts               # JWT 认证中间件
│   │   ├── rbac.ts                   # RBAC 权限中间件
│   │   ├── audit-log.ts              # 操作日志中间件
│   │   ├── cors.ts
│   │   ├── csrf.ts
│   │   └── rate-limit.ts
│   ├── services/
│   │   ├── auth.service.ts           # 认证服务
│   │   ├── admin.service.ts          # 管理员服务
│   │   ├── role.service.ts           # 角色服务
│   │   ├── menu.service.ts           # 菜单服务
│   │   └── audit.service.ts          # 审计日志服务
│   └── routes/
│       ├── auth/
│       │   ├── index.ts
│       │   ├── defs.ts
│       │   └── dtos.ts
│       ├── admins/
│       ├── roles/
│       ├── menus/
│       └── operation-logs/
└── env.mjs                           # 环境变量校验
```

## Components and Interfaces

### 1. 数据库 Schema (Drizzle ORM for MySQL)

```typescript
// src/db/schema.ts
import {
  mysqlTable,
  bigint,
  varchar,
  text,
  tinyint,
  datetime,
  mysqlEnum,
  int,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core'
import { relations, sql } from 'drizzle-orm'

// ========== 管理员表 ==========
export const sysAdmin = mysqlTable('sys_admin', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 50 }).notNull().default(''),
  status: tinyint('status', { unsigned: true }).notNull().default(1), // 0-禁用 1-正常
  loginIp: varchar('login_ip', { length: 50 }),
  loginTime: datetime('login_time'),
  remark: varchar('remark', { length: 500 }),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  usernameIdx: uniqueIndex('uk_username').on(table.username),
  statusIdx: index('idx_status').on(table.status),
}))

// ========== 角色表 ==========
export const sysRole = mysqlTable('sys_role', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  roleName: varchar('role_name', { length: 50 }).notNull(),
  sort: int('sort', { unsigned: true }).notNull().default(0),
  status: tinyint('status', { unsigned: true }).notNull().default(1),
  remark: varchar('remark', { length: 500 }),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('idx_status').on(table.status),
  sortIdx: index('idx_sort').on(table.sort),
}))

// ========== 菜单权限表 ==========
export const sysMenu = mysqlTable('sys_menu', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  parentId: bigint('parent_id', { mode: 'number', unsigned: true }).notNull().default(0),
  menuType: mysqlEnum('menu_type', ['D', 'M', 'B']).notNull().default('M'), // D-目录 M-菜单 B-按钮
  menuName: varchar('menu_name', { length: 50 }).notNull(),
  permission: varchar('permission', { length: 100 }),
  path: varchar('path', { length: 200 }),
  component: varchar('component', { length: 200 }),
  icon: varchar('icon', { length: 100 }),
  sort: int('sort', { unsigned: true }).notNull().default(0),
  visible: tinyint('visible', { unsigned: true }).notNull().default(1),
  status: tinyint('status', { unsigned: true }).notNull().default(1),
  isExternal: tinyint('is_external', { unsigned: true }).notNull().default(0),
  isCache: tinyint('is_cache', { unsigned: true }).notNull().default(1),
  remark: varchar('remark', { length: 500 }),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  permissionIdx: uniqueIndex('uk_permission').on(table.permission),
  parentIdIdx: index('idx_parent_id').on(table.parentId),
  sortIdx: index('idx_sort').on(table.sort),
  statusIdx: index('idx_status').on(table.status),
  menuTypeIdx: index('idx_menu_type').on(table.menuType),
}))

// ========== 管理员角色关联表 ==========
export const sysAdminRole = mysqlTable('sys_admin_role', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  adminId: bigint('admin_id', { mode: 'number', unsigned: true }).notNull(),
  roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  adminRoleIdx: uniqueIndex('uk_admin_role').on(table.adminId, table.roleId),
  adminIdIdx: index('idx_admin_id').on(table.adminId),
  roleIdIdx: index('idx_role_id').on(table.roleId),
}))

// ========== 角色菜单关联表 ==========
export const sysRoleMenu = mysqlTable('sys_role_menu', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
  menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  roleMenuIdx: uniqueIndex('uk_role_menu').on(table.roleId, table.menuId),
  roleIdIdx: index('idx_role_id').on(table.roleId),
  menuIdIdx: index('idx_menu_id').on(table.menuId),
}))

// ========== 操作日志表 ==========
export const sysOperationLog = mysqlTable('sys_operation_log', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  adminId: bigint('admin_id', { mode: 'number', unsigned: true }),
  adminName: varchar('admin_name', { length: 50 }),
  module: varchar('module', { length: 50 }),
  operation: varchar('operation', { length: 50 }),
  description: varchar('description', { length: 500 }),
  method: varchar('method', { length: 200 }),
  requestMethod: varchar('request_method', { length: 10 }),
  requestUrl: varchar('request_url', { length: 500 }),
  requestParams: text('request_params'),
  responseResult: text('response_result'),
  ip: varchar('ip', { length: 50 }),
  ipLocation: varchar('ip_location', { length: 100 }),
  userAgent: varchar('user_agent', { length: 500 }),
  executionTime: bigint('execution_time', { mode: 'number', unsigned: true }),
  status: tinyint('status', { unsigned: true }).notNull().default(1), // 0-失败 1-成功
  errorMsg: text('error_msg'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  adminIdIdx: index('idx_admin_id').on(table.adminId),
  moduleIdx: index('idx_module').on(table.module),
  operationIdx: index('idx_operation').on(table.operation),
  statusIdx: index('idx_status').on(table.status),
  createdAtIdx: index('idx_created_at').on(table.createdAt),
}))

// ========== Relations ==========
export const sysAdminRelations = relations(sysAdmin, ({ many }) => ({
  adminRoles: many(sysAdminRole),
}))

export const sysRoleRelations = relations(sysRole, ({ many }) => ({
  adminRoles: many(sysAdminRole),
  roleMenus: many(sysRoleMenu),
}))

export const sysMenuRelations = relations(sysMenu, ({ many }) => ({
  roleMenus: many(sysRoleMenu),
}))

export const sysAdminRoleRelations = relations(sysAdminRole, ({ one }) => ({
  admin: one(sysAdmin, { fields: [sysAdminRole.adminId], references: [sysAdmin.id] }),
  role: one(sysRole, { fields: [sysAdminRole.roleId], references: [sysRole.id] }),
}))

export const sysRoleMenuRelations = relations(sysRoleMenu, ({ one }) => ({
  role: one(sysRole, { fields: [sysRoleMenu.roleId], references: [sysRole.id] }),
  menu: one(sysMenu, { fields: [sysRoleMenu.menuId], references: [sysMenu.id] }),
}))
```

### 2. Hono Context 类型定义

```typescript
// src/server/context.ts
export type AdminPayload = {
  adminId: number
  username: string
  roleIds: number[]
}

export type Bindings = {
  // 无外部注入（不使用 Auth.js）
}

export type Variables = {
  requestId: string
  admin: AdminPayload | null
  permissions: string[] | null
}

export type Env = {
  Bindings: Bindings
  Variables: Variables
}
```

### 3. JWT 认证中间件

```typescript
// src/server/middleware/jwt-auth.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'jsonwebtoken'
import type { Env, AdminPayload } from '@/server/context'
import { env } from '@/env'

export const jwtAuth = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    c.set('admin', null)
    c.set('permissions', null)
    return next()
  }

  const token = authHeader.slice(7)
  
  try {
    const payload = verify(token, env.JWT_SECRET) as AdminPayload
    c.set('admin', payload)
  } catch {
    c.set('admin', null)
    c.set('permissions', null)
  }
  
  return next()
})

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const admin = c.get('admin')
  if (!admin) {
    throw new HTTPException(401, { message: '未登录或登录已过期' })
  }
  return next()
})
```

### 4. RBAC 权限中间件

```typescript
// src/server/middleware/rbac.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '@/server/context'
import { getAdminPermissions } from '@/server/services/auth.service'

const SUPER_ADMIN_ROLE_ID = 1

// 权限缓存（简单内存缓存，生产环境建议使用 Redis）
const permissionCache = new Map<number, { permissions: string[]; expireAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

async function getCachedPermissions(adminId: number): Promise<string[]> {
  const cached = permissionCache.get(adminId)
  if (cached && cached.expireAt > Date.now()) {
    return cached.permissions
  }
  
  const permissions = await getAdminPermissions(adminId)
  permissionCache.set(adminId, {
    permissions,
    expireAt: Date.now() + CACHE_TTL,
  })
  
  return permissions
}

// 清除指定管理员的权限缓存（在角色变更时调用）
export function invalidatePermissionCache(adminId: number) {
  permissionCache.delete(adminId)
}

// 清除所有权限缓存（在角色权限变更时调用）
export function invalidateAllPermissionCache() {
  permissionCache.clear()
}

export const loadPermissions = createMiddleware<Env>(async (c, next) => {
  const admin = c.get('admin')
  
  if (!admin) {
    c.set('permissions', null)
    return next()
  }

  // 超级管理员拥有所有权限，无需查询
  if (admin.roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    c.set('permissions', ['*'])
    return next()
  }

  // 使用缓存获取权限
  const permissions = await getCachedPermissions(admin.adminId)
  c.set('permissions', permissions)
  
  return next()
})

export function requirePermission(permission: string) {
  return createMiddleware<Env>(async (c, next) => {
    const admin = c.get('admin')
    if (!admin) {
      throw new HTTPException(401, { message: '未登录或登录已过期' })
    }

    const permissions = c.get('permissions')
    
    // 超级管理员直接放行
    if (permissions?.includes('*')) {
      return next()
    }

    if (!permissions?.includes(permission)) {
      throw new HTTPException(403, { message: '无权限访问' })
    }

    return next()
  })
}
```

### 5. 操作日志中间件

```typescript
// src/server/middleware/audit-log.ts
import { createMiddleware } from 'hono/factory'
import type { Env } from '@/server/context'
import { createOperationLog } from '@/server/services/audit.service'

type AuditOptions = {
  module: string
  operation: string
  description?: string
}

export function auditLog(options: AuditOptions) {
  return createMiddleware<Env>(async (c, next) => {
    const startTime = Date.now()
    const admin = c.get('admin')
    const requestId = c.get('requestId')

    let responseStatus = 1
    let errorMsg: string | undefined

    try {
      await next()
      responseStatus = c.res.status >= 400 ? 0 : 1
    } catch (error) {
      responseStatus = 0
      errorMsg = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      const executionTime = Date.now() - startTime

      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        createOperationLog({
          adminId: admin?.adminId ?? null,
          adminName: admin?.username ?? null,
          module: options.module,
          operation: options.operation,
          description: options.description ?? null,
          method: `${c.req.method} ${c.req.path}`,
          requestMethod: c.req.method,
          requestUrl: c.req.url,
          requestParams: JSON.stringify(c.req.query()),
          ip: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
          userAgent: c.req.header('user-agent') ?? null,
          executionTime,
          status: responseStatus,
          errorMsg: errorMsg ?? null,
        }).catch(console.error)
      })
    }
  })
}
```

### 6. Service 层接口

```typescript
// src/server/services/auth.service.ts
export interface LoginInput {
  username: string
  password: string
  ip?: string
}

export interface LoginResult {
  token: string
  admin: AdminDto
  permissions: string[]
  menus: MenuTreeNode[]
}

/**
 * 管理员登录
 * 1. 验证用户名密码
 * 2. 检查账号状态
 * 3. 更新 login_ip 和 login_time
 * 4. 生成 JWT Token（包含 adminId, username, roleIds）
 * 5. 记录登录日志
 * 6. 返回 Token、管理员信息、权限列表、菜单树
 */
export async function login(input: LoginInput): Promise<LoginResult>

/**
 * 获取管理员权限列表
 * 查询管理员所有角色关联的菜单权限标识（去重）
 */
export async function getAdminPermissions(adminId: number): Promise<string[]>

/**
 * 获取管理员菜单树
 * 查询管理员所有角色关联的菜单，构建树形结构
 * 只返回 menuType 为 D 或 M 的菜单（不包含按钮）
 */
export async function getAdminMenuTree(adminId: number): Promise<MenuTreeNode[]>

/**
 * 获取管理员角色 ID 列表
 */
export async function getAdminRoleIds(adminId: number): Promise<number[]>
```

```typescript
// src/server/services/admin.service.ts
export interface CreateAdminInput {
  username: string
  password: string
  nickname?: string
  status?: number
  remark?: string
  roleIds?: number[]
}

export interface UpdateAdminInput {
  nickname?: string
  status?: number
  remark?: string
}

/**
 * 获取管理员列表（分页）
 */
export async function getAdminList(options: PaginationOptions): Promise<PaginatedResult<AdminDto>>

/**
 * 获取管理员详情
 */
export async function getAdminById(id: number): Promise<AdminDto>

/**
 * 创建管理员
 * ⚠️ 使用事务：同时插入 sys_admin 和 sys_admin_role
 */
export async function createAdmin(input: CreateAdminInput): Promise<AdminDto>

/**
 * 更新管理员
 */
export async function updateAdmin(id: number, input: UpdateAdminInput): Promise<AdminDto>

/**
 * 删除管理员
 * ⚠️ 使用事务：同时删除 sys_admin 和 sys_admin_role
 */
export async function deleteAdmin(id: number): Promise<void>

/**
 * 重置密码
 */
export async function resetPassword(id: number, newPassword: string): Promise<void>

/**
 * 更新管理员角色
 * ⚠️ 使用事务：先删除旧关联，再插入新关联
 * ⚠️ 更新后需调用 invalidatePermissionCache(id) 清除权限缓存
 */
export async function updateAdminRoles(id: number, roleIds: number[]): Promise<void>
```

**事务使用示例：**

```typescript
// createAdmin 实现示例
export async function createAdmin(input: CreateAdminInput): Promise<AdminDto> {
  return await db.transaction(async (tx) => {
    // 1. 加密密码
    const hashedPassword = await bcrypt.hash(input.password, 10)
    
    // 2. 插入管理员
    const [admin] = await tx.insert(sysAdmin).values({
      username: input.username,
      password: hashedPassword,
      nickname: input.nickname || '',
      status: input.status ?? 1,
      remark: input.remark,
    }).returning()
    
    // 3. 插入角色关联
    if (input.roleIds?.length) {
      await tx.insert(sysAdminRole).values(
        input.roleIds.map(roleId => ({ adminId: admin.id, roleId }))
      )
    }
    
    return toAdminDto(admin)
  })
}
```

```typescript
// src/server/services/role.service.ts
export interface CreateRoleInput {
  roleName: string
  sort?: number
  status?: number
  remark?: string
  menuIds?: number[]
}

export async function getRoleList(options: PaginationOptions): Promise<PaginatedResult<RoleDto>>
export async function getRoleById(id: number): Promise<RoleDto>
export async function createRole(input: CreateRoleInput): Promise<RoleDto>
export async function updateRole(id: number, input: UpdateRoleInput): Promise<RoleDto>
export async function deleteRole(id: number): Promise<void>
export async function updateRoleMenus(id: number, menuIds: number[]): Promise<void>
```

```typescript
// src/server/services/menu.service.ts
export interface CreateMenuInput {
  parentId?: number
  menuType: 'D' | 'M' | 'B'
  menuName: string
  permission?: string
  path?: string
  component?: string
  icon?: string
  sort?: number
  visible?: number
  status?: number
  isExternal?: number
  isCache?: number
  remark?: string
}

export async function getMenuList(): Promise<MenuDto[]>

/**
 * 获取菜单树
 * 实现方式：
 * 1. 从数据库获取扁平列表（Flat List）
 * 2. 在内存中构建树形结构（避免递归 SQL 查询）
 */
export async function getMenuTree(): Promise<MenuTreeNode[]>

export async function getMenuById(id: number): Promise<MenuDto>
export async function createMenu(input: CreateMenuInput): Promise<MenuDto>
export async function updateMenu(id: number, input: UpdateMenuInput): Promise<MenuDto>
export async function deleteMenu(id: number): Promise<void>
```

**菜单树构建示例：**

```typescript
// 从扁平列表构建树形结构
function buildMenuTree(menus: MenuDto[]): MenuTreeNode[] {
  const menuMap = new Map<number, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  // 第一遍：创建所有节点
  for (const menu of menus) {
    menuMap.set(menu.id, { ...menu, children: [] })
  }

  // 第二遍：建立父子关系
  for (const menu of menus) {
    const node = menuMap.get(menu.id)!
    if (menu.parentId === 0) {
      roots.push(node)
    } else {
      const parent = menuMap.get(menu.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  }

  // 按 sort 排序
  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort)
    for (const node of nodes) {
      if (node.children?.length) {
        sortNodes(node.children)
      }
    }
  }
  sortNodes(roots)

  return roots
}
```

## Data Models

### DTO 定义

```typescript
// src/server/routes/admins/dtos.ts
import { z } from 'zod'

export const AdminSchema = z.object({
  id: z.number(),
  username: z.string(),
  nickname: z.string(),
  status: z.number(),
  loginIp: z.string().nullable(),
  loginTime: z.string().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  roles: z.array(z.object({
    id: z.number(),
    roleName: z.string(),
  })).optional(),
}).openapi('Admin')

export const RoleSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  sort: z.number(),
  status: z.number(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Role')

export const MenuSchema = z.object({
  id: z.number(),
  parentId: z.number(),
  menuType: z.enum(['D', 'M', 'B']),
  menuName: z.string(),
  permission: z.string().nullable(),
  path: z.string().nullable(),
  component: z.string().nullable(),
  icon: z.string().nullable(),
  sort: z.number(),
  visible: z.number(),
  status: z.number(),
  isExternal: z.number(),
  isCache: z.number(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Menu')

export const MenuTreeNodeSchema: z.ZodType<MenuTreeNode> = z.lazy(() =>
  MenuSchema.extend({
    children: z.array(MenuTreeNodeSchema).optional(),
  })
).openapi('MenuTreeNode')

export const OperationLogSchema = z.object({
  id: z.number(),
  adminId: z.number().nullable(),
  adminName: z.string().nullable(),
  module: z.string().nullable(),
  operation: z.string().nullable(),
  description: z.string().nullable(),
  method: z.string().nullable(),
  requestMethod: z.string().nullable(),
  requestUrl: z.string().nullable(),
  requestParams: z.string().nullable(),
  responseResult: z.string().nullable(),
  ip: z.string().nullable(),
  ipLocation: z.string().nullable(),
  userAgent: z.string().nullable(),
  executionTime: z.number().nullable(),
  status: z.number(),
  errorMsg: z.string().nullable(),
  createdAt: z.string(),
}).openapi('OperationLog')
```

### 统一响应结构

```typescript
// src/server/routes/common/dtos.ts
import { z } from 'zod'

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
}).openapi('Error')

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  })
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 密码加密验证

*For any* 管理员密码，存储时必须使用 bcrypt 加密，且原始密码与加密后的哈希值通过 bcrypt.compare 验证应返回 true。

**Validates: Requirements 2.6, 3.2, 3.5**

### Property 2: JWT Token 结构完整性

*For any* 成功登录的管理员，生成的 JWT Token 解码后必须包含 adminId 和 username 字段，且这些字段值与数据库中的管理员记录一致。

**Validates: Requirements 2.1, 2.7**

### Property 3: 登录凭据验证

*For any* 登录请求，当用户名不存在或密码不匹配时，系统应返回 401 错误；当账号状态为禁用时，系统应返回账号已禁用错误。

**Validates: Requirements 2.2, 2.3**

### Property 4: 分页查询正确性

*For any* 分页查询请求（管理员列表、角色列表、日志列表），返回的 items 数量不超过 pageSize，total 等于符合条件的总记录数，totalPages 等于 ceil(total / pageSize)。

**Validates: Requirements 3.1, 4.1, 9.1**

### Property 5: 唯一性约束

*For any* 创建操作，当 username（管理员）或 permission（菜单）已存在时，系统应返回冲突错误，数据库中不应创建重复记录。

**Validates: Requirements 3.3, 5.3**

### Property 6: 级联删除完整性

*For any* 删除管理员操作，sys_admin_role 表中该管理员的所有关联记录应同时被删除；*For any* 删除角色操作，sys_role_menu 和 sys_admin_role 表中该角色的所有关联记录应同时被删除。

**Validates: Requirements 3.6, 4.4, 5.6**

### Property 7: 自我保护约束

*For any* 管理员尝试删除自己的账号，系统应拒绝该操作并返回错误。

**Validates: Requirements 3.7**

### Property 8: 角色排序正确性

*For any* 角色列表查询，返回的角色应按 sort 字段升序排列。

**Validates: Requirements 4.1**

### Property 9: 菜单树形结构正确性

*For any* 菜单树查询，每个节点的 children 数组应只包含 parentId 等于该节点 id 的菜单项，且不存在循环引用。

**Validates: Requirements 5.1**

### Property 10: 子菜单删除约束

*For any* 删除菜单操作，当该菜单存在子菜单时，系统应拒绝删除并返回错误。

**Validates: Requirements 5.5**

### Property 11: RBAC 权限验证

*For any* 受保护的 API 请求，当管理员拥有所需权限标识时应允许访问，当缺少权限时应返回 403 错误，当未登录或 Token 无效时应返回 401 错误。

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 12: 超级管理员特权

*For any* 角色 ID 为 1 的管理员，访问任何受保护的 API 时应跳过权限验证直接放行。

**Validates: Requirements 7.7**

### Property 13: 权限聚合正确性

*For any* 管理员的权限查询，返回的权限列表应等于该管理员所有角色关联的菜单权限标识的并集（去重）。

**Validates: Requirements 7.6, 11.1**

### Property 14: 操作日志完整性

*For any* 增删改操作，操作日志应记录 adminId、adminName、module、operation、requestMethod、requestUrl、executionTime、status 字段；成功操作 status 为 1，失败操作 status 为 0 且 errorMsg 不为空。

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 15: 日志筛选正确性

*For any* 日志筛选查询，返回的所有日志记录应满足所有指定的筛选条件（管理员、模块、操作类型、状态、时间范围）。

**Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 16: 角色分配事务原子性

*For any* 批量更新管理员角色操作，要么所有角色关联都成功更新，要么全部回滚，不存在部分更新的中间状态。

**Validates: Requirements 6.3**

## Error Handling

### 错误类型定义

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '无权限访问') {
    super(message, 'FORBIDDEN')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未登录或登录已过期') {
    super(message, 'UNAUTHORIZED')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
  }
}

export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(message, code)
  }
}
```

### 错误映射

```typescript
// src/lib/error-handler.ts
import { AppError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from './errors'

export function errorHandler(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof UnauthorizedError) {
    return { status: 401, code: err.code, message: err.message }
  }
  if (err instanceof ForbiddenError) {
    return { status: 403, code: err.code, message: err.message }
  }
  if (err instanceof NotFoundError) {
    return { status: 404, code: err.code, message: err.message }
  }
  if (err instanceof ConflictError) {
    return { status: 409, code: err.code, message: err.message }
  }
  if (err instanceof ValidationError) {
    return { status: 400, code: err.code, message: err.message }
  }
  if (err instanceof AppError) {
    return { status: 400, code: err.code, message: err.message }
  }

  console.error('Unexpected error:', err)
  return { status: 500, code: 'INTERNAL_ERROR', message: '服务器内部错误' }
}
```

### 统一错误响应格式

```json
{
  "code": "NOT_FOUND",
  "message": "Admin with id 123 not found",
  "details": null
}
```

## Testing Strategy

### 测试框架选择

- **单元测试**: Vitest
- **属性测试**: fast-check
- **集成测试**: Vitest + Supertest

### 测试分层

1. **Service 层单元测试**: 测试业务逻辑，mock 数据库操作
2. **属性测试**: 验证核心正确性属性
3. **API 集成测试**: 测试完整的请求-响应流程

### 属性测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 属性测试示例

```typescript
// src/server/services/__tests__/auth.service.property.test.ts
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'

describe('Property 1: 密码加密验证', () => {
  it('should verify password correctly after bcrypt hash', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 50 }),
        async (password) => {
          const hash = await bcrypt.hash(password, 10)
          const isValid = await bcrypt.compare(password, hash)
          expect(isValid).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### 单元测试与属性测试的平衡

- **单元测试**: 用于边界条件、错误处理、特定业务场景
- **属性测试**: 用于验证通用正确性属性，覆盖更广泛的输入空间

## API Routes Summary

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| POST | /api/auth/login | 管理员登录 | Public |
| POST | /api/auth/logout | 管理员登出 | Authenticated |
| GET | /api/auth/info | 获取当前管理员信息 | Authenticated |
| GET | /api/admins | 获取管理员列表 | system:admin:list |
| POST | /api/admins | 创建管理员 | system:admin:add |
| GET | /api/admins/:id | 获取管理员详情 | system:admin:query |
| PUT | /api/admins/:id | 更新管理员 | system:admin:edit |
| DELETE | /api/admins/:id | 删除管理员 | system:admin:delete |
| PUT | /api/admins/:id/reset-password | 重置密码 | system:admin:resetPwd |
| PUT | /api/admins/:id/roles | 更新管理员角色 | system:admin:edit |
| GET | /api/roles | 获取角色列表 | system:role:list |
| POST | /api/roles | 创建角色 | system:role:add |
| GET | /api/roles/:id | 获取角色详情 | system:role:query |
| PUT | /api/roles/:id | 更新角色 | system:role:edit |
| DELETE | /api/roles/:id | 删除角色 | system:role:delete |
| PUT | /api/roles/:id/menus | 更新角色菜单权限 | system:role:edit |
| GET | /api/menus | 获取菜单列表 | system:menu:list |
| GET | /api/menus/tree | 获取菜单树 | system:menu:list |
| POST | /api/menus | 创建菜单 | system:menu:add |
| GET | /api/menus/:id | 获取菜单详情 | system:menu:query |
| PUT | /api/menus/:id | 更新菜单 | system:menu:edit |
| DELETE | /api/menus/:id | 删除菜单 | system:menu:delete |
| GET | /api/operation-logs | 获取操作日志列表 | system:log:list |
| DELETE | /api/operation-logs/:id | 删除操作日志 | system:log:delete |

## Environment Variables

### env.mjs 完整定义

```typescript
// src/env.mjs
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // 数据库配置 (MySQL)
    DATABASE_URL: z.string().url(),
    DATABASE_MAX_CONNECTIONS: z.coerce.number().int().positive().optional(),
    DATABASE_IDLE_TIMEOUT: z.coerce.number().int().positive().optional(),
    DATABASE_CONNECT_TIMEOUT: z.coerce.number().int().positive().optional(),
    
    // JWT 配置
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    
    // 运行环境
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().transform((v) => v.replace(/\/$/, '')),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_MAX_CONNECTIONS: process.env.DATABASE_MAX_CONNECTIONS,
    DATABASE_IDLE_TIMEOUT: process.env.DATABASE_IDLE_TIMEOUT,
    DATABASE_CONNECT_TIMEOUT: process.env.DATABASE_CONNECT_TIMEOUT,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

### .env.example

```bash
# 数据库配置 (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/admin_system"
DATABASE_MAX_CONNECTIONS=10
DATABASE_IDLE_TIMEOUT=20
DATABASE_CONNECT_TIMEOUT=10

# JWT 配置
JWT_SECRET="your-jwt-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Database Connection

### db/index.ts (MySQL 适配)

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '@/env'
import * as schema from './schema'

declare global {
  var __dbConnection: mysql.Pool | undefined
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

const connection = globalThis.__dbConnection ?? mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: env.DATABASE_MAX_CONNECTIONS ?? 10,
  idleTimeout: (env.DATABASE_IDLE_TIMEOUT ?? 20) * 1000,
  connectTimeout: (env.DATABASE_CONNECT_TIMEOUT ?? 10) * 1000,
})

if (env.NODE_ENV !== 'production') {
  globalThis.__dbConnection = connection
}

export const db = globalThis.__db ?? drizzle(connection, { schema, mode: 'default' })

if (env.NODE_ENV !== 'production') {
  globalThis.__db = db
}
```

### drizzle.config.ts

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
```

## Hono App Configuration

### 中间件顺序（符合规范）

```typescript
// src/server/app.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { swaggerUI } from '@hono/swagger-ui'

import { corsMiddleware } from './middleware/cors'
import { csrfMiddleware } from './middleware/csrf'
import { apiRateLimiter } from './middleware/rate-limit'
import { jwtAuth, requireAuth } from './middleware/jwt-auth'
import { loadPermissions } from './middleware/rbac'
import { withRequestContext } from '@/lib/request-context'
import { errorHandler } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import type { Env } from './context'

import { routes } from './route-defs'

const app = new OpenAPIHono<Env>({ strict: false })

// 1. CORS 最先处理（快速响应 OPTIONS 预检请求）
app.use('*', corsMiddleware)

// 2. 注入 requestId + AsyncLocalStorage 包装
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)
  return await withRequestContext({ requestId }, next)
})

// 3. 请求日志中间件
app.use('*', async (c, next) => {
  const requestId = c.get('requestId')
  const start = Date.now()
  
  await next()
  
  const duration = Date.now() - start
  logger.info('Request completed', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  })
})

// 4. CSRF 防护
app.use('*', csrfMiddleware)

// 5. API 速率限制
app.use('/api/*', apiRateLimiter)

// 6. JWT 认证（解析 Token，不强制要求登录）
app.use('/api/*', jwtAuth)

// 7. 加载用户权限
app.use('/api/*', loadPermissions)

// 挂载路由
app.route('/', routes)

// OpenAPI 文档
app.doc('/api/doc', {
  openapi: '3.0.0',
  info: { title: 'Admin Panel API', version: '1.0.0' },
})
app.get('/api/swagger', swaggerUI({ url: '/api/doc' }))

// 全局错误处理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ code: 'HTTP_EXCEPTION', message: err.message, details: null }, err.status)
  }

  if (err instanceof ZodError) {
    return c.json({
      code: 'VALIDATION_ERROR',
      message: '请求参数错误',
      details: err.flatten(),
    }, 400)
  }

  const { status, code, message } = errorHandler(err)
  return c.json({ code, message, details: null }, status)
})

export default app
```

## Dependencies

```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "hono": "latest",
    "@hono/zod-openapi": "latest",
    "@hono/swagger-ui": "latest",
    "drizzle-orm": "latest",
    "mysql2": "latest",
    "@tanstack/react-query": "latest",
    "zustand": "latest",
    "zod": "latest",
    "@t3-oss/env-nextjs": "latest",
    "bcryptjs": "latest",
    "jsonwebtoken": "latest",
    "hono-rate-limiter": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/bcryptjs": "latest",
    "@types/jsonwebtoken": "latest",
    "drizzle-kit": "latest",
    "@biomejs/biome": "latest",
    "vitest": "latest",
    "fast-check": "latest",
    "tailwindcss": "latest",
    "postcss": "latest",
    "autoprefixer": "latest"
  }
}
```
```

## UI Layer Design

### 技术选型

| 技术 | 作用 |
|------|------|
| **Tailwind CSS** | 原子化 CSS 框架 |
| **shadcn/ui** | 基于 Radix UI 的组件库 |
| **Lucide** | 图标库 |
| **React Query** | 服务端状态管理 |
| **Zustand** | 客户端 UI 状态 |

### 页面结构

```
src/app/
├── (auth)/                          # 认证相关页面（公开）
│   ├── login/
│   │   └── page.tsx                 # 登录页
│   └── layout.tsx                   # 认证布局（居中卡片）
├── (dashboard)/                     # 后台管理页面（受保护）
│   ├── layout.tsx                   # 后台布局（侧边栏 + 顶栏）
│   ├── page.tsx                     # 仪表盘首页
│   └── system/
│       ├── admin/
│       │   └── page.tsx             # 管理员管理
│       ├── role/
│       │   └── page.tsx             # 角色管理
│       ├── menu/
│       │   └── page.tsx             # 菜单管理
│       └── log/
│           └── page.tsx             # 操作日志
├── providers.tsx                    # 全局 Providers
└── layout.tsx                       # 根布局
```

### 布局组件

#### 后台布局 (Dashboard Layout)

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
```

#### 侧边栏组件

```typescript
// src/components/layout/sidebar.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { usePermission } from '@/hooks/use-permission'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const { menus } = useAuth()
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold">Admin Panel</span>
      </div>
      <nav className="p-4">
        <MenuTree menus={menus} pathname={pathname} />
      </nav>
    </aside>
  )
}

function MenuTree({ menus, pathname, level = 0 }) {
  return (
    <ul className={cn('space-y-1', level > 0 && 'ml-4')}>
      {menus.map((menu) => (
        <li key={menu.id}>
          {menu.menuType === 'D' ? (
            // 目录：展开子菜单
            <div>
              <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600">
                {menu.icon && <Icon name={menu.icon} className="mr-2 h-4 w-4" />}
                {menu.menuName}
              </div>
              {menu.children && (
                <MenuTree menus={menu.children} pathname={pathname} level={level + 1} />
              )}
            </div>
          ) : menu.menuType === 'M' ? (
            // 菜单：可点击链接
            <Link
              href={menu.path || '#'}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm',
                pathname === menu.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {menu.icon && <Icon name={menu.icon} className="mr-2 h-4 w-4" />}
              {menu.menuName}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
```

### 权限控制组件

#### AuthGuard - 认证守卫

```typescript
// src/components/auth-guard.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

#### PermissionGuard - 权限守卫

```typescript
// src/components/permission-guard.tsx
'use client'

import { usePermission } from '@/hooks/use-permission'

interface PermissionGuardProps {
  permission: string | string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission } = usePermission()

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasAccess = permissions.some((p) => hasPermission(p))

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 使用示例
// <PermissionGuard permission="system:admin:add">
//   <Button>新增管理员</Button>
// </PermissionGuard>
```

### React Hooks

#### useAuth - 认证状态

```typescript
// src/hooks/use-auth.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { client } from '@/lib/client'

interface AuthState {
  token: string | null
  admin: AdminDto | null
  permissions: string[]
  menus: MenuTreeNode[]
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      permissions: [],
      menus: [],
      isAuthenticated: false,
      isLoading: true,

      login: async (username, password) => {
        const res = await client.api.auth.login.$post({
          json: { username, password },
        })
        if (!res.ok) throw new Error('登录失败')
        
        const data = await res.json()
        set({
          token: data.token,
          admin: data.admin,
          permissions: data.permissions,
          menus: data.menus,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: async () => {
        await client.api.auth.logout.$post()
        set({
          token: null,
          admin: null,
          permissions: [],
          menus: [],
          isAuthenticated: false,
        })
      },

      refreshAuth: async () => {
        try {
          const res = await client.api.auth.info.$get()
          if (!res.ok) throw new Error()
          
          const data = await res.json()
          set({
            admin: data.admin,
            permissions: data.permissions,
            menus: data.menus,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch {
          set({ isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
```

#### usePermission - 权限检查

```typescript
// src/hooks/use-permission.ts
'use client'

import { useAuth } from './use-auth'
import { useCallback } from 'react'

export function usePermission() {
  const { permissions } = useAuth()

  const hasPermission = useCallback(
    (permission: string) => {
      // 超级管理员拥有所有权限
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },
    [permissions]
  )

  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some((p) => hasPermission(p)),
    [hasPermission]
  )

  const hasAllPermissions = useCallback(
    (perms: string[]) => perms.every((p) => hasPermission(p)),
    [hasPermission]
  )

  return { hasPermission, hasAnyPermission, hasAllPermissions }
}
```

### React Query Hooks

#### useAdmins - 管理员查询

```typescript
// src/hooks/queries/use-admins.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/client'
import type { InferResponseType, InferRequestType } from 'hono/client'

type AdminsResponse = InferResponseType<typeof client.api.admins.$get, 200>
type CreateAdminInput = InferRequestType<typeof client.api.admins.$post>['json']

export function useAdmins(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['admins', params],
    queryFn: async () => {
      const res = await client.api.admins.$get({ query: params })
      if (!res.ok) throw new Error('获取管理员列表失败')
      return res.json()
    },
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateAdminInput) => {
      const res = await client.api.admins.$post({ json: data })
      if (!res.ok) throw new Error('创建管理员失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAdminInput }) => {
      const res = await client.api.admins[':id'].$put({
        param: { id: String(id) },
        json: data,
      })
      if (!res.ok) throw new Error('更新管理员失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await client.api.admins[':id'].$delete({
        param: { id: String(id) },
      })
      if (!res.ok) throw new Error('删除管理员失败')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}
```

### 页面组件示例

#### 登录页

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">后台管理系统</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 管理员管理页

```typescript
// src/app/(dashboard)/system/admin/page.tsx
'use client'

import { useState } from 'react'
import { useAdmins, useDeleteAdmin } from '@/hooks/queries/use-admins'
import { PermissionGuard } from '@/components/permission-guard'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminFormDialog } from './admin-form-dialog'

export default function AdminPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdmins({ page, pageSize: 20 })
  const deleteAdmin = useDeleteAdmin()

  if (isLoading) return <div>加载中...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理员管理</h1>
        <PermissionGuard permission="system:admin:add">
          <AdminFormDialog mode="create">
            <Button>新增管理员</Button>
          </AdminFormDialog>
        </PermissionGuard>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>用户名</TableHead>
            <TableHead>昵称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>最后登录</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.id}</TableCell>
              <TableCell>{admin.username}</TableCell>
              <TableCell>{admin.nickname}</TableCell>
              <TableCell>
                <span className={admin.status === 1 ? 'text-green-600' : 'text-red-600'}>
                  {admin.status === 1 ? '正常' : '禁用'}
                </span>
              </TableCell>
              <TableCell>{admin.loginTime || '-'}</TableCell>
              <TableCell className="space-x-2">
                <PermissionGuard permission="system:admin:edit">
                  <AdminFormDialog mode="edit" admin={admin}>
                    <Button variant="outline" size="sm">编辑</Button>
                  </AdminFormDialog>
                </PermissionGuard>
                <PermissionGuard permission="system:admin:delete">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAdmin.mutate(admin.id)}
                  >
                    删除
                  </Button>
                </PermissionGuard>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 分页组件 */}
      <Pagination
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  )
}
```

### Hono RPC Client

```typescript
// src/lib/client.ts
import { hc } from 'hono/client'
import { env } from '@/env'
import type { AppType } from '@/server/types'

const baseUrl = typeof window === 'undefined' ? env.NEXT_PUBLIC_APP_URL : ''

export const client = hc<AppType>(baseUrl, {
  headers: () => {
    // 从 localStorage 获取 token（仅客户端）
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
          return { Authorization: `Bearer ${state.token}` }
        }
      }
    }
    return {}
  },
})
```

### 工具函数

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 图标组件

```typescript
// src/components/ui/icon.tsx
import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface IconProps extends LucideProps {
  name: string
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[
    // 将 kebab-case 转换为 PascalCase
    name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
  ]
  
  if (!IconComponent) {
    return null
  }
  
  return <IconComponent {...props} />
}
```

### 分页组件

```typescript
// src/components/ui/pagination.tsx
'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        上一页
      </Button>
      <span className="text-sm text-gray-600">
        第 {page} 页 / 共 {totalPages} 页
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        下一页
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### Providers 配置

```typescript
// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { refreshAuth, token } = useAuth()

  useEffect(() => {
    if (token) {
      refreshAuth()
    } else {
      useAuth.setState({ isLoading: false })
    }
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  )
}
```

### Next.js Middleware (页面级路由守卫)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公开路由
  const publicPaths = ['/login', '/api']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 检查 token（从 cookie 或 header 获取）
  // 注意：这里只做简单的存在性检查，实际验证在 API 层进行
  const token = request.cookies.get('auth-token')?.value
  
  // 如果没有 token 且访问受保护页面，重定向到登录页
  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 排除静态文件和 API 路由
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
```

### API Route Handler

```typescript
// src/app/api/[[...route]]/route.ts
import type { NextRequest } from 'next/server'
import app from '@/server/app'

async function handler(req: NextRequest) {
  return app.fetch(req)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
```

### Header 组件

```typescript
// src/components/layout/header.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { admin, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        {/* 面包屑或其他导航元素 */}
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{admin?.nickname || admin?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### AdminFormDialog 组件

```typescript
// src/app/(dashboard)/system/admin/admin-form-dialog.tsx
'use client'

import { useState } from 'react'
import { useCreateAdmin, useUpdateAdmin } from '@/hooks/queries/use-admins'
import { useRoles } from '@/hooks/queries/use-roles'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface AdminFormDialogProps {
  mode: 'create' | 'edit'
  admin?: AdminDto
  children: React.ReactNode
}

export function AdminFormDialog({ mode, admin, children }: AdminFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: admin?.username || '',
    password: '',
    nickname: admin?.nickname || '',
    status: admin?.status ?? 1,
    roleIds: admin?.roles?.map(r => r.id) || [],
  })

  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin()
  const { data: rolesData } = useRoles({ pageSize: 100 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'create') {
      await createAdmin.mutateAsync({
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        status: formData.status,
        roleIds: formData.roleIds,
      })
    } else if (admin) {
      await updateAdmin.mutateAsync({
        id: admin.id,
        data: {
          nickname: formData.nickname,
          status: formData.status,
        },
      })
    }
    
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新增管理员' : '编辑管理员'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>用户名</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={mode === 'edit'}
              required
            />
          </div>
          {mode === 'create' && (
            <div>
              <Label>密码</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <Label>昵称</Label>
            <Input
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>
          <div>
            <Label>角色</Label>
            <div className="mt-2 space-y-2">
              {rolesData?.items.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.roleIds.includes(role.id)}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        roleIds: checked
                          ? [...formData.roleIds, role.id]
                          : formData.roleIds.filter(id => id !== role.id),
                      })
                    }}
                  />
                  <span>{role.roleName}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Seed 脚本

```typescript
// src/db/seed.ts
import { db } from './index'
import { sysAdmin, sysRole, sysMenu, sysAdminRole, sysRoleMenu } from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database...')

  // 1. 创建超级管理员
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await db.insert(sysAdmin).values({
    id: 1,
    username: 'admin',
    password: hashedPassword,
    nickname: '超级管理员',
    status: 1,
    remark: '系统超级管理员',
  }).onDuplicateKeyUpdate({ set: { nickname: '超级管理员' } })

  // 2. 创建角色
  const roles = [
    { id: 1, roleName: '超级管理员', sort: 1, status: 1, remark: '拥有系统全部权限，不可删除' },
    { id: 2, roleName: '管理员', sort: 2, status: 1, remark: '系统管理员' },
    { id: 3, roleName: '运营', sort: 3, status: 1, remark: '运营人员' },
  ]
  for (const role of roles) {
    await db.insert(sysRole).values(role).onDuplicateKeyUpdate({ set: { roleName: role.roleName } })
  }

  // 3. 创建菜单（参考用户提供的初始化数据）
  const menus = [
    // 系统管理目录
    { id: 1, parentId: 0, menuType: 'D' as const, menuName: '系统管理', path: '/system', icon: 'setting', sort: 1 },
    // 管理员管理
    { id: 10, parentId: 1, menuType: 'M' as const, menuName: '管理员管理', permission: 'system:admin:list', path: '/system/admin', component: 'system/admin/index', icon: 'user', sort: 1 },
    { id: 11, parentId: 10, menuType: 'B' as const, menuName: '管理员查询', permission: 'system:admin:query', sort: 1 },
    { id: 12, parentId: 10, menuType: 'B' as const, menuName: '管理员新增', permission: 'system:admin:add', sort: 2 },
    { id: 13, parentId: 10, menuType: 'B' as const, menuName: '管理员修改', permission: 'system:admin:edit', sort: 3 },
    { id: 14, parentId: 10, menuType: 'B' as const, menuName: '管理员删除', permission: 'system:admin:delete', sort: 4 },
    { id: 15, parentId: 10, menuType: 'B' as const, menuName: '重置密码', permission: 'system:admin:resetPwd', sort: 5 },
    // 角色管理
    { id: 20, parentId: 1, menuType: 'M' as const, menuName: '角色管理', permission: 'system:role:list', path: '/system/role', component: 'system/role/index', icon: 'peoples', sort: 2 },
    { id: 21, parentId: 20, menuType: 'B' as const, menuName: '角色查询', permission: 'system:role:query', sort: 1 },
    { id: 22, parentId: 20, menuType: 'B' as const, menuName: '角色新增', permission: 'system:role:add', sort: 2 },
    { id: 23, parentId: 20, menuType: 'B' as const, menuName: '角色修改', permission: 'system:role:edit', sort: 3 },
    { id: 24, parentId: 20, menuType: 'B' as const, menuName: '角色删除', permission: 'system:role:delete', sort: 4 },
    // 菜单管理
    { id: 30, parentId: 1, menuType: 'M' as const, menuName: '菜单管理', permission: 'system:menu:list', path: '/system/menu', component: 'system/menu/index', icon: 'tree-table', sort: 3 },
    { id: 31, parentId: 30, menuType: 'B' as const, menuName: '菜单查询', permission: 'system:menu:query', sort: 1 },
    { id: 32, parentId: 30, menuType: 'B' as const, menuName: '菜单新增', permission: 'system:menu:add', sort: 2 },
    { id: 33, parentId: 30, menuType: 'B' as const, menuName: '菜单修改', permission: 'system:menu:edit', sort: 3 },
    { id: 34, parentId: 30, menuType: 'B' as const, menuName: '菜单删除', permission: 'system:menu:delete', sort: 4 },
    // 日志管理目录
    { id: 2, parentId: 0, menuType: 'D' as const, menuName: '日志管理', path: '/log', icon: 'log', sort: 2 },
    // 操作日志
    { id: 40, parentId: 2, menuType: 'M' as const, menuName: '操作日志', permission: 'system:log:list', path: '/system/log', component: 'log/operation/index', icon: 'form', sort: 1 },
    { id: 41, parentId: 40, menuType: 'B' as const, menuName: '日志查询', permission: 'system:log:query', sort: 1 },
    { id: 42, parentId: 40, menuType: 'B' as const, menuName: '日志删除', permission: 'system:log:delete', sort: 2 },
  ]
  for (const menu of menus) {
    await db.insert(sysMenu).values(menu).onDuplicateKeyUpdate({ set: { menuName: menu.menuName } })
  }

  // 4. 管理员角色关联
  await db.insert(sysAdminRole).values({ adminId: 1, roleId: 1 }).onDuplicateKeyUpdate({ set: { roleId: 1 } })

  // 5. 角色菜单关联（超级管理员拥有全部权限）
  const allMenuIds = menus.map(m => m.id)
  for (const menuId of allMenuIds) {
    await db.insert(sysRoleMenu).values({ roleId: 1, menuId }).onDuplicateKeyUpdate({ set: { menuId } })
  }

  console.log('✅ Seeding completed!')
}

seed().catch(console.error)
```

## Compliance with Project Standards

本设计文档符合项目规范文档的以下要求：

### ✅ 分层架构
- Presentation Layer (Next.js Pages/Components)
- API Layer (Hono OpenAPI Routes)
- Service Layer (纯业务逻辑)
- Data Access Layer (Drizzle ORM)

### ✅ 数据流规则
- RSC 直接调用 Service 层
- Client Component 通过 Hono RPC 调用 API
- API 层调用 Service 层
- Service 层使用 Drizzle ORM 访问数据库

### ✅ 路由组织
- 使用 OpenAPIHono 统一路由定义
- Feature-based 路由组织（routes/admins/index.ts, defs.ts, dtos.ts）
- 路由拼装与类型导出分离

### ✅ 中间件顺序
1. CORS（快速响应预检请求）
2. RequestId + AsyncLocalStorage
3. 请求日志
4. CSRF 防护
5. 速率限制
6. JWT 认证
7. 权限加载

### ✅ 错误处理
- 自定义错误类（AppError 及子类）
- 统一错误响应结构
- Service 层抛出业务错误，API 层映射为 HTTP 状态码

### ✅ 环境变量
- 使用 @t3-oss/env-nextjs 进行类型安全的环境变量校验
- 区分 server/client 变量

### ✅ 数据库
- 使用 Drizzle ORM
- 全局单例模式防止 HMR 重复创建连接
- 时间字段 DTO 序列化为 ISO 8601 字符串

### ⚠️ 技术栈调整
- 数据库从 PostgreSQL 调整为 MySQL（用户现有设计）
- 认证从 Auth.js 调整为自定义 JWT（独立管理员体系）
```
