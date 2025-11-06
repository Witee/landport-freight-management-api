# 前端官网 Token 使用说明

## Token 文件

- `.env.website-token` - 包含实际的 Token（已生成，不要提交到代码仓库）
- `.env.website-token.example` - Token 配置示例文件

## 当前 Token

Token 已生成并保存在 `.env.website-token` 文件中。

**Token 信息：**
- 用户ID: 0 (固定系统用户 ID)
- 权限: user (普通用户权限)
- 有效期: 365d (1 年)
- 用途: 访问 GET /api/cases 接口

## 使用方法

### 1. 查看当前 Token

```bash
cat .env.website-token
```

### 2. 重新生成 Token

```bash
node scripts/generate-website-token.mjs > .env.website-token
```

### 3. 提供给前端开发者

将 `.env.website-token` 文件中的 Token 提供给前端开发者，用于配置前端项目的环境变量。

## 前端配置

前端开发者需要：

1. 在项目根目录创建 `.env` 文件
2. 添加以下配置：

```env
WEBSITE_TOKEN=<your_token_here>
```

3. 在 UmiJS 代理配置中添加 Authorization 请求头

详细配置说明请参考：`docs/website-token-guide.md`

## 注意事项

- ✅ Token 已添加到 `.gitignore`，不会被提交到代码仓库
- ✅ Token 有效期为 1 年，过期后需要重新生成
- ✅ Token 使用普通用户权限，只能访问 GET /api/cases 接口
- ⚠️ 不要将包含实际 Token 的文件提交到代码仓库

