# Token 不可见问题排查指南

## 问题现象

在浏览器开发者工具的 Network 标签中，看不到 `Authorization` 请求头，或者请求地址不正确。

## 可能的原因

### 1. 请求地址缺少 `/landport` 前缀

**现象：**
- 请求 URL：`https://dachengguoji.com.cn/api/cases` ❌
- 正确 URL：`https://dachengguoji.com.cn/landport/api/cases` ✅

**原因：**
- 前端没有使用代理，直接请求了完整 URL
- 或者代理配置不正确

**解决方案：**
- 检查前端是否配置了代理
- 如果使用代理，确保 `target` 包含 `/landport` 前缀
- 如果直接请求，确保 URL 包含 `/landport` 前缀

### 2. 代理配置未正确添加 Authorization 头

**现象：**
- 请求 URL 正确，但没有 `Authorization` 请求头

**原因：**
- 代理配置中没有添加 `Authorization` 头的逻辑
- 环境变量 `WEBSITE_TOKEN` 未设置或读取失败

**解决方案：**
- 检查代理配置是否正确添加了 `Authorization` 头
- 检查 `.env` 文件中是否配置了 `WEBSITE_TOKEN`
- 检查环境变量是否正确读取

### 3. 生产环境直接请求，未使用代理

**现象：**
- 在生产环境（已部署的网站）中，请求直接发送到服务器
- 没有经过开发环境的代理

**原因：**
- 生产环境不会使用开发环境的代理配置
- 需要在服务端（如 Nginx）或前端代码中手动添加 Token

**解决方案：**
- 在生产环境的前端代码中手动添加 `Authorization` 请求头
- 或者在服务端（Nginx）配置中添加 Token

## 排查步骤

### 步骤 1：检查请求 URL

在浏览器开发者工具的 Network 标签中，检查请求的 URL：

- ✅ **正确：** `https://dachengguoji.com.cn/landport/api/cases?page=1&pageSize=8`
- ❌ **错误：** `https://dachengguoji.com.cn/api/cases?page=1&pageSize=8`

如果 URL 错误，说明代理配置有问题或没有使用代理。

### 步骤 2：检查请求头

在 Network 标签中，点击请求，查看 "Headers" 标签，检查是否有 `Authorization` 请求头：

- ✅ **正确：** 应该有 `Authorization: Bearer <token>` 请求头
- ❌ **错误：** 没有 `Authorization` 请求头

### 步骤 3：检查代理配置

如果是在开发环境，检查 `config/config.ts` 中的代理配置：

```typescript
export default {
  proxy: {
    '/api': {
      target: 'https://dachengguoji.com.cn/landport', // 确保包含 /landport
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          // 确保这段代码存在
          const token = process.env.WEBSITE_TOKEN;
          if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          }
        });
      },
    },
  },
};
```

### 步骤 4：检查环境变量

检查项目根目录的 `.env` 文件：

```env
WEBSITE_TOKEN=你的Token在这里
```

**注意：**
- 确保 `.env` 文件存在
- 确保 `WEBSITE_TOKEN` 已设置
- 确保 Token 值正确（没有多余的空格或换行）
- 重启开发服务器（修改 `.env` 后需要重启）

### 步骤 5：检查是否在生产环境

如果是在生产环境（已部署的网站），代理配置不会生效。需要：

1. **在前端代码中手动添加 Token：**

```typescript
// 在服务文件中
import { request } from '@umijs/max';

const TOKEN = process.env.WEBSITE_TOKEN || '你的Token';

export async function getCaseList(params) {
  return request('/landport/api/cases', { // 注意：包含 /landport 前缀
    method: 'GET',
    params,
    headers: {
      'Authorization': `Bearer ${TOKEN}`, // 手动添加 Token
    },
  });
}
```

2. **或者在构建时注入环境变量：**

```bash
# 构建时设置环境变量
WEBSITE_TOKEN=你的Token npm run build
```

## 常见问题

### Q1: 为什么开发环境看不到 Authorization 头？

**A:** 可能的原因：
1. 代理配置不正确
2. 环境变量未设置
3. 开发服务器未重启

**解决方案：**
1. 检查 `config/config.ts` 中的代理配置
2. 检查 `.env` 文件是否存在且格式正确
3. 重启开发服务器

### Q2: 为什么生产环境看不到 Authorization 头？

**A:** 生产环境不会使用开发环境的代理配置，需要在前端代码中手动添加。

**解决方案：**
1. 在前端代码中手动添加 `Authorization` 请求头
2. 或者在服务端（Nginx）配置中添加 Token

### Q3: 如何验证 Token 是否正确添加？

**A:** 使用以下方法验证：

1. **在浏览器开发者工具中检查：**
   - 打开 Network 标签
   - 点击请求，查看 Headers
   - 检查是否有 `Authorization: Bearer <token>` 请求头

2. **使用 curl 测试：**
   ```bash
   curl -X GET "https://dachengguoji.com.cn/landport/api/cases?page=1&pageSize=8" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **检查响应：**
   - 如果返回 401 错误，说明 Token 未添加或无效
   - 如果返回 200 和 JSON 数据，说明 Token 正确

## 正确的配置示例

### 开发环境（使用代理）

```typescript
// config/config.ts
export default {
  proxy: {
    '/api': {
      target: 'https://dachengguoji.com.cn/landport',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          const token = process.env.WEBSITE_TOKEN;
          if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          }
        });
      },
    },
  },
};
```

### 生产环境（手动添加 Token）

```typescript
// src/services/case.ts
import { request } from '@umijs/max';

const TOKEN = process.env.WEBSITE_TOKEN || '你的Token';

export async function getCaseList(params) {
  return request('/landport/api/cases', { // 注意：包含 /landport 前缀
    method: 'GET',
    params,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
}
```

## 快速检查清单

- [ ] 请求 URL 包含 `/landport` 前缀
- [ ] 请求头中有 `Authorization: Bearer <token>`
- [ ] `.env` 文件中配置了 `WEBSITE_TOKEN`
- [ ] 代理配置正确（开发环境）
- [ ] 前端代码中手动添加了 Token（生产环境）
- [ ] 开发服务器已重启（修改配置后）

## 联系支持

如果问题仍未解决，请检查：
1. 后端日志，查看是否收到请求
2. 后端中间件是否正确验证 Token
3. Token 是否过期或无效

