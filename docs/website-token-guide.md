# 前端官网 Token 认证配置指南

## 概述

前端官网需要访问 `/api/cases` 接口获取案例数据，该接口需要 JWT Token 认证。由于官网不需要用户登录，需要在服务端自动添加 Token。

## 解决方案

使用固定的服务端 Token，在 UmiJS 代理层自动添加 `Authorization` 请求头。

## 后端配置

### 1. 生成 Token

运行以下命令生成长期有效的 JWT Token：

```bash
node scripts/generate-website-token.mjs
```

脚本会输出：
- Token 字符串
- 配置信息（用户ID、权限、有效期）
- 使用说明

### 2. Token 配置说明

**Token 参数：**
- **userId**: `0`（固定系统用户 ID，不需要在数据库中存在）
- **role**: `'user'`（普通用户权限，可访问 GET /api/cases）
- **expiresIn**: `'365d'`（1 年有效期）
- **secret**: `'G7xtJPiwG'`（与后端配置一致）

**为什么使用 userId: 0？**
- `requireAuth` 中间件只检查 `ctx.state.user.userId` 是否存在，不验证数据库
- 使用固定 ID 避免依赖数据库中的用户记录
- 简化维护，无需创建和管理系统用户

## 前端配置

### 1. 环境变量配置

在项目根目录创建或编辑 `.env` 文件：

```env
WEBSITE_TOKEN=your_generated_token_here
```

**注意：**
- 不要将 `.env` 文件提交到代码仓库
- 将 `.env` 添加到 `.gitignore` 中

### 2. UmiJS 代理配置

在 `config/config.ts` 或 `config/config.js` 中配置代理：

```typescript
export default {
  proxy: {
    '/api': {
      target: 'https://dev.dachengguoji.com.cn/landport',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      headers: {
        'Authorization': `Bearer ${process.env.WEBSITE_TOKEN}`,
      },
    },
  },
};
```

或者使用函数形式（推荐）：

```typescript
export default {
  proxy: {
    '/api': {
      target: 'https://dev.dachengguoji.com.cn/landport',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
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

### 3. 使用示例

#### 方式一：使用 UmiJS 的 request 方法（推荐）

在 `src/services/case.ts` 中创建服务文件：

```typescript
import { request } from '@umijs/max';

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
  return request<CaseListResponse>('/api/cases', {
    method: 'GET',
    params,
  });
}

// 获取案例详情
export async function getCaseDetail(id: number) {
  return request<{
    code: number;
    message: string;
    data: Case;
  }>(`/api/cases/${id}`, {
    method: 'GET',
  });
}
```

在 React 组件中使用：

```typescript
import React, { useState, useEffect } from 'react';
import { getCaseList, getCaseDetail, Case } from '@/services/case';

