import { createRoute } from '@hono/zod-openapi'
import { createDataResponseSchema, ErrorSchema, IdParamSchema, SuccessSchema } from '../common/dtos'
import {
  ConfigQuerySchema,
  ConfigSchema,
  CreateConfigInputSchema,
  PaginatedConfigSchema,
  UpdateConfigInputSchema,
  UpdateConfigValueInputSchema,
} from './dtos'

export const listConfigsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['系统配置'],
  summary: '配置列表',
  description: '分页获取系统配置列表',
  security: [{ bearerAuth: [] }],
  request: {
    query: ConfigQuerySchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(PaginatedConfigSchema, 'PaginatedConfigResponse'),
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

export const getConfigRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['系统配置'],
  summary: '配置详情',
  description: '根据 ID 获取配置详情',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '获取成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(ConfigSchema, 'ConfigResponse'),
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '配置不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

export const createConfigRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['系统配置'],
  summary: '创建配置',
  description: '创建新的系统配置',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateConfigInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: '创建成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(ConfigSchema, 'CreateConfigResponse'),
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: '配置键重复',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

export const updateConfigRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['系统配置'],
  summary: '更新配置',
  description: '更新配置的元信息与值',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateConfigInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(ConfigSchema, 'UpdateConfigResponse'),
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '配置不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: '配置键冲突',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

export const updateConfigValueRoute = createRoute({
  method: 'patch',
  path: '/key/{id}',
  tags: ['系统配置'],
  summary: '更新配置值',
  description: '仅更新配置值与类型，方便在超级面板中编辑',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateConfigValueInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: {
        'application/json': {
          schema: createDataResponseSchema(ConfigSchema, 'UpdateConfigValueResponse'),
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '配置不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

export const deleteConfigRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['系统配置'],
  summary: '删除配置',
  description: '删除指定的配置项（系统配置不可删除）',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: '删除成功',
      content: {
        'application/json': {
          schema: SuccessSchema,
        },
      },
    },
    401: {
      description: '未登录或登录已过期',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: '无权限访问',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: '配置不存在',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

