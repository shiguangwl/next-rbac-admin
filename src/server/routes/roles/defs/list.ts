/**
 * 角色列表路由定义
 * @description 获取角色列表路由
 */

import { createRoute, z } from "@hono/zod-openapi";
import { createDataResponseSchema, ErrorSchema } from "../../common/dtos";
import { PaginatedRoleSchema, RoleQuerySchema, RoleSchema } from "../dtos";

/**
 * 获取角色列表路由定义
 * GET /api/roles
 */
export const listRolesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["角色管理"],
  summary: "获取角色列表",
  description: "分页获取角色列表，按 sort 字段排序",
  security: [{ bearerAuth: [] }],
  request: {
    query: RoleQuerySchema,
  },
  responses: {
    200: {
      description: "获取成功",
      content: {
        "application/json": {
          schema: createDataResponseSchema(
            PaginatedRoleSchema,
            "PaginatedRoleResponse"
          ),
        },
      },
    },
    401: {
      description: "未登录或登录已过期",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: "无权限访问",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

/**
 * 获取所有角色（不分页）路由定义
 * GET /api/roles/all
 */
export const getAllRolesRoute = createRoute({
  method: "get",
  path: "/all",
  tags: ["角色管理"],
  summary: "获取所有角色",
  description: "获取所有启用的角色（用于下拉选择）",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "获取成功",
      content: {
        "application/json": {
          schema: createDataResponseSchema(
            z.array(RoleSchema),
            "RoleListResponse"
          ),
        },
      },
    },
    401: {
      description: "未登录或登录已过期",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});
