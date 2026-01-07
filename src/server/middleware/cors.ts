/**
 * CORS 中间件
 * @description 处理跨域资源共享
 */

import { env } from "@/env";
import { cors } from "hono/cors";

/**
 * 构建允许的 Origin 列表
 */
const allowedOrigins = [
  env.NEXT_PUBLIC_APP_URL,
  // 开发环境允许 localhost 常用端口
  ...(env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
      ]
    : []),
];

/**
 * CORS 中间件配置
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // 允许白名单中的来源
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    return null;
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "X-Request-Id",
  ],
  exposeHeaders: [
    "X-Request-Id",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  credentials: true,
  maxAge: 86400, // 24 小时
});
