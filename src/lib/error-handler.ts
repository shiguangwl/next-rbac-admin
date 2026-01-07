/**
 * 错误处理映射
 * @description 将 Service 层错误映射到 HTTP 状态码
 * @requirements 7.3, 7.4
 */

import { env } from '@/env'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors'

export interface ErrorResponse {
  status: number
  code: string
  message: string
  details?: unknown
}

/**
 * 将错误映射为 HTTP 响应
 */
export function mapErrorToResponse(err: unknown): ErrorResponse {
  const shouldExposeDetails = env.NODE_ENV !== 'production'

  // 未授权错误 -> 401
  if (err instanceof UnauthorizedError) {
    return {
      status: 401,
      code: err.code,
      message: err.message,
    }
  }

  // 禁止访问错误 -> 403
  if (err instanceof ForbiddenError) {
    return {
      status: 403,
      code: err.code,
      message: err.message,
    }
  }

  // 资源未找到错误 -> 404
  if (err instanceof NotFoundError) {
    return {
      status: 404,
      code: err.code,
      message: err.message,
    }
  }

  // 资源冲突错误 -> 409
  if (err instanceof ConflictError) {
    return {
      status: 409,
      code: err.code,
      message: err.message,
    }
  }

  // 验证错误 -> 400
  if (err instanceof ValidationError) {
    return {
      status: 400,
      code: err.code,
      message: err.message,
      details: shouldExposeDetails ? err.details : undefined,
    }
  }

  // 其他应用错误 -> 400
  if (err instanceof AppError) {
    return {
      status: 400,
      code: err.code,
      message: err.message,
      details: shouldExposeDetails ? err.details : undefined,
    }
  }

  // 未知错误 -> 500
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err instanceof Error
        ? err.message
        : 'Internal Server Error'
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message,
  }
}
