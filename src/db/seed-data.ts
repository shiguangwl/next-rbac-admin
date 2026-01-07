/**
 * 数据库初始化数据定义
 * @description 定义初始化所需的角色、菜单、关联数据
 * @requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

/**
 * 基础角色数据
 */
export const ROLES = [
  { id: 1, roleName: '超级管理员', sort: 0, status: 1, remark: '拥有系统所有权限' },
  { id: 2, roleName: '管理员', sort: 1, status: 1, remark: '拥有大部分管理权限' },
  { id: 3, roleName: '运营', sort: 2, status: 1, remark: '拥有运营相关权限' },
] as const

/**
 * 系统菜单数据
 * menuType: D-目录 M-菜单 B-按钮
 */
export const MENUS = [
  // 系统管理目录
  {
    id: 1,
    parentId: 0,
    menuType: 'D' as const,
    menuName: '系统管理',
    permission: null,
    path: '/system',
    component: null,
    icon: 'Settings',
    sort: 0,
    visible: 1,
    status: 1,
  },
  // 管理员管理
  {
    id: 2,
    parentId: 1,
    menuType: 'M' as const,
    menuName: '管理员管理',
    permission: 'system:admin:list',
    path: '/system/admin',
    component: 'system/admin/page',
    icon: 'Users',
    sort: 0,
    visible: 1,
    status: 1,
  },
  {
    id: 3,
    parentId: 2,
    menuType: 'B' as const,
    menuName: '新增管理员',
    permission: 'system:admin:create',
    path: null,
    component: null,
    icon: null,
    sort: 0,
    visible: 1,
    status: 1,
  },
  {
    id: 4,
    parentId: 2,
    menuType: 'B' as const,
    menuName: '编辑管理员',
    permission: 'system:admin:update',
    path: null,
    component: null,
    icon: null,
    sort: 1,
    visible: 1,
    status: 1,
  },
  {
    id: 5,
    parentId: 2,
    menuType: 'B' as const,
    menuName: '删除管理员',
    permission: 'system:admin:delete',
    path: null,
    component: null,
    icon: null,
    sort: 2,
    visible: 1,
    status: 1,
  },
  {
    id: 6,
    parentId: 2,
    menuType: 'B' as const,
    menuName: '重置密码',
    permission: 'system:admin:reset-password',
    path: null,
    component: null,
    icon: null,
    sort: 3,
    visible: 1,
    status: 1,
  },
  {
    id: 7,
    parentId: 2,
    menuType: 'B' as const,
    menuName: '分配角色',
    permission: 'system:admin:assign-role',
    path: null,
    component: null,
    icon: null,
    sort: 4,
    visible: 1,
    status: 1,
  },
  // 角色管理
  {
    id: 8,
    parentId: 1,
    menuType: 'M' as const,
    menuName: '角色管理',
    permission: 'system:role:list',
    path: '/system/role',
    component: 'system/role/page',
    icon: 'Shield',
    sort: 1,
    visible: 1,
    status: 1,
  },
  {
    id: 9,
    parentId: 8,
    menuType: 'B' as const,
    menuName: '新增角色',
    permission: 'system:role:create',
    path: null,
    component: null,
    icon: null,
    sort: 0,
    visible: 1,
    status: 1,
  },
  {
    id: 10,
    parentId: 8,
    menuType: 'B' as const,
    menuName: '编辑角色',
    permission: 'system:role:update',
    path: null,
    component: null,
    icon: null,
    sort: 1,
    visible: 1,
    status: 1,
  },
  {
    id: 11,
    parentId: 8,
    menuType: 'B' as const,
    menuName: '删除角色',
    permission: 'system:role:delete',
    path: null,
    component: null,
    icon: null,
    sort: 2,
    visible: 1,
    status: 1,
  },
  {
    id: 12,
    parentId: 8,
    menuType: 'B' as const,
    menuName: '分配菜单',
    permission: 'system:role:assign-menu',
    path: null,
    component: null,
    icon: null,
    sort: 3,
    visible: 1,
    status: 1,
  },
  // 菜单管理
  {
    id: 13,
    parentId: 1,
    menuType: 'M' as const,
    menuName: '菜单管理',
    permission: 'system:menu:list',
    path: '/system/menu',
    component: 'system/menu/page',
    icon: 'Menu',
    sort: 2,
    visible: 1,
    status: 1,
  },
  {
    id: 14,
    parentId: 13,
    menuType: 'B' as const,
    menuName: '新增菜单',
    permission: 'system:menu:create',
    path: null,
    component: null,
    icon: null,
    sort: 0,
    visible: 1,
    status: 1,
  },
  {
    id: 15,
    parentId: 13,
    menuType: 'B' as const,
    menuName: '编辑菜单',
    permission: 'system:menu:update',
    path: null,
    component: null,
    icon: null,
    sort: 1,
    visible: 1,
    status: 1,
  },
  {
    id: 16,
    parentId: 13,
    menuType: 'B' as const,
    menuName: '删除菜单',
    permission: 'system:menu:delete',
    path: null,
    component: null,
    icon: null,
    sort: 2,
    visible: 1,
    status: 1,
  },
  // 操作日志
  {
    id: 17,
    parentId: 1,
    menuType: 'M' as const,
    menuName: '操作日志',
    permission: 'system:log:list',
    path: '/system/log',
    component: 'system/log/page',
    icon: 'FileText',
    sort: 3,
    visible: 1,
    status: 1,
  },
  {
    id: 18,
    parentId: 17,
    menuType: 'B' as const,
    menuName: '删除日志',
    permission: 'system:log:delete',
    path: null,
    component: null,
    icon: null,
    sort: 0,
    visible: 1,
    status: 1,
  },
]

/**
 * 角色菜单关联（超级管理员拥有所有菜单）
 */
export const ROLE_MENUS = MENUS.map((menu) => ({
  roleId: 1, // 超级管理员
  menuId: menu.id,
}))

/**
 * 管理员角色关联
 */
export const ADMIN_ROLES = [
  { adminId: 1, roleId: 1 }, // admin -> 超级管理员
]
