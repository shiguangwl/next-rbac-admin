# Requirements Document

## Introduction

本文档定义了一个基于 Next.js + Hono 技术栈的后台管理系统基础脚手架，核心功能包括 RBAC（基于角色的访问控制）权限管理和操作日志记录。系统采用独立的管理员体系（与 C 端用户分离），使用菜单/权限三级结构（目录-菜单-按钮）实现细粒度权限控制。

## Glossary

- **System**: 后台管理系统整体
- **RBAC_Engine**: 基于角色的访问控制引擎，负责权限验证和授权决策
- **Audit_Logger**: 操作日志记录器，负责记录管理员操作行为
- **Admin**: 后台管理员，独立于 C 端用户的管理账号
- **Role**: 角色，权限的集合，可分配给管理员
- **Menu**: 菜单/权限项，支持三种类型：D-目录、M-菜单、B-按钮/权限
- **Permission**: 权限标识，格式为 `module:action`（如 `system:admin:list`）
- **Operation_Log**: 操作日志记录，包含管理员行为的完整追踪信息

## Requirements

### Requirement 1: 数据模型（Drizzle Schema）

**User Story:** As a 系统架构师, I want 将现有 MySQL 表结构转换为 Drizzle Schema, so that 系统可以使用类型安全的 ORM 进行数据操作。

#### Acceptance Criteria

1. THE System SHALL 定义 sys_admin 表 Schema，包含 id、username、password、nickname、status、login_ip、login_time、remark、created_at、updated_at 字段
2. THE System SHALL 定义 sys_role 表 Schema，包含 id、role_name、sort、status、remark、created_at、updated_at 字段
3. THE System SHALL 定义 sys_menu 表 Schema，包含 id、parent_id、menu_type（枚举：D/M/B）、menu_name、permission、path、component、icon、sort、visible、status、is_external、is_cache、remark、created_at、updated_at 字段
4. THE System SHALL 定义 sys_admin_role 关联表 Schema，建立管理员与角色的多对多关系
5. THE System SHALL 定义 sys_role_menu 关联表 Schema，建立角色与菜单/权限的多对多关系
6. THE System SHALL 定义 sys_operation_log 表 Schema，包含完整的操作日志字段
7. THE System SHALL 使用 Drizzle relations 定义表之间的关联关系

### Requirement 2: 管理员认证

**User Story:** As a 管理员, I want 使用用户名密码登录后台系统, so that 我可以访问管理功能。

#### Acceptance Criteria

1. WHEN 管理员提交有效的用户名和密码 THEN THE System SHALL 验证凭据并返回 JWT Token
2. WHEN 管理员提交无效的凭据 THEN THE System SHALL 返回 401 错误
3. WHEN 管理员账号状态为禁用 THEN THE System SHALL 拒绝登录并返回账号已禁用错误
4. WHEN 管理员登录成功 THEN THE System SHALL 更新 login_ip 和 login_time 字段
5. WHEN 管理员登录成功 THEN THE Audit_Logger SHALL 记录登录操作日志
6. THE System SHALL 使用 bcrypt 验证密码
7. THE System SHALL 在 JWT payload 中包含 admin_id 和 username

### Requirement 3: 管理员管理

**User Story:** As a 超级管理员, I want 管理系统管理员账号, so that 我可以控制谁能访问后台系统。

#### Acceptance Criteria

1. WHEN 管理员请求管理员列表 THEN THE System SHALL 返回分页的管理员数据（不含密码字段）
2. WHEN 管理员创建新管理员时提供有效信息 THEN THE System SHALL 创建管理员并使用 bcrypt 加密密码
3. WHEN 管理员创建新管理员时用户名已存在 THEN THE System SHALL 返回冲突错误
4. WHEN 管理员更新管理员信息 THEN THE System SHALL 更新管理员并记录操作日志
5. WHEN 管理员重置密码 THEN THE System SHALL 使用 bcrypt 加密新密码并记录操作日志
6. WHEN 管理员删除管理员账号 THEN THE System SHALL 删除管理员及其角色关联并记录操作日志
7. WHEN 管理员尝试删除自己的账号 THEN THE System SHALL 拒绝删除
8. WHEN 管理员修改管理员状态 THEN THE System SHALL 更新状态并记录操作日志

