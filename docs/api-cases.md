# 案例管理接口文档 (`/api/cases`)

## 接口概览

案例管理接口提供案例的增删改查功能。所有接口都需要认证，创建、更新、删除操作需要管理员权限。

**基础路径：** `/api/cases`

**认证要求：**
- 所有接口都需要 JWT Token（通过 `Authorization: Bearer <token>` 或 `X-Token` 请求头）
- 创建、更新、删除操作需要管理员 Token（通过 `adminAuth` 中间件验证）

---

## 1. 获取案例列表

**接口：** `GET /api/cases`

**权限：** 所有认证用户

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `page` | number | 否 | 页码，最小值为 1，默认 1 | `1` |
| `pageSize` | number | 否 | 每页数量，范围 1-100，默认 10 | `10` |
| `keyword` | string | 否 | 关键词，用于搜索项目名称（模糊匹配） | `"项目A"` |
| `startDate` | string | 否 | 开始日期，格式：YYYY-MM-DD | `"2025-01-01"` |
| `endDate` | string | 否 | 结束日期，格式：YYYY-MM-DD | `"2025-12-31"` |

**请求示例：**
```bash
GET /api/cases?page=1&pageSize=10&keyword=项目名称&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
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
        "images": ["/public/uploads/2025-11-06/1/image1.jpg"],
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

**响应字段说明：**
- `list`: 案例列表数组
  - `id`: 案例ID
  - `projectName`: 项目名称（最大128字符）
  - `date`: 日期（格式：YYYY-MM-DD）
  - `images`: 图片链接地址数组（如果为 null 会自动转为空数组 `[]`）
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间
- `pagination`: 分页信息
  - `page`: 当前页码
  - `pageSize`: 每页数量
  - `total`: 总记录数
  - `totalPages`: 总页数

**排序规则：** 按日期降序，创建时间降序

---

## 2. 获取案例详情

**接口：** `GET /api/cases/:id`

**权限：** 所有认证用户

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 案例ID |

**请求示例：**
```bash
GET /api/cases/1
Authorization: Bearer <token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "projectName": "项目名称",
    "date": "2025-11-06",
    "images": ["/public/uploads/2025-11-06/1/image1.jpg"],
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z"
  }
}
```

**错误响应：**
- `404`: 案例不存在
```json
{
  "code": 404,
  "message": "案例不存在"
}
```

---

## 3. 创建案例

**接口：** `POST /api/cases`

**权限：** 仅管理员

**请求头：**
```
Authorization: Bearer <admin_token>
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `projectName` | string | 是 | 项目名称，最大128字符，不能为空 | `"项目A"` |
| `date` | string | 是 | 日期，格式：YYYY-MM-DD | `"2025-11-06"` |
| `images` | array | 否 | 图片链接地址数组 | `["/public/uploads/..."]` |

**请求示例：**
```bash
POST /api/cases
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "projectName": "项目A",
  "date": "2025-11-06",
  "images": ["/public/uploads/2025-11-06/1/image1.jpg"]
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "projectName": "项目A",
    "date": "2025-11-06",
    "images": ["/public/uploads/2025-11-06/1/image1.jpg"],
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: 需要管理员权限
```json
{
  "code": 403,
  "message": "需要管理员权限"
}
```

- `422`: 参数验证失败
```json
{
  "code": 422,
  "message": "projectName is required"
}
```

---

## 4. 更新案例

**接口：** `PUT /api/cases/:id`

**权限：** 仅管理员

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 案例ID |

**请求头：**
```
Authorization: Bearer <admin_token>
```

**请求体（所有字段都是可选的，只传需要更新的字段）：**

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `projectName` | string | 否 | 项目名称，最大128字符 | `"项目B"` |
| `date` | string | 否 | 日期，格式：YYYY-MM-DD | `"2025-11-07"` |
| `images` | array | 否 | 图片链接地址数组 | `["/public/uploads/..."]` |

**请求示例：**
```bash
PUT /api/cases/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "projectName": "项目B",
  "date": "2025-11-07",
  "images": ["/public/uploads/2025-11-07/1/image2.jpg"]
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "projectName": "项目B",
    "date": "2025-11-07",
    "images": ["/public/uploads/2025-11-07/1/image2.jpg"],
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-07T10:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: 需要管理员权限
- `404`: 案例不存在
- `422`: 参数验证失败

---

## 5. 删除案例

**接口：** `DELETE /api/cases/:id`

**权限：** 仅管理员

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 案例ID |

**请求头：**
```
Authorization: Bearer <admin_token>
```

**请求示例：**
```bash
DELETE /api/cases/1
Authorization: Bearer <admin_token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

**错误响应：**
- `403`: 需要管理员权限
- `404`: 案例不存在

---

## TypeScript 类型定义

```typescript
// 案例数据模型
interface Case {
  id: number;
  projectName: string;
  date: string; // YYYY-MM-DD
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建案例请求
interface CreateCaseRequest {
  projectName: string;
  date: string;
  images?: string[];
}

// 更新案例请求（所有字段可选）
interface UpdateCaseRequest {
  projectName?: string;
  date?: string;
  images?: string[];
}

// 获取案例列表请求参数
interface GetCaseListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// 分页信息
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 获取案例列表响应
interface GetCaseListResponse {
  code: number;
  message: string;
  data: {
    list: Case[];
    pagination: Pagination;
  };
}

// 获取案例详情响应
interface GetCaseDetailResponse {
  code: number;
  message: string;
  data: Case;
}

// 创建/更新案例响应
interface CreateOrUpdateCaseResponse {
  code: number;
  message: string;
  data: Case;
}

// 删除案例响应
interface DeleteCaseResponse {
  code: number;
  message: string;
  data: null;
}
```

---

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取案例列表
async function getCaseList(params: GetCaseListParams) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await fetch(`/api/cases?${query.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// 获取案例详情
async function getCaseDetail(id: number) {
  const response = await fetch(`/api/cases/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// 创建案例
async function createCase(data: CreateCaseRequest) {
  const response = await fetch('/api/cases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// 更新案例
async function updateCase(id: number, data: UpdateCaseRequest) {
  const response = await fetch(`/api/cases/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// 删除案例
async function deleteCase(id: number) {
  const response = await fetch(`/api/cases/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  return response.json();
}
```

---

## 注意事项

1. **认证 Token：**
   - 普通用户使用 JWT Token（通过 `/api/auth/wx-login` 获取）
   - 管理员使用 Admin Token（通过 `/api/admin/auth/login` 获取）

2. **图片地址：**
   - `images` 字段返回的是相对路径，如 `/public/uploads/...`
   - 前端需要拼接完整的域名和路径前缀（如：`https://dev.dachengguoji.com.cn/landport/public/uploads/...`）

3. **日期格式：**
   - 所有日期字段使用 `YYYY-MM-DD` 格式
   - 日期范围筛选时，`startDate` 和 `endDate` 都包含在筛选范围内

4. **搜索功能：**
   - `keyword` 参数会对 `projectName` 进行模糊匹配（LIKE '%keyword%'）
   - 搜索不区分大小写

5. **分页：**
   - 默认每页 10 条记录
   - 最大每页 100 条记录
   - 页码从 1 开始

6. **错误处理：**
   - 所有错误响应都包含 `code` 和 `message` 字段
   - HTTP 状态码与响应体中的 `code` 字段一致

