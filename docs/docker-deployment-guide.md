# Docker 部署指南 - Token 传递

## 概述

本文档说明在 Docker 部署时如何生成和传递前端官网 Token。

## Token 说明

前端官网 Token 是供前端项目使用的，用于访问 `/api/cases` 接口。Token 不需要在后端容器中运行，但需要在部署时生成并提供给前端开发者。

## 方案一：在 Docker 容器中生成 Token（推荐）

在容器启动时生成 Token，然后提供给前端开发者。

### 1. 修改 Docker 启动命令

在启动容器时，先运行脚本生成 Token：

```bash
docker run -itd --name landport-app \
  -p 7001:7001 \
  -v /data/landport-freight-management-api:/code \
  -v /web/dachengguoji/public:/public \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && node scripts/generate-website-token.mjs > /code/.env.website-token && npm run docker"
```

### 2. 生成 Token 并保存

Token 会生成并保存到 `/code/.env.website-token` 文件中（对应宿主机路径：`/data/landport-freight-management-api/.env.website-token`）。

### 3. 获取 Token

从容器或宿主机获取 Token：

```bash
# 从容器中获取
docker exec landport-app cat /code/.env.website-token

# 从宿主机获取
cat /data/landport-freight-management-api/.env.website-token
```

## 方案二：预先生成 Token 并挂载到容器

在部署前生成 Token，然后挂载到容器中。

### 1. 在宿主机生成 Token

```bash
cd /data/landport-freight-management-api
node scripts/generate-website-token.mjs > .env.website-token
```

### 2. 修改 Docker 启动命令（可选）

如果需要在容器启动时读取 Token，可以挂载 Token 文件：

```bash
docker run -itd --name landport-app \
  -p 7001:7001 \
  -v /data/landport-freight-management-api:/code \
  -v /web/dachengguoji/public:/public \
  -v /data/landport-freight-management-api/.env.website-token:/code/.env.website-token:ro \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && npm run docker"
```

**注意：** 后端应用不需要读取 Token，Token 是给前端使用的。挂载 Token 文件只是为了方便在容器中查看。

## 方案三：通过环境变量传递 Token（不推荐）

虽然可以通过环境变量传递 Token，但后端应用不需要使用它。这种方式主要用于方便前端开发者获取 Token。

### 1. 生成 Token

```bash
cd /data/landport-freight-management-api
TOKEN=$(node scripts/generate-website-token.mjs 2>&1 | grep -A 1 "^Token:" | tail -1 | tr -d ' ')
```

### 2. 通过环境变量传递

```bash
docker run -itd --name landport-app \
  -p 7001:7001 \
  -v /data/landport-freight-management-api:/code \
  -v /web/dachengguoji/public:/public \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  -e WEBSITE_TOKEN="$TOKEN" \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && npm run docker"
```

### 3. 在容器中查看 Token

```bash
docker exec landport-app printenv WEBSITE_TOKEN
```

## 推荐方案：在部署脚本中生成 Token

创建一个部署脚本，自动生成 Token 并提供给前端开发者。

### 1. 创建部署脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash

# 部署脚本
# 用法: ./scripts/deploy.sh

set -e

echo "=== 开始部署 ==="

# 1. 生成 Token
echo "1. 生成前端官网 Token..."
cd /data/landport-freight-management-api
node scripts/generate-website-token.mjs > .env.website-token

# 2. 显示 Token（提供给前端开发者）
echo ""
echo "=== 前端官网 Token ==="
cat .env.website-token
echo ""
echo "请将上述 Token 提供给前端开发者，用于配置环境变量"
echo ""

# 3. 启动 Docker 容器
echo "2. 启动 Docker 容器..."
docker stop landport-app 2>/dev/null || true
docker rm landport-app 2>/dev/null || true

docker run -itd --name landport-app \
  -p 7001:7001 \
  -v /data/landport-freight-management-api:/code \
  -v /web/dachengguoji/public:/public \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && npm run docker"

echo ""
echo "=== 部署完成 ==="
echo "容器名称: landport-app"
echo "端口: 7001"
echo ""
echo "查看日志: docker logs -f landport-app"
echo "查看 Token: cat /data/landport-freight-management-api/.env.website-token"
```

### 2. 使用部署脚本

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 完整 Docker 部署命令（推荐）

结合 Token 生成的完整部署命令：

```bash
# 1. 进入项目目录
cd /data/landport-freight-management-api

# 2. 生成 Token（可选，如果已存在可跳过）
node scripts/generate-website-token.mjs > .env.website-token

# 3. 显示 Token（提供给前端开发者）
echo "=== 前端官网 Token ==="
cat .env.website-token
echo ""

# 4. 启动 Docker 容器
docker stop landport-app 2>/dev/null || true
docker rm landport-app 2>/dev/null || true

docker run -itd --name landport-app \
  -p 7001:7001 \
  -v /data/landport-freight-management-api:/code \
  -v /web/dachengguoji/public:/public \
  -w /code \
  -e MYSQL_HOST=172.17.0.1 \
  -e MYSQL_PASSWORD=Admin123. \
  -e REDIS_HOST=172.17.0.1 \
  node:22 \
  sh -c "cd /code && npm install --registry=https://registry.npm.taobao.org && npm run clean && npm run tsc && npm run docker"

# 5. 查看容器日志
docker logs -f landport-app
```

## 获取 Token 的方法

### 方法 1：从宿主机文件获取

```bash
cat /data/landport-freight-management-api/.env.website-token
```

### 方法 2：从容器中获取

```bash
docker exec landport-app cat /code/.env.website-token
```

### 方法 3：在容器中重新生成

```bash
docker exec landport-app node /code/scripts/generate-website-token.mjs
```

## 注意事项

1. **Token 安全：**
   - Token 文件已添加到 `.gitignore`，不会被提交到代码仓库
   - 不要将 Token 提交到代码仓库
   - 定期更新 Token（建议每年更新一次）

2. **Token 有效期：**
   - 当前 Token 有效期为 1 年
   - 过期后需要重新生成 Token
   - 建议在 Token 过期前提前更新

3. **前端配置：**
   - Token 是给前端项目使用的，后端不需要读取
   - 前端开发者需要将 Token 配置到环境变量中
   - 详细配置说明请参考：`docs/website-token-guide.md`

4. **部署流程：**
   - 每次部署时，可以重新生成 Token（如果 Token 未过期，可以继续使用）
   - 建议在部署脚本中自动生成 Token，方便管理

## 故障排查

### 问题 1: 无法生成 Token

**原因：**
- 容器中没有 `jsonwebtoken` 依赖
- 脚本路径不正确

**解决方案：**
1. 确保在容器启动前，项目代码已挂载到容器中
2. 确保 `npm install` 已执行，安装了所有依赖
3. 检查脚本路径是否正确

### 问题 2: Token 文件不存在

**原因：**
- Token 生成失败
- 文件路径不正确

**解决方案：**
1. 检查容器日志：`docker logs landport-app`
2. 手动在容器中运行脚本：`docker exec landport-app node /code/scripts/generate-website-token.mjs`
3. 检查文件权限

### 问题 3: 无法访问 Token 文件

**原因：**
- 文件权限问题
- 挂载路径不正确

**解决方案：**
1. 检查文件权限：`ls -la /data/landport-freight-management-api/.env.website-token`
2. 检查挂载路径是否正确
3. 确保容器有读取权限

## 更新日志

- 2025-11-06: 初始版本，支持 Docker 部署时生成和传递 Token

