/**
 * Service 层共享工具函数
 * @description 提取公共辅助函数
 */

import type { sysAdmin, sysMenu, sysOperationLog, sysRole } from '@/db/schema'
import type { AdminDto, MenuDto, MenuTreeNode, OperationLogDto, RoleDto } from './types'

// ========== 日期转换 ==========

/**
 * 将日期转换为 ISO 字符串
 */
export function toISOString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

// ========== DTO 转换函数 ==========

/**
 * 将管理员记录转换为 DTO
 */
export function toAdminDto(admin: typeof sysAdmin.$inferSelect): AdminDto {
  return {
    id: admin.id,
    username: admin.username,
    nickname: admin.nickname,
    status: admin.status,
    loginIp: admin.loginIp,
    loginTime: toISOString(admin.loginTime),
    remark: admin.remark,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }
}

/**
 * 将角色记录转换为 DTO
 */
export function toRoleDto(role: typeof sysRole.$inferSelect): RoleDto {
  return {
    id: role.id,
    roleName: role.roleName,
    sort: role.sort,
    status: role.status,
    remark: role.remark,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }
}

/**
 * 将菜单记录转换为 DTO
 */
export function toMenuDto(menu: typeof sysMenu.$inferSelect): MenuDto {
  return {
    id: menu.id,
    parentId: menu.parentId,
    menuType: menu.menuType,
    menuName: menu.menuName,
    permission: menu.permission,
    path: menu.path,
    component: menu.component,
    icon: menu.icon,
    sort: menu.sort,
    visible: menu.visible,
    status: menu.status,
    isExternal: menu.isExternal,
    isCache: menu.isCache,
    remark: menu.remark,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  }
}

/**
 * 将菜单记录转换为树节点
 */
export function toMenuTreeNode(menu: typeof sysMenu.$inferSelect): MenuTreeNode {
  return {
    ...toMenuDto(menu),
  }
}

/**
 * 将操作日志记录转换为 DTO
 */
export function toOperationLogDto(log: typeof sysOperationLog.$inferSelect): OperationLogDto {
  return {
    id: log.id,
    adminId: log.adminId,
    adminName: log.adminName,
    module: log.module,
    operation: log.operation,
    description: log.description,
    method: log.method,
    requestMethod: log.requestMethod,
    requestUrl: log.requestUrl,
    requestParams: log.requestParams,
    responseResult: log.responseResult,
    ip: log.ip,
    ipLocation: log.ipLocation,
    userAgent: log.userAgent,
    executionTime: log.executionTime,
    status: log.status,
    errorMsg: log.errorMsg,
    createdAt: log.createdAt.toISOString(),
  }
}

// ========== 树形结构构建 ==========

/**
 * 从扁平列表构建菜单树
 */
export function buildMenuTree(menus: MenuTreeNode[]): MenuTreeNode[] {
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

  // 递归排序
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
