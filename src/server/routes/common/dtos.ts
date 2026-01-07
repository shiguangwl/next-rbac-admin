/**
 * 通用 DTO 定义
 * @description 定义 API 响应的通用结构和分页 Schema
 * @requirements 10.12
 */

import { z } from '@hono/zod-openapi'

// ========== 错误响应 ==========

/**
 * 错误响应 Schema
 */
export const ErrorSchema = z
  .object({
    code: z.string().openapi({ description: '错误代码', example: 'NOT_FOUND' }),
    message: z.string().openapi({ description: '错误消息', example: '资源不存在' }),
    details: z.any().optional().openapi({ description: '错误详情' }),
  })
  .openapi('Error')

// ========== 分页相关 ==========

/**
 * 分页查询参数 Schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ description: '页码', example: 1 }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({ description: '每页数量', example: 20 }),
})

/**
 * 分页元数据 Schema
 */
export const PaginationMetaSchema = z.object({
  total: z.number().openapi({ description: '总记录数', example: 100 }),
  page: z.number().openapi({ description: '当前页码', example: 1 }),
  pageSize: z.number().openapi({ description: '每页数量', example: 20 }),
  totalPages: z.number().openapi({ description: '总页数', example: 5 }),
})

/**
 * 创建分页响应 Schema 工厂函数
 * @param itemSchema - 列表项 Schema
 * @param name - OpenAPI 名称
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T, name: string) {
  return z
    .object({
      items: z.array(itemSchema).openapi({ description: '数据列表' }),
      total: z.number().openapi({ description: '总记录数', example: 100 }),
      page: z.number().openapi({ description: '当前页码', example: 1 }),
      pageSize: z.number().openapi({ description: '每页数量', example: 20 }),
      totalPages: z.number().openapi({ description: '总页数', example: 5 }),
    })
    .openapi(name)
}

// ========== 通用响应 ==========

/**
 * 成功响应 Schema（无数据）
 */
export const SuccessSchema = z
  .object({
    success: z.literal(true).openapi({ description: '操作是否成功' }),
    message: z.string().optional().openapi({ description: '成功消息' }),
  })
  .openapi('Success')

/**
 * ID 参数 Schema
 */
export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({ description: '资源 ID', example: 1 }),
})

// ========== 类型导出 ==========

export type ErrorResponse = z.infer<typeof ErrorSchema>
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>
export type SuccessResponse = z.infer<typeof SuccessSchema>
export type IdParam = z.infer<typeof IdParamSchema>
