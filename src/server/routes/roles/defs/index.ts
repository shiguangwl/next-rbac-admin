/**
 * 角色路由定义统一导出
 * @description 从子模块导出所有路由定义
 * @requirements 10.7, 10.8
 */

export { listRolesRoute, getAllRolesRoute } from './list'
export { createRoleRoute } from './create'
export { getRoleRoute, updateRoleRoute, deleteRoleRoute } from './detail'
export { updateRoleMenusRoute } from './actions'