### Requirement 4: 角色管理

**User Story:** As a 管理员, I want 管理系统角色, so that 我可以灵活配置不同角色的权限组合。

#### Acceptance Criteria

1. WHEN 管理员请求角色列表 THEN THE System SHALL 返回分页的角色数据，按 sort 字段排序
2. WHEN 管理员创建角色时提供有效的角色信息 THEN THE System SHALL 创建角色并返回创建结果
3. WHEN 管理员更新角色信息 THEN THE System SHALL 更新角色并记录操作日志
4. WHEN 管理员删除角色 THEN THE System SHALL 删除角色及其关联关系并记录操作日志
5. WHEN 管理员尝试删除已分配给管理员的角色 THEN THE System SHALL 返回错误提示先解除关联
6. WHEN 管理员为角色分配菜单权限 THEN THE System SHALL 更新 sys_role_menu 关联并记录操作日志

### Requirement 5: 菜单权限管理

**User Story:** As a 管理员, I want 管理系统菜单和权限, so that 我可以配置系统的功能结构和权限点。

#### Acceptance Criteria

1. WHEN 管理员请求菜单列表 THEN THE System SHALL 返回树形结构的菜单数据
2. WHEN 管理员创建菜单时提供有效信息 THEN THE System SHALL 创建菜单并返回结果
3. WHEN 管理员创建按钮权限时 permission 已存在 THEN THE System SHALL 返回冲突错误
4. WHEN 管理员更新菜单信息 THEN THE System SHALL 更新菜单并记录操作日志
5. WHEN 管理员删除菜单 THEN THE System SHALL 检查是否有子菜单，有则拒绝删除
6. WHEN 管理员删除菜单 THEN THE System SHALL 删除菜单及其角色关联并记录操作日志
7. THE System SHALL 支持按 menu_type 筛选菜单列表

### Requirement 6: 管理员角色分配

**User Story:** As a 管理员, I want 为管理员分配角色, so that 管理员可以获得相应的系统权限。

#### Acceptance Criteria

1. WHEN 管理员查询某管理员的角色 THEN THE System SHALL 返回该管理员已分配的所有角色列表
2. WHEN 管理员为某管理员分配角色 THEN THE System SHALL 更新 sys_admin_role 关联并记录操作日志
3. WHEN 管理员批量更新某管理员的角色 THEN THE System SHALL 在事务中完成角色更新

### Requirement 7: 权限验证

**User Story:** As a 系统, I want 在 API 层验证管理员权限, so that 只有授权管理员才能访问受保护资源。

#### Acceptance Criteria

1. WHEN 管理员请求受保护的 API THEN THE RBAC_Engine SHALL 验证管理员是否拥有所需权限标识
2. WHEN 管理员拥有所需权限 THEN THE RBAC_Engine SHALL 允许请求继续处理
3. WHEN 管理员缺少所需权限 THEN THE RBAC_Engine SHALL 返回 403 Forbidden 错误
4. WHEN 管理员未登录或 Token 无效 THEN THE RBAC_Engine SHALL 返回 401 Unauthorized 错误
5. THE RBAC_Engine SHALL 支持通过 Hono 中间件声明式配置路由所需权限
6. THE RBAC_Engine SHALL 查询管理员所有角色关联的菜单权限进行验证
7. WHEN 角色 ID 为 1（超级管理员）THEN THE RBAC_Engine SHALL 跳过权限验证直接放行

### Requirement 8: 操作日志记录

**User Story:** As a 审计员, I want 系统自动记录操作日志, so that 我可以追踪管理员行为和系统变更。

#### Acceptance Criteria

