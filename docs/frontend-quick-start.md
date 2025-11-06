# 前端快速开始指南

## 一、API 地址

### 基础地址
```
https://dev.dachengguoji.com.cn/landport
```

### 完整接口地址
- **获取案例列表：** `GET https://dev.dachengguoji.com.cn/landport/api/cases`
- **获取案例详情：** `GET https://dev.dachengguoji.com.cn/landport/api/cases/:id`

## 二、配置 Token

### 1. 获取 Token

联系后端开发者获取 Token，或运行以下命令生成：

```bash
node scripts/generate-website-token.mjs
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
WEBSITE_TOKEN=你的Token在这里
```

**示例：**
```env
WEBSITE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI2NjQ5LCJleHAiOjE3OTM5NjI2NDl9.cLJ7YWkjZkJPB9rKFnrqGKgvwkh101n8SSCDkdcBDHo
```

### 3. 配置 UmiJS 代理

在 `config/config.ts` 中配置：

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

## 三、调用示例

### 示例 1：使用 UmiJS request（推荐）

#### 创建服务文件 `src/services/case.ts`

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

// 获取案例列表
export async function getCaseList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<{
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
  }>('/api/cases', {
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

#### 在组件中使用

```typescript
import React, { useState, useEffect } from 'react';
import { getCaseList, Case } from '@/services/case';

const CaseList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await getCaseList({
          page: 1,
          pageSize: 10,
        });
        
        if (response.code === 200) {
          setCases(response.data.list);
        }
      } catch (error) {
        console.error('获取案例失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // 图片地址拼接
  const getImageUrl = (imagePath: string) => {
    return `https://dev.dachengguoji.com.cn/landport${imagePath}`;
  };

  return (
    <div>
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          {cases.map((caseItem) => (
            <div key={caseItem.id}>
              <h3>{caseItem.projectName}</h3>
              <p>日期: {caseItem.date}</p>
              <div>
                {caseItem.images?.map((image, index) => (
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
    </div>
  );
};

export default CaseList;
```

### 示例 2：使用 fetch API

```typescript
// 获取案例列表
async function getCaseList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.keyword) query.append('keyword', params.keyword);

  // 使用相对路径，UmiJS 代理会自动转发并添加 Token
  const response = await fetch(`/api/cases?${query.toString()}`);
  const data = await response.json();
  
  if (data.code === 200) {
    return data.data;
  } else {
    throw new Error(data.message || '获取案例列表失败');
  }
}

// 使用
const result = await getCaseList({ page: 1, pageSize: 10 });
console.log('案例列表:', result.list);
```

### 示例 3：直接使用完整 URL（不推荐，仅用于测试）

```typescript
// 注意：这种方式需要手动添加 Token，不推荐在生产环境使用
const TOKEN = '你的Token';

async function getCaseList() {
  const response = await fetch(
    'https://dev.dachengguoji.com.cn/landport/api/cases?page=1&pageSize=10',
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  return data;
}
```

## 四、请求参数说明

### GET /api/cases 参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 | `1` |
| `pageSize` | number | 否 | 每页数量，默认 10，最大 100 | `10` |
| `keyword` | string | 否 | 搜索关键词（项目名称） | `"项目A"` |
| `startDate` | string | 否 | 开始日期，格式：YYYY-MM-DD | `"2025-01-01"` |
| `endDate` | string | 否 | 结束日期，格式：YYYY-MM-DD | `"2025-12-31"` |

### 请求示例

```typescript
// 基础请求
getCaseList({ page: 1, pageSize: 10 })

// 带搜索
getCaseList({ page: 1, pageSize: 10, keyword: '项目名称' })

// 带日期筛选
getCaseList({ 
  page: 1, 
  pageSize: 10, 
  startDate: '2025-01-01', 
  endDate: '2025-12-31' 
})
```

## 五、响应格式

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
          "/public/uploads/2025-11-06/1/image1.jpg"
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

## 六、图片地址处理

### 重要提示

接口返回的 `images` 字段是**相对路径**，需要拼接完整的 URL。

### 拼接方式

```typescript
// 方法 1：使用函数
const getImageUrl = (imagePath: string) => {
  return `https://dev.dachengguoji.com.cn/landport${imagePath}`;
};

// 使用
const fullUrl = getImageUrl('/public/uploads/2025-11-06/1/image1.jpg');
// 结果: https://dev.dachengguoji.com.cn/landport/public/uploads/2025-11-06/1/image1.jpg

// 方法 2：在组件中直接拼接
<img src={`https://dev.dachengguoji.com.cn/landport${image}`} alt="案例图片" />
```

## 七、完整示例代码

### 完整的案例列表页面

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

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSearch = () => {
    fetchCases(1, keyword);
  };

  const handlePageChange = (page: number) => {
    fetchCases(page, keyword);
  };

  // 图片地址拼接
  const getImageUrl = (imagePath: string) => {
    return `https://dev.dachengguoji.com.cn/landport${imagePath}`;
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
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

export default CaseListPage;
```

## 八、常见问题

### Q1: 401 错误怎么办？

**A:** 检查以下几点：
1. Token 是否正确配置在 `.env` 文件中
2. UmiJS 代理配置是否正确添加了 Authorization 请求头
3. Token 是否过期（有效期 1 年）

### Q2: 图片无法显示？

**A:** 确保图片地址拼接了完整的基础 URL：
```typescript
const fullUrl = `https://dev.dachengguoji.com.cn/landport${imagePath}`;
```

### Q3: 代理不工作？

**A:** 
1. 检查 `config/config.ts` 中的代理配置
2. 确保 `.env` 文件存在且格式正确
3. 重启开发服务器

## 九、快速检查清单

- [ ] 获取 Token 并配置到 `.env` 文件
- [ ] 配置 UmiJS 代理，自动添加 Authorization 请求头
- [ ] 创建服务文件 `src/services/case.ts`
- [ ] 在组件中调用接口
- [ ] 处理图片地址拼接（相对路径 → 完整 URL）
- [ ] 测试接口是否正常工作

## 十、联系方式

如有问题，请联系后端开发者获取帮助。

