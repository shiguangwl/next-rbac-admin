/**
 * API Key 认证辅助函数
 * @description 用于验证外部推送请求的密钥
 */

import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from '@/lib/logger'
import { getConfigByKey } from '@/server/services/config.service'

/**
 * 验证 API Key
 * @description 验证请求头中的 X-API-Key 是否与系统配置的密钥匹配
 * @throws {HTTPException} 403 - API Key 缺失或无效
 * @throws {HTTPException} 500 - 密钥配置错误或验证失败
 */
export async function verifyApiKey(c: Context): Promise<void> {
  const apiKey = c.req.header('X-API-Key')

  if (!apiKey) {
    logger.warn('API Key missing', {
      path: c.req.path,
      method: c.req.method,
    })
    throw new HTTPException(403, { message: '缺少 API Key' })
  }

  try {
    // 从系统配置中获取推送密钥
    const config = await getConfigByKey('stock.push_api_key')

    logger.info('API Key validation', {
      configFound: !!config,
      configStatus: config?.status,
      configValue: config?.configValue ? `${config.configValue.substring(0, 4)}...` : 'null',
      providedKey: `${apiKey.substring(0, 4)}...`,
    })

    if (!config || config.status !== 1) {
      logger.error('Stock push API key not configured or disabled')
      throw new HTTPException(500, { message: '推送密钥未配置或已禁用' })
    }

    const validApiKey = config.configValue

    if (apiKey !== validApiKey) {
      logger.warn('Invalid API Key', {
        path: c.req.path,
        method: c.req.method,
        providedKey: `${apiKey.substring(0, 8)}...`,
        expectedKey: `${validApiKey?.substring(0, 8)}...`,
      })
      throw new HTTPException(403, { message: 'API Key 无效' })
    }

    // 验证通过
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err
    }
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('API Key validation error', { err: error })
    throw new HTTPException(500, { message: '密钥验证失败' })
  }
}
