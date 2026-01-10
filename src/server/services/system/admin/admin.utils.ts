/**
 * 管理员 - 工具函数
 */

import type { sysAdmin } from '@/db/schema'
import { toISOString } from '../../shared'
import type { AdminVo } from './models'

/** 转换为管理员 VO */
export function toAdminVo(admin: typeof sysAdmin.$inferSelect): AdminVo {
  return {
    id: admin.id,
    username: admin.username,
    nickname: admin.nickname,
    status: admin.status,
    loginIp: admin.loginIp,
    loginTime: toISOString(admin.loginTime),
    remark: admin.remark,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }
}