1. WHEN 管理员执行增删改操作 THEN THE Audit_Logger SHALL 记录操作详情到 sys_operation_log 表
2. THE Audit_Logger SHALL 记录 admin_id、admin_name、module、operation、description、method、request_method、request_url、request_params、ip、user_agent、execution_time、status 字段
3. WHEN 操作成功 THEN THE Audit_Logger SHALL 设置 status 为 1
4. WHEN 操作失败 THEN THE Audit_Logger SHALL 设置 status 为 0 并记录 error_msg
5. THE Audit_Logger SHALL 支持通过装饰器或中间件自动记录日志
6. THE Audit_Logger SHALL 异步记录日志，不阻塞主业务流程

### Requirement 9: 操作日志查询

**User Story:** As a 审计员, I want 灵活查询操作日志, so that 我可以快速定位特定的操作记录。

#### Acceptance Criteria

1. WHEN 审计员请求日志列表 THEN THE System SHALL 返回分页的日志数据，按 created_at 倒序排列
2. WHEN 审计员按管理员筛选 THEN THE System SHALL 返回指定管理员的操作日志
3. WHEN 审计员按模块筛选 THEN THE System SHALL 返回指定模块的日志
4. WHEN 审计员按操作类型筛选 THEN THE System SHALL 返回指定操作类型的日志
5. WHEN 审计员按状态筛选 THEN THE System SHALL 返回指定状态的日志
6. WHEN 审计员按时间范围筛选 THEN THE System SHALL 返回指定时间范围内的日志
7. THE System SHALL 支持多条件组合筛选
8. THE System SHALL 支持日志导出功能

### Requirement 10: API 接口

**User Story:** As a 前端开发者, I want 调用后台管理 API, so that 我可以实现管理界面。

#### Acceptance Criteria

1. THE System SHALL 提供 POST /api/auth/login 接口实现管理员登录
2. THE System SHALL 提供 POST /api/auth/logout 接口实现管理员登出
3. THE System SHALL 提供 GET /api/auth/info 接口获取当前管理员信息和权限
4. THE System SHALL 提供管理员 CRUD 接口：GET/POST /api/admins, GET/PUT/DELETE /api/admins/:id
5. THE System SHALL 提供 PUT /api/admins/:id/reset-password 接口重置密码
6. THE System SHALL 提供 PUT /api/admins/:id/roles 接口更新管理员角色
7. THE System SHALL 提供角色 CRUD 接口：GET/POST /api/roles, GET/PUT/DELETE /api/roles/:id
8. THE System SHALL 提供 PUT /api/roles/:id/menus 接口更新角色菜单权限
9. THE System SHALL 提供菜单 CRUD 接口：GET/POST /api/menus, GET/PUT/DELETE /api/menus/:id
10. THE System SHALL 提供 GET /api/menus/tree 接口获取树形菜单
11. THE System SHALL 提供 GET /api/operation-logs 接口查询操作日志
12. THE System SHALL 所有 API 响应遵循统一的 JSON 结构

### Requirement 11: 前端权限控制

**User Story:** As a 前端开发者, I want 获取当前管理员权限, so that 我可以在前端实现权限控制。

#### Acceptance Criteria

1. THE System SHALL 在 GET /api/auth/info 接口返回当前管理员的所有权限标识列表和菜单树
2. THE System SHALL 提供 React Hook `useAuth` 获取当前管理员信息和权限
3. THE System SHALL 提供 React Hook `usePermission` 检查是否拥有指定权限
4. THE System SHALL 提供 React 组件 `PermissionGuard` 用于条件渲染受保护内容
5. THE System SHALL 提供动态路由生成，根据权限过滤可访问的菜单

### Requirement 12: 初始化数据

**User Story:** As a 系统管理员, I want 系统预置基础数据, so that 系统开箱即用。

#### Acceptance Criteria

1. THE System SHALL 提供 seed 脚本初始化超级管理员账号（admin/admin123）
2. THE System SHALL 提供 seed 脚本初始化基础角色（超级管理员、管理员、运营）
3. THE System SHALL 提供 seed 脚本初始化系统管理菜单（管理员管理、角色管理、菜单管理、操作日志）
4. THE System SHALL 提供 seed 脚本初始化角色菜单关联
5. THE System SHALL 提供 seed 脚本初始化管理员角色关联
