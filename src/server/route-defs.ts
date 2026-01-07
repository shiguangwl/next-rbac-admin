/**
 * 路由拼装
 * @description 拼装所有路由模块，导出 AppType 类型
 * @requirements 10.12
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from './context'
import { admins } from './routes/admins'
import { auth } from './routes/auth'
import { menus } from './routes/menus'
import { operationLogs } from './routes/operation-logs'
import { roles } from './routes/roles'

/**
 * 创建路由实例
 */
const routes = new OpenAPIHono<Env>()

/**
 * 挂载路由模块
 */
routes.route('/auth', auth)
routes.route('/admins', admins)
routes.route('/roles', roles)
routes.route('/menus', menus)
routes.route('/operation-logs', operationLogs)

/**
 * 导出路由实例
 */
export { routes }

/**
 * 导出 AppType 类型（用于 Hono RPC Client）
 */
export type AppType = typeof routes
