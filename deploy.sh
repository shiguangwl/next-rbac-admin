#!/bin/bash

# ============================================
# 一键远程部署脚本（远程 Docker Daemon 方式）
# 本地构建镜像 -> 直接部署到远程 Docker
# ============================================

set -e

# ==================== 配置区域 ====================

# SSH 连接信息
SSH_HOST=""           # 远程服务器 IP 或域名
SSH_PORT="22"         # SSH 端口，默认 22
SSH_USER=""           # SSH 用户名
SSH_PASSWORD=""       # SSH 密码（留空则使用密钥认证）

# 部署配置
REMOTE_DIR="/opt/app" # 远程 docker-compose.yml 存放目录
IMAGE_NAME="app"      # 镜像名称
IMAGE_TAG="latest"    # 镜像标签

# ==================== 配置结束 ====================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查必要配置
check_config() {
    log_info "检查配置..."
    [[ -z "$SSH_HOST" ]] && log_error "请配置 SSH_HOST"
    [[ -z "$SSH_USER" ]] && log_error "请配置 SSH_USER"
    
    if [[ ! -f ".env" ]]; then
        log_error "缺少 .env 文件，请先创建"
    fi
    
    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "缺少 docker-compose.yml 文件"
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "本地未安装 Docker"
    fi
    
    log_info "配置检查通过"
}

# 检查并安装 sshpass
check_sshpass() {
    if [[ -n "$SSH_PASSWORD" ]]; then
        if ! command -v sshpass &> /dev/null; then
            log_warn "检测到使用密码认证，正在安装 sshpass..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install hudochenkov/sshpass/sshpass || log_error "安装 sshpass 失败"
            elif [[ -f /etc/debian_version ]]; then
                sudo apt-get update && sudo apt-get install -y sshpass
            elif [[ -f /etc/redhat-release ]]; then
                sudo yum install -y sshpass
            else
                log_error "请手动安装 sshpass"
            fi
        fi
    fi
}

# 建立 SSH 隧道连接远程 Docker
setup_docker_context() {
    log_info "配置远程 Docker 连接..."
    
    CONTEXT_NAME="deploy-remote-$$"
    
    if [[ -n "$SSH_PASSWORD" ]]; then
        # 使用 sshpass 建立 SSH 隧道
        export SSHPASS="$SSH_PASSWORD"
        
        # 创建 SSH 隧道到远程 Docker socket
        log_info "建立 SSH 隧道..."
        sshpass -e ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" \
            -L /tmp/docker-$$.sock:/var/run/docker.sock \
            -fN "$SSH_USER@$SSH_HOST"
        
        TUNNEL_PID=$!
        export DOCKER_HOST="unix:///tmp/docker-$$.sock"
    else
        # 使用 SSH 密钥，直接通过 docker context
        docker context create "$CONTEXT_NAME" \
            --docker "host=ssh://$SSH_USER@$SSH_HOST:$SSH_PORT" 2>/dev/null || true
        docker context use "$CONTEXT_NAME"
    fi
}

# 清理 Docker context
cleanup_docker_context() {
    log_info "清理连接..."
    
    if [[ -n "$SSH_PASSWORD" ]]; then
        # 关闭 SSH 隧道
        pkill -f "ssh.*docker-$$.sock" 2>/dev/null || true
        rm -f "/tmp/docker-$$.sock"
        unset DOCKER_HOST
    else
        docker context use default 2>/dev/null || true
        docker context rm "$CONTEXT_NAME" 2>/dev/null || true
    fi
}

# 设置退出时清理
trap cleanup_docker_context EXIT

# SSH 命令封装
ssh_cmd() {
    if [[ -n "$SSH_PASSWORD" ]]; then
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1"
    else
        ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "$1"
    fi
}

# SCP 命令封装
scp_cmd() {
    if [[ -n "$SSH_PASSWORD" ]]; then
        sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -P "$SSH_PORT" "$1" "$SSH_USER@$SSH_HOST:$2"
    else
        scp -o StrictHostKeyChecking=no -P "$SSH_PORT" "$1" "$SSH_USER@$SSH_HOST:$2"
    fi
}

# 本地构建镜像并推送到远程
build_and_push() {
    log_info "本地构建 Docker 镜像..."
    
    # 本地构建
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
    
    log_info "推送镜像到远程 Docker..."
    
    # 导出镜像并通过 SSH 导入到远程
    if [[ -n "$SSH_PASSWORD" ]]; then
        docker save "$IMAGE_NAME:$IMAGE_TAG" | sshpass -p "$SSH_PASSWORD" \
            ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
            "docker load"
    else
        docker save "$IMAGE_NAME:$IMAGE_TAG" | \
            ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
            "docker load"
    fi
    
    log_info "镜像推送完成"
}

# 准备远程部署文件
prepare_remote() {
    log_info "准备远程部署环境..."
    
    ssh_cmd "mkdir -p $REMOTE_DIR"
    
    # 生成远程用的 docker-compose.yml（使用本地镜像）
    cat > /tmp/docker-compose-remote.yml << EOF
services:
  app:
    image: $IMAGE_NAME:$IMAGE_TAG
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - JWT_SECRET=\${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
      - AUTO_DB_MIGRATE=\${AUTO_DB_MIGRATE:-false}
    env_file:
      - .env
    restart: unless-stopped
EOF
    
    scp_cmd "/tmp/docker-compose-remote.yml" "$REMOTE_DIR/docker-compose.yml"
    scp_cmd ".env" "$REMOTE_DIR/"
    rm -f /tmp/docker-compose-remote.yml
}

# 部署应用
deploy() {
    log_info "部署应用..."
    
    ssh_cmd "cd $REMOTE_DIR && docker compose down --remove-orphans 2>/dev/null || true"
    ssh_cmd "cd $REMOTE_DIR && docker compose up -d"
    
    log_info "清理旧镜像..."
    ssh_cmd "docker image prune -f 2>/dev/null || true"
}

# 检查部署状态
check_status() {
    log_info "检查部署状态..."
    sleep 3
    
    if ssh_cmd "cd $REMOTE_DIR && docker compose ps | grep -q 'Up'"; then
        log_info "✅ 部署成功！"
        log_info "应用地址: http://$SSH_HOST:3000"
        ssh_cmd "cd $REMOTE_DIR && docker compose ps"
    else
        log_error "部署可能失败，请检查日志: ssh $SSH_USER@$SSH_HOST 'cd $REMOTE_DIR && docker compose logs'"
    fi
}

# 主流程
main() {
    echo "========================================"
    echo "    一键远程部署（本地构建镜像）"
    echo "========================================"
    
    check_config
    check_sshpass
    build_and_push
    prepare_remote
    deploy
    check_status
    
    echo "========================================"
    log_info "部署完成！"
    echo "========================================"
}

main "$@"
