/**
 * Service 层共享类型定义
 * @description 提取公共类型，避免循环依赖
 */

// ========== 通用分页类型 ==========

export interface PaginationOptions {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== 管理员相关类型 ==========

export interface AdminDto {
  id: number
  username: string
  nickname: string
  status: number
  loginIp: string | null
  loginTime: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
  roles?: { id: number; roleName: string }[]
}

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

// ========== 角色相关类型 ==========

export interface RoleDto {
  id: number
  roleName: string
  sort: number
  status: number
  remark: string | null
  createdAt: string
  updatedAt: string
  menuIds?: number[]
}

export interface CreateRoleInput {
  roleName: string
  sort?: number
  status?: number
  remark?: string
  menuIds?: number[]
}

export interface UpdateRoleInput {
  roleName?: string
  sort?: number
  status?: number
  remark?: string
}

// ========== 菜单相关类型 ==========

export interface MenuDto {
  id: number
  parentId: number
  menuType: 'D' | 'M' | 'B'
  menuName: string
  permission: string | null
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  visible: number
  status: number
  isExternal: number
  isCache: number
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface MenuTreeNode extends MenuDto {
  children?: MenuTreeNode[]
}

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

export interface UpdateMenuInput {
  parentId?: number
  menuType?: 'D' | 'M' | 'B'
  menuName?: string
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

export interface MenuQueryOptions {
  menuType?: 'D' | 'M' | 'B'
  status?: number
}

// ========== 认证相关类型 ==========

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

// ========== 审计日志相关类型 ==========

export interface OperationLogDto {
  id: number
  adminId: number | null
  adminName: string | null
  module: string | null
  operation: string | null
  description: string | null
  method: string | null
  requestMethod: string | null
  requestUrl: string | null
  requestParams: string | null
  responseResult: string | null
  ip: string | null
  ipLocation: string | null
  userAgent: string | null
  executionTime: number | null
  status: number
  errorMsg: string | null
  createdAt: string
}

export interface CreateOperationLogInput {
  adminId: number | null
  adminName: string | null
  module: string | null
  operation: string | null
  description: string | null
  method: string | null
  requestMethod: string | null
  requestUrl: string | null
  requestParams: string | null
  responseResult?: string | null
  ip: string | null
  ipLocation?: string | null
  userAgent: string | null
  executionTime: number | null
  status: number
  errorMsg: string | null
}

export interface OperationLogQueryOptions {
  page?: number
  pageSize?: number
  adminId?: number
  adminName?: string
  module?: string
  operation?: string
  status?: number
  startTime?: string
  endTime?: string
}
