'use client'

/**
 * 图标选择器组件
 * @description 支持搜索和选择 lucide-react 图标
 */

import * as LucideIcons from 'lucide-react'
import { useMemo, useState } from 'react'

// 常用图标列表（用于菜单系统）
const COMMON_ICONS = [
  'Settings',
  'Users',
  'Shield',
  'Menu',
  'FileText',
  'Home',
  'LayoutDashboard',
  'UserCog',
  'Lock',
  'Key',
  'Database',
  'Server',
  'Folder',
  'File',
  'Search',
  'Plus',
  'Edit',
  'Trash2',
  'Check',
  'X',
  'ChevronRight',
  'ChevronDown',
  'AlertCircle',
  'Info',
  'Bell',
  'Mail',
  'Calendar',
  'Clock',
  'Download',
  'Upload',
  'RefreshCw',
  'LogOut',
  'Eye',
  'EyeOff',
  'Star',
  'Heart',
  'Bookmark',
  'Tag',
  'Filter',
  'SortAsc',
  'Grid',
  'List',
  'Image',
  'Package',
  'Box',
  'Layers',
]

interface IconPickerProps {
  value?: string | null
  onChange: (icon: string) => void
  onClose: () => void
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // 过滤图标
  const filteredIcons = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return COMMON_ICONS

    return COMMON_ICONS.filter((name) => name.toLowerCase().includes(term))
  }, [searchTerm])

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">选择图标</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <LucideIcons.X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative">
            <LucideIcons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索图标..."
              className="w-full rounded-lg  -gray-300 py-2 pl-10 pr-4 focus:lue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 图标网格 */}
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-8 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons]
              const isSelected = value === iconName

              // 检查是否为有效的函数组件
              if (typeof IconComponent !== 'function') {
                return null
              }

              const Icon = IconComponent as React.ComponentType<{
                className?: string
              }>

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleSelect(iconName)}
                  className={`flex flex-col items-center gap-1 rounded-lg  p-3 transition-colors hover:bg-blue-50 ${
                    isSelected ? 'lue-500 bg-blue-50' : '-gray-200'
                  }`}
                  title={iconName}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-gray-600 truncate w-full text-center">
                    {iconName}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="py-8 text-center text-gray-500">未找到匹配的图标</div>
          )}
        </div>
      </div>
    </div>
  )
}
