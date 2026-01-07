/**
 * 日志工具
 * @description 提供结构化日志输出，支持 requestId 上下文
 */

import { env } from '@/env'
import { getRequestContext } from './request-context'

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** 日志元数据 */
export interface LogMeta {
  requestId?: string
  [key: string]: unknown
}

/** 日志条目 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId?: string
  meta?: Record<string, unknown>
}

/**
 * 格式化日志条目为 JSON 字符串
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry)
}

/**
 * 获取当前请求 ID
 */
function getCurrentRequestId(): string | undefined {
  try {
    return getRequestContext()?.requestId
  } catch {
    return undefined
  }
}

/**
 * 创建日志条目
 */
function createLogEntry(level: LogLevel, message: string, meta?: LogMeta): LogEntry {
  const { requestId: metaRequestId, ...restMeta } = meta ?? {}
  const requestId = metaRequestId ?? getCurrentRequestId()

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId && { requestId }),
    ...(Object.keys(restMeta).length > 0 && { meta: restMeta }),
  }
}

/**
 * 日志记录器
 */
export const logger = {
  /**
   * 调试日志
   */
  debug(message: string, meta?: LogMeta): void {
    if (env.NODE_ENV === 'production') return
    const entry = createLogEntry('debug', message, meta)
    console.debug(formatLog(entry))
  },

  /**
   * 信息日志
   */
  info(message: string, meta?: LogMeta): void {
    const entry = createLogEntry('info', message, meta)
    console.info(formatLog(entry))
  },

  /**
   * 警告日志
   */
  warn(message: string, meta?: LogMeta): void {
    const entry = createLogEntry('warn', message, meta)
    console.warn(formatLog(entry))
  },

  /**
   * 错误日志
   */
  error(message: string, meta?: LogMeta): void {
    const entry = createLogEntry('error', message, meta)
    console.error(formatLog(entry))
  },
}
