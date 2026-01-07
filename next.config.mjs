import "./src/env.mjs"; // 构建时自动验证环境变量

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
