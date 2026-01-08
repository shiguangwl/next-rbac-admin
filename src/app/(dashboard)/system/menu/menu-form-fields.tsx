'use client'

/**
 * 菜单表单字段组件
 * @description 菜单表单的各个字段组件
 * @requirements 5.2, 5.4
 */

import { useState } from 'react'
import { DynamicIcon } from '@/components/dynamic-icon'
import { IconPicker } from '@/components/icon-picker'

export type MenuFormData = {
  parentId: number
  menuType: 'D' | 'M' | 'B'
  menuName: string
  permission: string
  path: string
  component: string
  icon: string
  sort: number
  visible: number
  status: number
  isExternal: number
  isCache: number
  remark: string
}

interface FormFieldProps {
  formData: MenuFormData
  onChange: (data: MenuFormData) => void
  parentMenuName: string
}

export function MenuFormFields({ formData, onChange, parentMenuName }: FormFieldProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* 上级菜单 */}
      <div className="sm:col-span-2">
        <label htmlFor="parentMenuName" className="mb-1 block text-sm font-medium text-gray-700">
          上级菜单
        </label>
        <input
          id="parentMenuName"
          type="text"
          value={parentMenuName}
          disabled
          className="w-full rounded-lg border bg-gray-100 px-4 py-2"
        />
      </div>

      {/* 菜单类型 */}
      <div>
        <label htmlFor="menuType" className="mb-1 block text-sm font-medium text-gray-700">
          菜单类型 <span className="text-red-500">*</span>
        </label>
        <select
          id="menuType"
          value={formData.menuType}
          onChange={(e) =>
            onChange({
              ...formData,
              menuType: e.target.value as 'D' | 'M' | 'B',
            })
          }
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="D">目录</option>
          <option value="M">菜单</option>
          <option value="B">按钮</option>
        </select>
      </div>

      {/* 菜单名称 */}
      <div>
        <label htmlFor="menuName" className="mb-1 block text-sm font-medium text-gray-700">
          菜单名称 <span className="text-red-500">*</span>
        </label>
        <input
          id="menuName"
          type="text"
          value={formData.menuName}
          onChange={(e) => onChange({ ...formData, menuName: e.target.value })}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="请输入菜单名称"
        />
      </div>

      {/* 权限标识 */}
      <div>
        <label htmlFor="permission" className="mb-1 block text-sm font-medium text-gray-700">
          权限标识
        </label>
        <input
          id="permission"
          type="text"
          value={formData.permission}
          onChange={(e) => onChange({ ...formData, permission: e.target.value })}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="如：system:admin:list"
        />
      </div>

      {/* 排序 */}
      <div>
        <label htmlFor="sort" className="mb-1 block text-sm font-medium text-gray-700">
          排序
        </label>
        <input
          id="sort"
          type="number"
          value={formData.sort}
          onChange={(e) => onChange({ ...formData, sort: Number(e.target.value) })}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* 路由路径 - 仅目录和菜单显示 */}
      {formData.menuType !== 'B' && (
        <div>
          <label htmlFor="path" className="mb-1 block text-sm font-medium text-gray-700">
            路由路径
          </label>
          <input
            id="path"
            type="text"
            value={formData.path}
            onChange={(e) => onChange({ ...formData, path: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="如：/system/admin"
          />
        </div>
      )}

      {/* 组件路径 - 仅菜单显示 */}
      {formData.menuType === 'M' && (
        <div>
          <label htmlFor="component" className="mb-1 block text-sm font-medium text-gray-700">
            组件路径
          </label>
          <input
            id="component"
            type="text"
            value={formData.component}
            onChange={(e) => onChange({ ...formData, component: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="如：system/admin/index"
          />
        </div>
      )}

      {/* 图标 - 仅目录和菜单显示 */}
      {formData.menuType !== 'B' && (
        <div>
          <div className="mb-1 block text-sm font-medium text-gray-700">图标</div>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border px-4 py-2">
              <DynamicIcon name={formData.icon} className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">{formData.icon || '未选择'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              选择
            </button>
          </div>
        </div>
      )}

      {/* 状态 */}
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
          状态
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => onChange({ ...formData, status: Number(e.target.value) })}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value={1}>正常</option>
          <option value={0}>禁用</option>
        </select>
      </div>

      {/* 显示状态 - 仅目录和菜单显示 */}
      {formData.menuType !== 'B' && (
        <div>
          <label htmlFor="visible" className="mb-1 block text-sm font-medium text-gray-700">
            显示状态
          </label>
          <select
            id="visible"
            value={formData.visible}
            onChange={(e) => onChange({ ...formData, visible: Number(e.target.value) })}
            className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value={1}>显示</option>
            <option value={0}>隐藏</option>
          </select>
        </div>
      )}

      {/* 是否外链 - 仅菜单显示 */}
      {formData.menuType === 'M' && (
        <div>
          <label htmlFor="isExternal" className="mb-1 block text-sm font-medium text-gray-700">
            是否外链
          </label>
          <select
            id="isExternal"
            value={formData.isExternal}
            onChange={(e) => onChange({ ...formData, isExternal: Number(e.target.value) })}
            className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value={0}>否</option>
            <option value={1}>是</option>
          </select>
        </div>
      )}

      {/* 是否缓存 - 仅菜单显示 */}
      {formData.menuType === 'M' && (
        <div>
          <label htmlFor="isCache" className="mb-1 block text-sm font-medium text-gray-700">
            是否缓存
          </label>
          <select
            id="isCache"
            value={formData.isCache}
            onChange={(e) => onChange({ ...formData, isCache: Number(e.target.value) })}
            className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value={1}>是</option>
            <option value={0}>否</option>
          </select>
        </div>
      )}

      {/* 备注 */}
      <div className="sm:col-span-2">
        <label htmlFor="remark" className="mb-1 block text-sm font-medium text-gray-700">
          备注
        </label>
        <textarea
          id="remark"
          value={formData.remark}
          onChange={(e) => onChange({ ...formData, remark: e.target.value })}
          rows={3}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="请输入备注"
        />
      </div>

      {/* 图标选择器弹窗 */}
      {showIconPicker && (
        <IconPicker
          value={formData.icon}
          onChange={(icon) => onChange({ ...formData, icon })}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  )
}
