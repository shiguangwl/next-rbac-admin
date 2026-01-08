/**
 * 日志工具
 * @description 基于 Pino 的结构化日志，支持 requestId 上下文
 */

import pino from 'pino'
import { env } from '@/env'
import { getRequestContext } from './request-context'

/**
 * 创建 Pino logger 实例
 * 注意：pino-pretty 使用 worker thread，在 Next.js instrumentation 阶段不可用
 * 因此开发环境也使用同步模式，通过 pino-pretty CLI 管道处理美化输出
 */
function createLogger() {
  const isDev = env.NODE_ENV !== 'production'

  return pino({
    level: isDev ? 'debug' : 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
}

/** 根 logger 实例 */
const rootLogger = createLogger()

/** 日志元数据类型 */
export type LogMeta = Record<string, unknown>

/**
 * 获取带请求上下文的 logger
 * 自动注入 requestId（如果在请求上下文中）
 */
function getContextualLogger(): pino.Logger {
  try {
    const ctx = getRequestContext()
    if (ctx?.requestId) {
      return rootLogger.child({ requestId: ctx.requestId })
    }
  } catch {
    // 不在请求上下文中，使用根 logger
  }
  return rootLogger
}

/**
 * 日志记录器
 * 自动注入请求上下文中的 requestId
 */
export const logger = {
  /**
   * 调试日志（仅开发环境）
   */
  debug(msg: string, meta?: LogMeta): void {
    getContextualLogger().debug(meta ?? {}, msg)
  },

  /**
   * 信息日志
   */
  info(msg: string, meta?: LogMeta): void {
    getContextualLogger().info(meta ?? {}, msg)
  },

  /**
   * 警告日志
   */
  warn(msg: string, meta?: LogMeta): void {
    getContextualLogger().warn(meta ?? {}, msg)
  },

  /**
   * 错误日志
   */
  error(msg: string, meta?: LogMeta & { err?: Error }): void {
    const log = getContextualLogger()
    if (meta?.err) {
      // Pino 会自动序列化 Error 对象（包含 stack）
      log.error({ ...meta, err: meta.err }, msg)
    } else {
      log.error(meta ?? {}, msg)
    }
  },

  /**
   * 创建子 logger（用于模块级日志）
   */
  child(bindings: LogMeta): pino.Logger {
    return rootLogger.child(bindings)
  },
}

/** 导出根 logger 供特殊场景使用 */
export { rootLogger }
