# 基于轻量镜像
FROM node:20-alpine

# 启用 corepack 以使用 pnpm
ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH="$PNPM_HOME:$PATH" \
    NODE_ENV=development \
    HOST=0.0.0.0 \
    PORT=8091 \
    CHOKIDAR_USEPOLLING=true

RUN corepack enable && apk add --no-cache libc6-compat

WORKDIR /app

# 直接拷贝整个项目（包含本地依赖 layouts）以保证安装成功
COPY . /app

# 安装依赖（使用 lockfile 保持一致性）
RUN pnpm install --frozen-lockfile

EXPOSE 8091

# 使用开发服务器运行（rspack）
CMD ["pnpm", "serve:rspack"]


