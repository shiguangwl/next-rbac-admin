/**
 * 通用工具函数
 */

/** 日期转 ISO 字符串 */
export function toISOString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}
