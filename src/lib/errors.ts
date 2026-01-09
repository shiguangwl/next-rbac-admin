/**
 * 自定义错误类
 * @description 定义系统中使用的各类错误类型
 */

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    // 确保原型链正确
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND')
  }
}

/**
 * 资源冲突错误 (409)
 * @description 用于唯一性约束冲突等场景
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT')
  }
}

/**
 * 禁止访问错误 (403)
 * @description 用于权限不足的场景
 */
export class ForbiddenError extends AppError {
  constructor(message = '无权限访问') {
    super(message, 'FORBIDDEN')
  }
}

/**
 * 未授权错误 (401)
 * @description 用于未登录或 Token 无效的场景
 */
export class UnauthorizedError extends AppError {
  constructor(message = '未登录或登录已过期') {
    super(message, 'UNAUTHORIZED')
  }
}

/**
 * 验证错误 (400)
 * @description 用于请求参数验证失败的场景
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
  }
}

/**
 * 业务错误 (400)
 * @description 用于业务逻辑错误的场景
 */
export class BusinessError extends AppError {
  constructor(message: string, code = 'BUSINESS_ERROR') {
    super(message, code)
  }
}
