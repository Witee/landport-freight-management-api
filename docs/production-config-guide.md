# 生产环境配置指南

## 重要说明

**生产环境中，开发环境的代理配置不会生效！**

在生产环境中，前端代码已经被构建成静态文件，UmiJS 的 `proxy` 配置不会执行。需要在前端代码中手动添加 Token 和正确的 API 地址。

## 问题现象

在生产环境中，如果看到：
- ❌ 请求 URL：`https://dachengguoji.com.cn/api/cases`（缺少 `/landport` 前缀）
- ❌ 请求头中没有 `Authorization: Bearer <token>`

说明前端代码没有正确配置。

## 解决方案

### 方案一：在服务文件中手动添加 Token（推荐）

#### 1. 创建或修改服务文件

在 `src/services/case.ts` 中：

```typescript
import { request } from '@umijs/max';

// 从环境变量获取 Token（构建时注入）
const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';

// API 基础地址（生产环境）
const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';

// 案例数据类型
export interface Case {
  id: number;
  projectName: string;
  date: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface CaseListResponse {
  code: number;
  message: string;
  data: {
    list: Case[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

// 获取案例列表
export async function getCaseList(params: CaseListParams): Promise<CaseListResponse> {
  return request<CaseListResponse>(`${API_BASE_URL}/api/cases`, { // 注意：包含 /landport 前缀
    method: 'GET',
    params,
    headers: {
      'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 手动添加 Token
      'Content-Type': 'application/json',
    },
  });
}

// 获取案例详情
export async function getCaseDetail(id: number) {
  return request<{
    code: number;
    message: string;
    data: Case;
  }>(`${API_BASE_URL}/api/cases/${id}`, { // 注意：包含 /landport 前缀
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 手动添加 Token
      'Content-Type': 'application/json',
    },
  });
}
```

#### 2. 配置环境变量（构建时注入）

在项目根目录创建 `.env.production` 文件：

```env
# 生产环境配置
WEBSITE_TOKEN=你的Token在这里
API_BASE_URL=https://dachengguoji.com.cn/landport
```

**注意：**
- 不要将 `.env.production` 文件提交到代码仓库
- 将 `.env.production` 添加到 `.gitignore` 中
- Token 会在构建时注入到代码中

#### 3. 构建时注入环境变量

在构建脚本中设置环境变量：

```bash
# 方式一：在构建命令中设置
WEBSITE_TOKEN=你的Token API_BASE_URL=https://dachengguoji.com.cn/landport npm run build

# 方式二：使用 .env.production 文件
# UmiJS 会自动读取 .env.production 文件
npm run build
```

### 方案二：使用 UmiJS 的 request 拦截器

#### 1. 配置 request 拦截器

在 `src/app.ts` 或 `src/app.tsx` 中：

```typescript
import { RequestConfig } from '@umijs/max';

// 从环境变量获取 Token
const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';
const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';

export const request: RequestConfig = {
  // 请求拦截器
  requestInterceptors: [
    (url, options) => {
      // 如果是 API 请求，添加 /landport 前缀和 Token
      if (url.startsWith('/api')) {
        return {
          url: `${API_BASE_URL}${url}`, // 添加完整的基础 URL
          options: {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 添加 Token
              'Content-Type': 'application/json',
            },
          },
        };
      }
      return { url, options };
    },
  ],
};
```

#### 2. 在服务文件中使用

```typescript
// src/services/case.ts
import { request } from '@umijs/max';

// 获取案例列表
export async function getCaseList(params: CaseListParams): Promise<CaseListResponse> {
  return request<CaseListResponse>('/api/cases', { // 使用相对路径，拦截器会自动处理
    method: 'GET',
    params,
  });
}
```

### 方案三：使用 axios 实例（如果使用 axios）

#### 1. 创建 axios 实例

在 `src/utils/request.ts` 中：

