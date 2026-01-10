/**
 * OpenAPI 响应预设工具
 * @description 消除 responses 定义中的重复代码
 */

import type { RouteConfig, z } from '@hono/zod-openapi'
import { createDataResponseSchema, ErrorSchema, SuccessSchema } from './dtos'

/**
 * 响应配置类型
 */
type ResponseConfig = NonNullable<RouteConfig['responses']>[number]

/**
 * 常用错误响应预设
 */
export const commonErrorResponses = {
  /** 401 - 未授权 */
  401: {
    description: '未登录或登录已过期',
    content: {
      'application/json': {
        schema: ErrorSchema,
      },
    },
  } as ResponseConfig,

  /** 403 - 禁止访问 */
  403: {
    description: '无权限访问',
    content: {
      'application/json': {
        schema: ErrorSchema,
      },
    },
  } as ResponseConfig,

  /** 404 - 资源不存在 */
  404: {
    description: '资源不存在',
    content: {
      'application/json': {
        schema: ErrorSchema,
      },
    },
  } as ResponseConfig,

  /** 409 - 资源冲突 */
  409: {
    description: '资源冲突（如唯一性约束）',
    content: {
      'application/json': {
        schema: ErrorSchema,
      },
    },
  } as ResponseConfig,

  /** 500 - 服务器错误 */
  500: {
    description: '服务器内部错误',
    content: {
      'application/json': {
        schema: ErrorSchema,
      },
    },
  } as ResponseConfig,
}

/**
 * 创建成功响应（带数据）
 */
export function createSuccessResponse<T extends z.ZodTypeAny>(
  dataSchema: T,
  name: string,
  description = '请求成功'
): ResponseConfig {
  return {
    description,
    content: {
      'application/json': {
        schema: createDataResponseSchema(dataSchema, name),
      },
    },
  }
}

/**
 * 创建成功响应（无数据）
 */
export function createEmptySuccessResponse(description = '操作成功'): ResponseConfig {
  return {
    description,
    content: {
      'application/json': {
        schema: SuccessSchema,
      },
    },
  }
}

/**
 * 响应集合构建器
 */
export class ResponsesBuilder {
  private responses: Record<string, ResponseConfig> = {}

  /**
   * 添加成功响应（200）
   */
  success<T extends z.ZodTypeAny>(dataSchema: T, name: string, description = '请求成功'): this {
    this.responses['200'] = createSuccessResponse(dataSchema, name, description)
    return this
  }

  /**
   * 添加创建成功响应（201）
   */
  created<T extends z.ZodTypeAny>(dataSchema: T, name: string, description = '创建成功'): this {
    this.responses['201'] = createSuccessResponse(dataSchema, name, description)
    return this
  }

  /**
   * 添加无数据成功响应（200）
   */
  emptySuccess(description = '操作成功'): this {
    this.responses['200'] = createEmptySuccessResponse(description)
    return this
  }

  /**
   * 添加未授权响应（401）
   */
  unauthorized(description?: string): this {
    this.responses['401'] = description
      ? { ...commonErrorResponses[401], description }
      : commonErrorResponses[401]
    return this
  }

  /**
   * 添加禁止访问响应（403）
   */
  forbidden(description?: string): this {
    this.responses['403'] = description
      ? { ...commonErrorResponses[403], description }
      : commonErrorResponses[403]
    return this
  }

  /**
   * 添加资源不存在响应（404）
   */
  notFound(description?: string): this {
    this.responses['404'] = description
      ? { ...commonErrorResponses[404], description }
      : commonErrorResponses[404]
    return this
  }

  /**
   * 添加资源冲突响应（409）
   */
  conflict(description?: string): this {
    this.responses['409'] = description
      ? { ...commonErrorResponses[409], description }
      : commonErrorResponses[409]
    return this
  }

  /**
   * 添加自定义错误响应
   */
  error(code: number, description: string): this {
    this.responses[String(code)] = {
      description,
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    }
    return this
  }

  /**
   * 批量添加常见认证错误（401, 403）
   */
  withAuth(): this {
    return this.unauthorized().forbidden()
  }

  /**
   * 批量添加常见 CRUD 错误（401, 403, 404）
   */
  withCRUD(): this {
    return this.unauthorized().forbidden().notFound()
  }

  /**
   * 构建最终的 responses 对象
   */
  build(): Record<string, ResponseConfig> {
    return this.responses
  }
}

/**
 * 创建响应构建器
 */
export function responses(): ResponsesBuilder {
  return new ResponsesBuilder()
}
