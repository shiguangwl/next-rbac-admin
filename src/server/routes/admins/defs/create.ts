/**
 * 创建管理员路由定义
 * @description 创建管理员路由
 */

import { createRoute } from "@hono/zod-openapi";
import { createDataResponseSchema, ErrorSchema } from "../../common/dtos";
import { AdminSchema, CreateAdminInputSchema } from "../dtos";

/**
 * 创建管理员路由定义
 * POST /api/admins
 */
export const createAdminRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["用户管理"],
  summary: "创建管理员",
  description: "创建新的管理员账号",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAdminInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "创建成功",
      content: {
        "application/json": {
          schema: createDataResponseSchema(AdminSchema, "CreateAdminResponse"),
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
    409: {
      description: "用户名已存在",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});