```typescript
import axios from 'axios';

const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';
const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL, // 包含 /landport 前缀
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 自动添加 Token
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 确保 Token 存在
    if (WEBSITE_TOKEN) {
      config.headers.Authorization = `Bearer ${WEBSITE_TOKEN}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 2. 在服务文件中使用

```typescript
// src/services/case.ts
import apiClient from '@/utils/request';

// 获取案例列表
export async function getCaseList(params: CaseListParams): Promise<CaseListResponse> {
  return apiClient.get('/api/cases', { params }); // 使用 /api/cases，baseURL 已包含 /landport
}
```

## 环境变量配置

### 开发环境（.env）

```env
# 开发环境配置
WEBSITE_TOKEN=你的Token
API_BASE_URL=https://dev.dachengguoji.com.cn/landport
```

### 生产环境（.env.production）

```env
# 生产环境配置
WEBSITE_TOKEN=你的Token
API_BASE_URL=https://dachengguoji.com.cn/landport
```

## 验证配置

### 1. 检查构建后的代码

构建后，检查 `dist` 目录中的代码，确认：
- API 地址包含 `/landport` 前缀
- Token 已注入到代码中（注意：Token 会暴露在前端代码中，这是正常的）

### 2. 在浏览器中检查

在浏览器开发者工具的 Network 标签中，检查：
- ✅ 请求 URL：`https://dachengguoji.com.cn/landport/api/cases?page=1&pageSize=8`
- ✅ 请求头：`Authorization: Bearer <token>`

### 3. 检查响应

- ✅ 正确：返回 JSON 数据，格式如 `{ "code": 200, "data": {...} }`
- ❌ 错误：返回 401 错误（Token 无效）或 HTML 页面（地址错误）

## 常见问题

### Q1: 为什么生产环境看不到 Token？

**A:** 生产环境中，开发环境的代理配置不会生效。需要在前端代码中手动添加 Token。

### Q2: Token 会暴露在前端代码中吗？

**A:** 是的，Token 会暴露在前端代码中。这是正常的，因为：
- 这个 Token 只有普通用户权限，只能访问 GET `/api/cases` 接口
- 不能访问需要管理员权限的接口
- Token 有效期 1 年，过期后需要重新生成

### Q3: 如何更新 Token？

**A:** 
1. 重新生成 Token：`node scripts/generate-website-token.mjs`
2. 更新 `.env.production` 文件中的 `WEBSITE_TOKEN`
3. 重新构建前端项目：`npm run build`
4. 重新部署

### Q4: 如何确保 Token 安全？

**A:**
1. 不要将 `.env.production` 文件提交到代码仓库
2. 定期更新 Token（建议每年更新一次）
3. 使用环境变量在构建时注入，而不是硬编码在代码中
4. 限制 Token 的权限（当前 Token 只有普通用户权限）

## 完整示例

### 开发环境配置（使用代理）

```typescript
// config/config.ts
export default {
  proxy: {
    '/api': {
      target: 'https://dev.dachengguoji.com.cn/landport',
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

### 生产环境配置（手动添加 Token）

```typescript
// src/services/case.ts
import { request } from '@umijs/max';

const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';
const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';

export async function getCaseList(params: CaseListParams): Promise<CaseListResponse> {
  return request<CaseListResponse>(`${API_BASE_URL}/api/cases`, {
    method: 'GET',
    params,
    headers: {
      'Authorization': `Bearer ${WEBSITE_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}
```

## 快速检查清单

- [ ] 前端代码中 API 地址包含 `/landport` 前缀
- [ ] 前端代码中手动添加了 `Authorization` 请求头
- [ ] `.env.production` 文件中配置了 `WEBSITE_TOKEN`
- [ ] 构建时环境变量已正确注入
- [ ] 浏览器 Network 标签中可以看到 `Authorization` 请求头
- [ ] 请求 URL 包含 `/landport` 前缀

## 更新日志

- 2025-11-06: 初始版本，说明生产环境配置方法

