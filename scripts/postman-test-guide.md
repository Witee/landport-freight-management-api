# Postman 测试指南

## 前置准备

### 1. 创建管理员账号

首先需要在数据库中创建管理员账号。运行以下命令生成密码哈希：

```bash
node scripts/create-admin.mjs admin admin123
```

将输出的 SQL 语句在数据库中执行，创建管理员账号。

## Postman 测试步骤

### 步骤 1: 登录获取 Token

#### 请求配置

- **Method**: `POST`
- **URL**: `http://127.0.0.1:7001/api/admin/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (选择 `raw` -> `JSON`):
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

#### 预期响应

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": null,
      "role": "admin"
    }
  }
}
```

#### 保存 Token（推荐）

1. 在 Postman 中，点击右上角的 **Environment** 图标（或按 `Ctrl/Cmd + E`）
2. 创建一个新环境，命名为 `Local Development`
3. 添加变量：
   - **Variable**: `admin_token`
   - **Initial Value**: (留空)
   - **Current Value**: (留空)
4. 在登录接口的 **Tests** 标签页中添加以下脚本，自动保存 token：

```javascript
// 解析响应
const responseJson = pm.response.json();

// 检查登录是否成功
if (responseJson.code === 200 && responseJson.data.token) {
    // 保存 token 到环境变量
    pm.environment.set("admin_token", responseJson.data.token);
    console.log("Token 已保存:", responseJson.data.token);
} else {
    console.log("登录失败:", responseJson.message);
}
```

5. 选择环境为 `Local Development`

### 步骤 2: 获取案例列表

#### 请求配置

- **Method**: `GET`
- **URL**: `http://127.0.0.1:7001/api/cases`
- **Headers**:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- **Params** (可选查询参数):
  - `page`: 1 (页码)
  - `pageSize`: 10 (每页数量)
  - `keyword`: (关键词搜索，可选)
  - `startDate`: 2025-01-01 (开始日期，可选)
  - `endDate`: 2025-01-31 (结束日期，可选)

#### 预期响应

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### 步骤 3: 创建案例（需要管理员权限）

#### 请求配置

- **Method**: `POST`
- **URL**: `http://127.0.0.1:7001/api/cases`
- **Headers**:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- **Body** (选择 `raw` -> `JSON`):
  ```json
  {
    "projectName": "测试项目",
    "date": "2025-01-15",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }
  ```

#### 预期响应

```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "projectName": "测试项目",
    "date": "2025-01-15T00:00:00.000Z",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### 保存案例 ID（可选）

在 **Tests** 标签页中添加脚本，自动保存案例 ID：

```javascript
const responseJson = pm.response.json();
if (responseJson.code === 200 && responseJson.data.id) {
    pm.environment.set("case_id", responseJson.data.id);
    console.log("案例 ID 已保存:", responseJson.data.id);
}
```

### 步骤 4: 获取案例详情

#### 请求配置

- **Method**: `GET`
- **URL**: `http://127.0.0.1:7001/api/cases/{{case_id}}`
  - 或者直接使用数字 ID: `http://127.0.0.1:7001/api/cases/1`
- **Headers**:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`

#### 预期响应

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "projectName": "测试项目",
    "date": "2025-01-15T00:00:00.000Z",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 步骤 5: 更新案例（需要管理员权限）

#### 请求配置

- **Method**: `PUT`
- **URL**: `http://127.0.0.1:7001/api/cases/{{case_id}}`
- **Headers**:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- **Body** (选择 `raw` -> `JSON`):
  ```json
  {
    "projectName": "更新后的项目名称",
    "date": "2025-01-16",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ]
  }
  ```

**注意**: Body 中的所有字段都是可选的，可以只更新部分字段。

#### 预期响应

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "projectName": "更新后的项目名称",
    "date": "2025-01-16T00:00:00.000Z",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:35:00.000Z"
  }
}
```

### 步骤 6: 删除案例（需要管理员权限）

#### 请求配置

- **Method**: `DELETE`
- **URL**: `http://127.0.0.1:7001/api/cases/{{case_id}}`
- **Headers**:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`

#### 预期响应

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

## Postman Collection 配置建议

### 创建 Collection

1. 点击左侧 **New** -> **Collection**
2. 命名为 `案例管理 API`
3. 在 Collection 级别设置环境变量：
   - 右键点击 Collection -> **Edit**
   - 在 **Variables** 标签页添加：
     - `base_url`: `http://127.0.0.1:7001`
     - `admin_token`: (留空，通过登录自动设置)

### 使用 Collection 变量

在请求 URL 中使用：
- `{{base_url}}/api/admin/auth/login`
- `{{base_url}}/api/cases`

### 设置 Collection 级别的 Authorization

1. 右键点击 Collection -> **Edit**
2. 在 **Authorization** 标签页：
   - **Type**: `Bearer Token`
   - **Token**: `{{admin_token}}`
3. 这样所有子请求都会自动使用这个 token（可以在单个请求中覆盖）

## 常见错误处理

### 401 未登录或令牌无效

- **原因**: Token 已过期或无效
- **解决**: 重新调用登录接口获取新 token

### 403 需要管理员权限

- **原因**: 当前用户不是管理员，无法执行增删改操作
- **解决**: 确保登录的用户 role 为 `admin`

### 422 参数验证失败

- **原因**: 请求参数不符合要求
- **检查**:
  - `projectName`: 必填，字符串，最大长度 128
  - `date`: 必填（创建时），日期格式 `YYYY-MM-DD`
  - `images`: 可选，必须是数组

### 404 案例不存在

- **原因**: 案例 ID 不存在
- **解决**: 检查案例 ID 是否正确

## 测试流程建议

1. **登录** -> 获取 token
2. **创建案例** -> 获取案例 ID
3. **获取案例列表** -> 验证创建成功
4. **获取案例详情** -> 验证数据正确
5. **更新案例** -> 验证更新成功
6. **删除案例** -> 验证删除成功
7. **再次获取案例列表** -> 验证案例已删除

## 快速测试脚本（Postman Pre-request Script）

在 Collection 的 **Pre-request Script** 中添加，自动检查 token 是否过期：

```javascript
// 检查 token 是否存在
const token = pm.environment.get("admin_token");
if (!token) {
    console.log("警告: admin_token 未设置，请先登录");
}
```

## 自动化测试（Postman Tests）

在每个请求的 **Tests** 标签页中添加验证：

```javascript
// 验证响应状态码
pm.test("状态码为 200", function () {
    pm.response.to.have.status(200);
});

// 验证响应结构
pm.test("响应包含 code 字段", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('code');
    pm.expect(jsonData.code).to.equal(200);
});
```

