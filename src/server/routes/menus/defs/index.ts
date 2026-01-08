/**
 * 菜单路由定义统一导出
 * @description 从子模块导出所有路由定义
 * @requirements 10.9, 10.10
 */

export { createMenuRoute } from './create'
export { deleteMenuRoute, getMenuRoute, updateMenuRoute } from './detail'
export { getMenuTreeRoute, listMenusRoute } from './list'
