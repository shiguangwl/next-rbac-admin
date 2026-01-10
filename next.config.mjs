import "./src/env.ts"; // 构建时自动验证环境变量

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mysql2"],
  // 禁用 Next.js 默认请求日志，使用自定义的结构化日志
  logging: {
    incomingRequests: false,
  },
};

export default nextConfig;
