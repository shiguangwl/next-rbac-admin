/**
 * 中间件统一导出
 */

// JWT 认证
export { jwtAuth, requireAuth } from './jwt-auth'

// RBAC 权限
export {
  createLoadPermissions,
  loadPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  invalidatePermissionCache,
  invalidateAllPermissionCache,
} from './rbac'

// 操作日志
export {
  auditLog,
  createAuditLog,
  setLogRecorder,
  type AuditOptions,
  type OperationLogData,
  type LogRecorder,
} from './audit-log'

// CORS
export { corsMiddleware } from './cors'

// CSRF
export { csrfMiddleware, generateCsrfToken } from './csrf'

// 速率限制
export {
  rateLimit,
  apiRateLimit,
  loginRateLimit,
  strictRateLimit,
  type RateLimitOptions,
} from './rate-limit'
