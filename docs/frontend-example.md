# 前端调用示例 - 完整指南

## 一、获取 Token

### 方法 1：从后端开发者获取

联系后端开发者，获取生成的 Token。Token 通常保存在 `.env.website-token` 文件中。

### 方法 2：后端生成 Token 命令

```bash
# 在后端项目目录执行
node scripts/generate-website-token.mjs
```

输出示例：
```
=== 前端官网服务端 Token ===

Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI2NjQ5LCJleHAiOjE3OTM5NjI2NDl9.cLJ7YWkjZkJPB9rKFnrqGKgvwkh101n8SSCDkdcBDHo
```

## 二、配置 Token

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```env
# 前端官网服务端 Token
WEBSITE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI2NjQ5LCJleHAiOjE3OTM5NjI2NDl9.cLJ7YWkjZkJPB9rKFnrqGKgvwkh101n8SSCDkdcBDHo

# API 基础地址（根据实际环境修改）
API_BASE_URL=https://dev.dachengguoji.com.cn/landport
```

**注意：**
- 不要将 `.env` 文件提交到代码仓库
- 将 `.env` 添加到 `.gitignore` 中

### 2. UmiJS 代理配置

在 `config/config.ts` 或 `config/config.js` 中配置：

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

## 三、API 地址说明

### 基础地址

- **开发环境：** `https://dev.dachengguoji.com.cn/landport`
- **生产环境：** `https://dachengguoji.com.cn/landport`（根据实际部署修改）

### 完整接口地址

- **获取案例列表：** `GET https://dev.dachengguoji.com.cn/landport/api/cases`
- **获取案例详情：** `GET https://dev.dachengguoji.com.cn/landport/api/cases/:id`

### 请求头

所有请求都需要添加以下请求头：

```
Authorization: Bearer <your_token>
Content-Type: application/json
```

## 四、完整调用示例

### 示例 1：使用 UmiJS request（推荐）

#### 1. 创建服务文件 `src/services/case.ts`

```typescript
import { request } from '@umijs/max';

// 案例数据类型
export interface Case {
  id: number;
  projectName: string;
  date: string; // YYYY-MM-DD
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
// 注意：生产环境需要手动添加 Token 和 /landport 前缀
export async function getCaseList(params: CaseListParams): Promise<CaseListResponse> {
  // 从环境变量获取配置（构建时注入）
  const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';
  const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';
  
  // 生产环境：使用完整 URL 并手动添加 Token
  // 开发环境：使用相对路径，代理会自动处理
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return request<CaseListResponse>(`${API_BASE_URL}/api/cases`, {
      method: 'GET',
      params,
      headers: {
        'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 生产环境手动添加 Token
        'Content-Type': 'application/json',
      },
    });
  } else {
    // 开发环境：使用相对路径，代理会自动添加 Token
    return request<CaseListResponse>('/api/cases', {
      method: 'GET',
      params,
    });
  }
}

// 获取案例详情
// 注意：生产环境需要手动添加 Token 和 /landport 前缀
export async function getCaseDetail(id: number) {
  const WEBSITE_TOKEN = process.env.WEBSITE_TOKEN || '';
  const API_BASE_URL = process.env.API_BASE_URL || 'https://dachengguoji.com.cn/landport';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return request<{
      code: number;
      message: string;
      data: Case;
    }>(`${API_BASE_URL}/api/cases/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBSITE_TOKEN}`, // 生产环境手动添加 Token
        'Content-Type': 'application/json',
      },
    });
  } else {
    // 开发环境：使用相对路径，代理会自动添加 Token
    return request<{
      code: number;
      message: string;
      data: Case;
    }>(`/api/cases/${id}`, {
      method: 'GET',
    });
  }
}
```

#### 2. 在组件中使用

```typescript
import React, { useState, useEffect } from 'react';
import { getCaseList, Case } from '@/services/case';

const CaseListPage: React.FC = () => {
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
    <div className="case-list-page">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索项目名称"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>搜索</button>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div className="case-list">
          {cases.map((caseItem) => (
            <div key={caseItem.id} className="case-item">
              <h3>{caseItem.projectName}</h3>
              <p>日期: {caseItem.date}</p>
              <div className="images">
                {caseItem.images && caseItem.images.length > 0 ? (
                  caseItem.images.map((image, index) => (
                    <img
                      key={index}
                      src={getImageUrl(image)}
                      alt={`${caseItem.projectName} - ${index + 1}`}
                      style={{ width: 200, height: 200, objectFit: 'cover', margin: '5px' }}
                    />
                  ))
                ) : (
                  <p>暂无图片</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          上一页
        </button>
        <span>
          第 {pagination.page} 页 / 共 {pagination.totalPages} 页（共 {pagination.total} 条）
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

export default CaseListPage;
```

