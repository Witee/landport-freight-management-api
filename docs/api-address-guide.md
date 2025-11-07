# API 地址配置指南

## 重要说明

**正确的 API 地址格式：** `/landport/api/cases`

**错误的 API 地址格式：** `/api/cases` ❌

## 为什么需要 `/landport` 前缀？

应用部署在 `/landport` 路径下，这是通过 Nginx 或其他反向代理配置的路径前缀。所有 API 请求都需要包含这个前缀。

## 正确的 API 地址

### 生产环境

- **基础地址：** `https://dachengguoji.com.cn/landport`
- **获取案例列表：** `GET https://dachengguoji.com.cn/landport/api/cases`
- **获取案例详情：** `GET https://dachengguoji.com.cn/landport/api/cases/:id`

### 开发环境

- **基础地址：** `https://dev.dachengguoji.com.cn/landport`
- **获取案例列表：** `GET https://dev.dachengguoji.com.cn/landport/api/cases`
- **获取案例详情：** `GET https://dev.dachengguoji.com.cn/landport/api/cases/:id`

## 前端配置

### 方式一：使用代理（推荐）

在 `config/config.ts` 中配置：

```typescript
export default {
  proxy: {
    '/api': {
      target: 'https://dachengguoji.com.cn/landport', // 注意：包含 /landport 前缀
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' }, // 注意：target 已包含 /landport，pathRewrite 保持 /api 不变
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          // 自动添加 Authorization 请求头
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

**说明：**
- 前端请求：`/api/cases`
- 代理转发到：`https://dachengguoji.com.cn/landport/api/cases`
- 工作原理：`target` + `pathRewrite结果` = `https://dachengguoji.com.cn/landport` + `/api/cases`
- 因为 `target` 已包含 `/landport`，所以 `pathRewrite` 保持 `/api` 不变

### 方式二：直接使用完整地址

如果不想使用代理，可以直接使用完整地址：

```typescript
// 在服务文件中
const API_BASE_URL = 'https://dachengguoji.com.cn/landport';

export async function getCaseList(params) {
  return request(`${API_BASE_URL}/api/cases`, {
    method: 'GET',
    params,
    headers: {
      'Authorization': `Bearer ${process.env.WEBSITE_TOKEN}`,
    },
  });
}
```

## 常见错误

### 错误 1: 缺少 `/landport` 前缀

**错误配置 1：target 缺少 /landport**
```typescript
proxy: {
  '/api': {
    target: 'https://dachengguoji.com.cn', // ❌ 缺少 /landport
    pathRewrite: { '^/api': '/api' }, // ❌ 没有添加 /landport 前缀
  },
}
```

**结果：** 请求会被转发到 `https://dachengguoji.com.cn/api/cases`，返回 HTML 页面而不是 JSON 数据。

**错误配置 2：pathRewrite 重复添加 /landport**
```typescript
proxy: {
  '/api': {
    target: 'https://dachengguoji.com.cn/landport', // ✅ 包含 /landport
    pathRewrite: { '^/api': '/landport/api' }, // ❌ 重复添加 /landport，会导致 /landport/landport/api
  },
}
```

**结果：** 请求会被转发到 `https://dachengguoji.com.cn/landport/landport/api/cases`，路径错误。

**正确配置：**
```typescript
proxy: {
  '/api': {
    target: 'https://dachengguoji.com.cn/landport', // ✅ 包含 /landport
    pathRewrite: { '^/api': '/api' }, // ✅ 保持 /api 不变（因为 target 已包含 /landport）
  },
}
```

**或者（如果 target 不包含 /landport）：**
```typescript
proxy: {
  '/api': {
    target: 'https://dachengguoji.com.cn', // ✅ 不包含 /landport
    pathRewrite: { '^/api': '/landport/api' }, // ✅ 在 pathRewrite 中添加 /landport
  },
}
```

### 错误 2: pathRewrite 配置错误

**错误配置（target 已包含 /landport 时）：**
```typescript
target: 'https://dachengguoji.com.cn/landport',
pathRewrite: { '^/api': '/landport/api' } // ❌ 重复添加 /landport，会导致 /landport/landport/api
```

**正确配置（target 已包含 /landport）：**
```typescript
target: 'https://dachengguoji.com.cn/landport',
pathRewrite: { '^/api': '/api' } // ✅ 保持 /api 不变
```

**或者（target 不包含 /landport）：**
```typescript
target: 'https://dachengguoji.com.cn',
pathRewrite: { '^/api': '/landport/api' } // ✅ 在 pathRewrite 中添加 /landport
```

### 错误 3: 直接请求缺少前缀

**错误：**
```typescript
request('/api/cases') // ❌ 缺少 /landport 前缀
```

**正确：**
```typescript
request('/landport/api/cases') // ✅ 包含 /landport 前缀
```

或者使用代理配置，前端仍然使用 `/api/cases`，但代理会正确转发。

## 验证配置

### 1. 检查请求地址

在浏览器开发者工具的 Network 标签中，检查实际请求的 URL：

- ✅ **正确：** `https://dachengguoji.com.cn/landport/api/cases?page=1&pageSize=8`
- ❌ **错误：** `https://dachengguoji.com.cn/api/cases?page=1&pageSize=8`

### 2. 检查响应内容

- ✅ **正确：** 返回 JSON 数据，格式如 `{ "code": 200, "data": {...} }`
- ❌ **错误：** 返回 HTML 页面（通常是首页的 HTML）

### 3. 使用 curl 测试

```bash
# 正确的地址
curl -X GET "https://dachengguoji.com.cn/landport/api/cases?page=1&pageSize=8" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 错误的地址（会返回 HTML）
curl -X GET "https://dachengguoji.com.cn/api/cases?page=1&pageSize=8" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 完整配置示例

### UmiJS 配置（推荐）

```typescript
// config/config.ts
export default {
  proxy: {
    '/api': {
      target: process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' }, // target 已包含 /landport，pathRewrite 保持 /api 不变
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

### 环境变量配置

```env
# .env
WEBSITE_TOKEN=your_token_here
API_BASE_URL=https://dachengguoji.com.cn/landport
```

## 总结

1. **所有 API 请求必须包含 `/landport` 前缀**
2. **正确的完整地址格式：** `https://域名/landport/api/接口路径`
3. **使用代理时，确保 `pathRewrite` 正确添加 `/landport` 前缀**
4. **验证时检查实际请求 URL 和响应内容类型**

## 更新日志

- 2025-11-06: 初始版本，明确 API 地址必须包含 `/landport` 前缀

