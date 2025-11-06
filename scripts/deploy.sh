#!/bin/bash

# Docker 部署脚本
# 用法: ./scripts/deploy.sh
# 说明: 检查 Token 有效期，可选更新 Token 并启动 Docker 容器

set -e

echo "=== 开始部署 ==="
echo ""

# 1. 检查项目目录
PROJECT_DIR="/data/landport-freight-management-api"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "错误: 项目目录不存在: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# 2. 检查并显示 Token 有效期
echo "1. 检查前端官网 Token..."
echo ""

TOKEN_FILE=".env.website-token"
SHOULD_UPDATE_TOKEN=false

if [ -f "$TOKEN_FILE" ]; then
  # 读取现有 Token
  EXISTING_TOKEN=$(cat "$TOKEN_FILE" | tr -d ' ' | tr -d '\n')
  
  if [ -n "$EXISTING_TOKEN" ]; then
    # 解析 Token 并显示有效期信息
    TOKEN_INFO=$(node -e "
      const jwt = require('jsonwebtoken');
      const token = '$EXISTING_TOKEN';
      try {
        const decoded = jwt.decode(token);
        if (decoded) {
          const iat = new Date(decoded.iat * 1000);
          const exp = new Date(decoded.exp * 1000);
          const now = new Date();
          const remainingDays = Math.floor((decoded.exp * 1000 - now.getTime()) / (1000 * 60 * 60 * 24));
          
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return \`\${year}/\${month}/\${day} \${hours}:\${minutes}:\${seconds}\`;
          };
          
          console.log('签发时间: ' + formatDate(iat));
          console.log('过期时间: ' + formatDate(exp));
          if (remainingDays > 0) {
            console.log('✅ Token 有效, 剩余 ' + remainingDays + ' 天');
          } else {
            console.log('❌ Token 已过期');
          }
        }
      } catch (err) {
        console.log('❌ Token 解析失败');
      }
    " 2>/dev/null)
    
    if [ -n "$TOKEN_INFO" ]; then
      echo "$TOKEN_INFO"
      echo ""
      # 提示用户是否更新 Token（默认不更新）
      if [ -t 0 ]; then
        # 交互式终端
        read -p "是否更新 Token? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          SHOULD_UPDATE_TOKEN=true
        else
          echo "跳过 Token 更新，使用现有 Token"
          echo ""
        fi
      else
        # 非交互式环境（如 CI/CD），默认不更新
        echo "非交互式环境，跳过 Token 更新，使用现有 Token"
        echo ""
      fi
    else
      echo "⚠️  现有 Token 无效，将生成新 Token"
      SHOULD_UPDATE_TOKEN=true
    fi
  else
    echo "⚠️  Token 文件为空，将生成新 Token"
    SHOULD_UPDATE_TOKEN=true
  fi
else
  echo "⚠️  Token 文件不存在，将生成新 Token"
  SHOULD_UPDATE_TOKEN=true
fi

# 3. 更新 Token（如果需要）
if [ "$SHOULD_UPDATE_TOKEN" = true ]; then
  echo "生成新的前端官网 Token..."
  node scripts/generate-website-token.mjs > "$TOKEN_FILE" 2>&1 || {
    echo "错误: Token 生成失败"
    exit 1
  }
  echo "✅ Token 已更新"
  echo ""
fi

# 4. 显示 Token（提供给前端开发者）
echo "=== 前端官网 Token ==="
cat "$TOKEN_FILE"
echo ""
echo "请将上述 Token 提供给前端开发者，用于配置环境变量"
echo ""

# 5. 停止并删除旧容器
echo "2. 停止并删除旧容器..."
docker stop landport-app 2>/dev/null || true
docker rm landport-app 2>/dev/null || true

# 6. 启动 Docker 容器
echo "3. 启动 Docker 容器..."
docker run -itd --name landport-app \
  -p 7001:7001 \
  -v "$PROJECT_DIR":/code \
  -v /web/dachengguoji/public:/public \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && npm run docker"

# 7. 等待容器启动
echo "4. 等待容器启动..."
sleep 3

# 8. 检查容器状态
if docker ps | grep -q landport-app; then
  echo ""
  echo "=== 部署完成 ==="
  echo "容器名称: landport-app"
  echo "端口: 7001"
  echo ""
  echo "常用命令:"
  echo "  查看日志: docker logs -f landport-app"
  echo "  查看 Token: cat $PROJECT_DIR/.env.website-token"
  echo "  进入容器: docker exec -it landport-app sh"
  echo "  停止容器: docker stop landport-app"
  echo "  重启容器: docker restart landport-app"
  echo ""
else
  echo ""
  echo "错误: 容器启动失败"
  echo "查看日志: docker logs landport-app"
  exit 1
fi