### 示例 2：使用 fetch API

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

  // 注意：这里使用相对路径，UmiJS 代理会自动转发
  const response = await fetch(`/api/cases?${query.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Token 会在代理层自动添加，这里不需要手动添加
    },
  });

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

### 示例 3：使用 axios

```typescript
import axios from 'axios';

// 配置 axios 实例
const apiClient = axios.create({
  baseURL: '/api', // 使用相对路径，UmiJS 代理会自动转发
  headers: {
    'Content-Type': 'application/json',
    // Token 会在代理层自动添加，这里不需要手动添加
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

## 五、完整请求示例（curl）

### 获取案例列表

```bash
# 设置 Token（替换为实际的 Token）
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI2NjQ5LCJleHAiOjE3OTM5NjI2NDl9.cLJ7YWkjZkJPB9rKFnrqGKgvwkh101n8SSCDkdcBDHo"

# 基础请求
curl -X GET "https://dev.dachengguoji.com.cn/landport/api/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 带分页参数
curl -X GET "https://dev.dachengguoji.com.cn/landport/api/cases?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 带搜索参数
curl -X GET "https://dev.dachengguoji.com.cn/landport/api/cases?page=1&pageSize=10&keyword=项目名称" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 带日期筛选
curl -X GET "https://dev.dachengguoji.com.cn/landport/api/cases?page=1&pageSize=10&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 获取案例详情

```bash
curl -X GET "https://dev.dachengguoji.com.cn/landport/api/cases/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 六、响应格式示例

### 成功响应

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "projectName": "项目A",
        "date": "2025-11-06",
        "images": [
          "/public/uploads/2025-11-06/1/image1.jpg",
          "/public/uploads/2025-11-06/1/image2.jpg"
        ],
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

### 错误响应

```json
{
  "code": 401,
  "message": "未登录或令牌无效"
}
```

## 七、图片地址处理

### 重要提示

接口返回的 `images` 字段是相对路径，需要拼接完整的 URL。

### 图片地址拼接

```typescript
// 方法 1：使用函数
const getImageUrl = (imagePath: string) => {
  const baseUrl = 'https://dev.dachengguoji.com.cn/landport';
  return `${baseUrl}${imagePath}`;
};

// 使用
const fullUrl = getImageUrl('/public/uploads/2025-11-06/1/image1.jpg');
// 结果: https://dev.dachengguoji.com.cn/landport/public/uploads/2025-11-06/1/image1.jpg

// 方法 2：使用环境变量
const API_BASE_URL = process.env.API_BASE_URL || 'https://dev.dachengguoji.com.cn/landport';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

// 方法 3：在组件中直接拼接
<img src={`https://dev.dachengguoji.com.cn/landport${image}`} alt="案例图片" />
```

## 八、常见问题

### 问题 1: 401 Unauthorized

**原因：**
- Token 无效或过期
- Token 未正确添加到请求头

**解决方案：**
1. 检查环境变量 `WEBSITE_TOKEN` 是否正确配置
2. 检查代理配置是否正确添加了 `Authorization` 请求头
3. 重新生成 Token 并更新环境变量

### 问题 2: 404 Not Found

**原因：**
- API 地址不正确
- 代理配置不正确（开发环境）
- 生产环境未正确配置 API 地址

**解决方案：**
1. **开发环境：**
   - 检查 API 基础地址是否正确
   - 检查代理配置中的 `target` 是否正确
   - 检查路径是否正确（应该是 `/api/cases`，代理会自动添加 `/landport` 前缀）

2. **生产环境：**
   - 检查 API 地址是否包含 `/landport` 前缀
   - 确保使用完整 URL：`https://dachengguoji.com.cn/landport/api/cases`
   - 检查环境变量 `API_BASE_URL` 是否正确配置

### 问题 3: 图片无法显示

**原因：**
- 图片地址未正确拼接
- 图片路径不正确

**解决方案：**
1. 确保图片地址拼接了完整的基础 URL
2. 检查图片路径格式：`/public/uploads/...`
3. 完整 URL 格式：`https://dev.dachengguoji.com.cn/landport/public/uploads/...`

### 问题 4: 代理不工作

**原因：**
- UmiJS 代理配置不正确
- 环境变量未正确读取

**解决方案：**
1. 检查 `config/config.ts` 中的代理配置
2. 确保环境变量文件 `.env` 存在且格式正确
3. 重启开发服务器

## 九、快速开始检查清单

- [ ] 获取 Token 并配置到 `.env` 文件
- [ ] 配置 UmiJS 代理，自动添加 Authorization 请求头
- [ ] 创建服务文件 `src/services/case.ts`
- [ ] 在组件中调用接口
- [ ] 处理图片地址拼接
- [ ] 测试接口是否正常工作

## 十、完整项目结构示例

```
frontend-project/
├── .env                    # 环境变量（包含 WEBSITE_TOKEN）
├── .gitignore             # 确保 .env 不被提交
├── config/
│   └── config.ts          # UmiJS 配置（包含代理配置）
├── src/
│   ├── services/
│   │   └── case.ts        # 案例接口服务
│   └── pages/
│       └── case/
│           └── index.tsx  # 案例列表页面
└── package.json
```

## 十一、联系支持

如果遇到问题，请联系后端开发者：
- 检查 Token 是否有效
- 检查 API 地址是否正确
- 查看后端日志排查问题

