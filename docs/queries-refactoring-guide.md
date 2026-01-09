# React Query Hooks 重构方案

## 📊 重构效果对比

### 代码行数对比

| 文件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| use-admins.ts | 189 行 | ~90 行 | ⬇️ 52% |
| use-roles.ts | 182 行 | ~85 行 | ⬇️ 53% |
| use-menus.ts | ~150 行 | ~60 行 | ⬇️ 60% |
| **总计** | **~521 行** | **~235 行** | **⬇️ 55%** |

新增：`factory.ts` (~200 行，一次性投入)

**总体节省代码量**：在 3+ 个模块后开始盈利，每增加一个模块节省 ~100 行

---

## ✅ 重构优势

### 1. 消除重复代码
```typescript
// ❌ 重构前：每个模块都要写一遍
export function useAdmins(params) { /* 50 行 */ }
export function useRoles(params) { /* 50 行 */ }
export function useMenus(params) { /* 50 行 */ }

// ✅ 重构后：只需配置
const adminHooks = createResourceHooks({ resourceName: 'admins' })
const roleHooks = createResourceHooks({ resourceName: 'roles' })
const menuHooks = createResourceHooks({ resourceName: 'menus' })
```

### 2. 统一行为
所有资源的 CRUD 行为完全一致：
- 查询逻辑
- 缓存失效策略
- 错误处理
- 分页参数

### 3. 易于维护
需要修改缓存策略？只需改一处：
```typescript
// factory.ts
onSuccess: () => {
  // 所有资源都会应用新的缓存策略
  queryClient.invalidateQueries({ queryKey: queryKeys.all })
}
```

### 4. 降低认知负担
新增一个资源只需：
```typescript
const xxxHooks = createResourceHooks({
  resourceName: 'xxx',
})
export const { useList, useDetail, useCreate, useUpdate, useDelete } = xxxHooks
```

### 5. 保持灵活性
非标准操作仍然可以单独实现：
```typescript
// 重构后仍可添加自定义 Hooks
export function useResetPassword() { /* 特殊逻辑 */ }
export function useUpdateRoleMenus() { /* 特殊逻辑 */ }
```

---

## 🚀 使用示例

### 重构前（189 行）
```typescript
// use-admins.ts
type AdminsClient = { /* ... */ }
function adminsClient() { /* ... */ }
export const adminKeys = { /* ... */ }
export function useAdmins(params) { /* 50 行 */ }
export function useAdmin(id) { /* 30 行 */ }
export function useCreateAdmin() { /* 30 行 */ }
export function useUpdateAdmin() { /* 30 行 */ }
export function useDeleteAdmin() { /* 30 行 */ }
export function useResetPassword() { /* 20 行 */ }
```

### 重构后（90 行）
```typescript
// use-admins.ts
const adminHooks = createResourceHooks({
  resourceName: 'admins',
  listErrorMessage: '获取管理员列表失败',
})

export const adminKeys = adminHooks.queryKeys
export const useAdmins = adminHooks.useList
export const useAdmin = adminHooks.useDetail
export const useCreateAdmin = adminHooks.useCreate
export const useUpdateAdmin = adminHooks.useUpdate
export const useDeleteAdmin = adminHooks.useDelete

// 只有特殊逻辑需要单独实现
export function useResetPassword() { /* 20 行 */ }
```

---

## 📝 迁移步骤

### Step 1: 创建 factory.ts
复制上面提供的 `factory.ts` 文件到 `src/hooks/queries/`

### Step 2: 逐个迁移模块
从最简单的模块开始（如 operation-logs）

```bash
# 1. 备份原文件
mv use-operation-logs.ts use-operation-logs.ts.backup

# 2. 创建新文件
# 使用 factory 重写

# 3. 测试
# 确保所有功能正常

# 4. 删除备份
rm use-operation-logs.ts.backup
```

### Step 3: 更新导出
确保 `index.ts` 正确导出所有 hooks

### Step 4: 运行测试
```bash
pnpm test
```

---

## ⚠️ 注意事项

### 1. 类型安全
工厂函数使用泛型，确保类型安全：
```typescript
createResourceHooks<
  PaginatedAdmin,  // 列表返回类型
  Admin,           // 详情返回类型
  CreateAdminInput,
  UpdateAdminInput,
  AdminQuery       // 查询参数类型
>({ /* ... */ })
```

### 2. 自定义操作
不是所有操作都能标准化，保留自定义能力：
```typescript
// ✅ 标准 CRUD 使用工厂
const adminHooks = createResourceHooks(...)

// ✅ 特殊操作仍可手动实现
export function useResetPassword() {
  // 自定义逻辑
}
```

### 3. 渐进式迁移
不需要一次性重构所有模块：
- 新模块：直接使用工厂
- 旧模块：有需要时再迁移

---

## 📈 投资回报分析

### 初始投入
- 创建 factory.ts：~2 小时
- 迁移第一个模块：~1 小时
- 学习曲线：~0.5 小时

**总投入：~3.5 小时**

### 长期收益
- 每新增一个模块：节省 ~2 小时
- 代码维护成本：降低 50%
- Bug 修复成本：一次修复，全局生效

**从第 2 个模块开始盈利！**

---

## 🎯 推荐行动

1. ✅ **立即创建 factory.ts**
2. ✅ **选择最简单的模块试点**（如 operation-logs）
3. ✅ **验证功能完整性**
4. ✅ **逐步迁移其他模块**
5. ✅ **更新团队文档**

---

## 💡 进一步优化方向

### 1. 支持更多查询类型
```typescript
// 支持无限滚动
function useInfiniteList() { /* ... */ }
```

### 2. 乐观更新
```typescript
onMutate: async (newData) => {
  // 立即更新 UI，提升体验
  queryClient.setQueryData(...)
}
```

### 3. 错误重试策略
```typescript
retry: (failureCount, error) => {
  // 智能重试
  return failureCount < 3 && error.status === 500
}
```

### 4. 请求去重
```typescript
// 防止重复请求
staleTime: 5000
```