const CaseList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [keyword, setKeyword] = useState('');

  // 获取案例列表
  const fetchCases = async (page = 1, searchKeyword = '') => {
    setLoading(true);
    try {
      const response = await getCaseList({
        page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword,
      });
      
      if (response.code === 200) {
        setCases(response.data.list);
        setPagination(response.data.pagination);
      } else {
        console.error('获取案例列表失败:', response.message);
      }
    } catch (error) {
      console.error('请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchCases();
  }, []);

  // 搜索
  const handleSearch = () => {
    fetchCases(1, keyword);
  };

  // 分页
  const handlePageChange = (page: number) => {
    fetchCases(page, keyword);
  };

  // 图片地址拼接（完整 URL）
  const getImageUrl = (imagePath: string) => {
    const baseUrl = 'https://dev.dachengguoji.com.cn/landport';
    return `${baseUrl}${imagePath}`;
  };

  return (
    <div>
      {/* 搜索框 */}
      <div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索项目名称"
        />
        <button onClick={handleSearch}>搜索</button>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          {cases.map((caseItem) => (
            <div key={caseItem.id}>
              <h3>{caseItem.projectName}</h3>
              <p>日期: {caseItem.date}</p>
              <div>
                {caseItem.images.map((image, index) => (
                  <img
                    key={index}
                    src={getImageUrl(image)}
                    alt={`${caseItem.projectName} - ${index + 1}`}
                    style={{ width: 200, height: 200, objectFit: 'cover' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      <div>
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          上一页
        </button>
        <span>
          第 {pagination.page} 页 / 共 {pagination.totalPages} 页
        </span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default CaseList;
```

#### 方式二：使用 fetch API

```typescript
// 获取案例列表
async function getCaseList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await fetch(`/api/cases?${query.toString()}`);
  const data = await response.json();
  
  if (data.code === 200) {
    return data.data;
  } else {
    throw new Error(data.message || '获取案例列表失败');
  }
}

// 使用示例
try {
  const result = await getCaseList({
    page: 1,
    pageSize: 10,
    keyword: '项目名称',
  });
  console.log('案例列表:', result.list);
  console.log('分页信息:', result.pagination);
} catch (error) {
  console.error('错误:', error);
}
```

#### 方式三：使用 axios

```typescript
import axios from 'axios';

// 配置 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 获取案例列表
export async function getCaseList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get('/cases', { params });
  return response.data;
}

// 使用示例
const result = await getCaseList({
  page: 1,
  pageSize: 10,
  keyword: '项目名称',
});
```

#### 完整示例：带日期筛选的案例列表

```typescript
import React, { useState, useEffect } from 'react';
import { getCaseList, Case } from '@/services/case';

const CaseListWithFilter: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10,
  });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await getCaseList(filters);
      if (response.code === 200) {
        setCases(response.data.list);
      }
    } catch (error) {
      console.error('获取案例失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filters.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleSearch = () => {
    fetchCases();
  };

  return (
    <div>
      {/* 筛选条件 */}
      <div>
        <input
          type="text"
          placeholder="搜索项目名称"
          value={filters.keyword}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
        />
        <input
          type="date"
          placeholder="开始日期"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
        />
        <input
          type="date"
          placeholder="结束日期"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
        />
        <button onClick={handleSearch}>搜索</button>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          {cases.map((caseItem) => (
            <div key={caseItem.id}>
              <h3>{caseItem.projectName}</h3>
              <p>日期: {caseItem.date}</p>
              <div>
                {caseItem.images.map((image, index) => (
                  <img
                    key={index}
                    src={`https://dev.dachengguoji.com.cn/landport${image}`}
                    alt={`${caseItem.projectName} - ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseListWithFilter;
```

## 接口说明

### GET /api/cases

**权限要求：** 普通用户权限（通过 JWT Token 认证）

**请求参数：**
- `page` (number, 可选): 页码，默认 1
- `pageSize` (number, 可选): 每页数量，默认 10，最大 100
- `keyword` (string, 可选): 关键词，用于搜索项目名称（模糊匹配）
- `startDate` (string, 可选): 开始日期，格式：YYYY-MM-DD
- `endDate` (string, 可选): 结束日期，格式：YYYY-MM-DD

**请求示例：**
```bash
GET /api/cases?page=1&pageSize=10&keyword=项目名称&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <your_token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "projectName": "项目名称",
        "date": "2025-11-06",
        "images": ["/uploads/2025-11-06/1/image1.jpg"],
        "createdAt": "2025-11-06T10:00:00.000Z",
        "updatedAt": "2025-11-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## 注意事项

1. **Token 安全：**
   - Token 不要提交到代码仓库
   - 使用环境变量存储 Token
   - 定期更新 Token（建议每年更新一次）

2. **Token 有效期：**
   - 当前 Token 有效期为 1 年
   - 过期后需要重新生成 Token
   - 建议在 Token 过期前提前更新

3. **权限说明：**
   - 该 Token 只有普通用户权限，只能访问 GET `/api/cases` 接口
   - 不能访问需要管理员权限的接口（如 POST、PUT、DELETE `/api/cases`）

4. **图片地址：**
   - `images` 字段返回的是相对路径，如 `/uploads/...`
   - 前端需要拼接完整的域名和路径前缀
   - 完整 URL 格式：`https://dev.dachengguoji.com.cn/uploads/...`

5. **错误处理：**
   - 如果 Token 无效或过期，接口会返回 401 错误
   - 需要重新生成 Token 并更新环境变量

## 故障排查

### 问题 1: 401 Unauthorized

**原因：**
- Token 无效或过期
- Token 未正确添加到请求头

**解决方案：**
1. 检查环境变量 `WEBSITE_TOKEN` 是否正确配置
2. 检查代理配置是否正确添加了 `Authorization` 请求头
3. 重新生成 Token 并更新环境变量

### 问题 2: Token 过期

**原因：**
- Token 有效期已过（1 年）

**解决方案：**
1. 运行 `node scripts/generate-website-token.mjs` 重新生成 Token
2. 更新环境变量中的 Token
3. 重启前端应用

### 问题 3: 无法访问接口

**原因：**
- 代理配置不正确
- 后端服务不可用

**解决方案：**
1. 检查代理配置中的 `target` 是否正确
2. 检查后端服务是否正常运行
3. 检查网络连接

## 更新日志

- 2025-11-06: 初始版本，支持生成长期有效的服务端 Token

