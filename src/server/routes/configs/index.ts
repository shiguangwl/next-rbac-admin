import { OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '@/server/context'
import { auditLog } from '@/server/middleware/audit-log'
import { requireAuth } from '@/server/middleware/jwt-auth'
import { requirePermission } from '@/server/middleware/rbac'
import {
  clearConfigCache,
  createConfig,
  deleteConfig,
  getConfigById,
  listConfigs,
  preloadAllActiveConfigs,
  updateConfig,
} from '@/server/services/config.service'
import {
  createConfigRoute,
  deleteConfigRoute,
  getConfigRoute,
  listConfigsRoute,
  updateConfigRoute,
} from './defs'

const configs = new OpenAPIHono<Env>()

configs.use('/*', requireAuth)

configs.use('/', requirePermission('system:config:list'))
configs.openapi(listConfigsRoute, async (c) => {
  const query = c.req.valid('query')

  const result = await listConfigs({
    page: query.page,
    pageSize: query.pageSize,
    group: query.group,
    status: query.status,
  })

  return c.json(
    {
      code: 'OK',
      data: result,
    },
    200
  )
})

configs.use('/:id', requirePermission('system:config:query'))
configs.openapi(getConfigRoute, async (c) => {
  const { id } = c.req.valid('param')

  const config = await getConfigById(id)

  return c.json(
    {
      code: 'OK',
      data: config,
    },
    200
  )
})

configs.use(
  createConfigRoute.path,
  requirePermission('system:config:create'),
  auditLog({
    module: '系统配置',
    operation: '创建配置',
    description: '创建系统配置项',
  })
)
configs.openapi(createConfigRoute, async (c) => {
  const body = c.req.valid('json')

  const config = await createConfig({
    configKey: body.configKey,
    configValue: body.configValue ?? null,
    configType: body.configType,
    configGroup: body.configGroup,
    configName: body.configName,
    remark: body.remark ?? null,
    isSystem: body.isSystem,
    status: body.status,
  })

  await preloadAllActiveConfigs()

  return c.json(
    {
      code: 'OK',
      data: config,
    },
    201
  )
})

configs.use(
  updateConfigRoute.path,
  requirePermission('system:config:update'),
  auditLog({
    module: '系统配置',
    operation: '更新配置',
    description: '更新系统配置项',
  })
)
configs.openapi(updateConfigRoute, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const config = await updateConfig(id, {
    configKey: body.configKey,
    configValue: body.configValue,
    configType: body.configType,
    configGroup: body.configGroup,
    configName: body.configName,
    remark: body.remark,
    isSystem: body.isSystem,
    status: body.status,
  })

  await preloadAllActiveConfigs()

  return c.json(
    {
      code: 'OK',
      data: config,
    },
    200
  )
})

configs.use(
  deleteConfigRoute.path,
  requirePermission('system:config:delete'),
  auditLog({
    module: '系统配置',
    operation: '删除配置',
    description: '删除系统配置项',
  })
)
configs.openapi(deleteConfigRoute, async (c) => {
  const { id } = c.req.valid('param')

  await deleteConfig(id)
  await preloadAllActiveConfigs()

  return c.json(
    {
      code: 'OK',
      message: '删除成功',
      data: null,
    },
    200
  )
})

export { configs }
