# syntax=docker/dockerfile:1

# ============================================
# Base: Node.js with pnpm
# ============================================
FROM node:22-alpine AS base

# 安装 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# ============================================
# Dependencies: 安装依赖
# ============================================
FROM base AS deps

WORKDIR /app

# 复制依赖清单
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括 devDependencies，构建需要）
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Builder: 构建应用
# ============================================
FROM base AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 跳过环境变量验证（构建时无需真实环境变量）
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用
RUN pnpm build

# ============================================
# Runner: 生产运行时
# ============================================
FROM base AS runner

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 drizzle 迁移文件（用于 AUTO_DB_MIGRATE）
COPY --from=builder /app/drizzle ./drizzle

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
