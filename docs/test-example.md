# API 测试示例 - 可直接复制使用

## 一、快速测试命令（可直接复制）

### 方法 1：使用生成的 Token

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="$(cd /Users/witee/Code/landport-freight-management-api && node scripts/generate-website-token.mjs 2>&1 | grep -A 1 '^Token:' | tail -1 | tr -d ' ')" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

### 方法 2：使用固定 Token（需要先获取）

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI3NDIxLCJleHAiOjE3OTM5NjM0MjF9.6ToltiOHVgY1tyiAwhJrZpPifFnaPG3lmI3HaUJzTXo" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 二、分步执行（推荐）

### 步骤 1：生成 Token

```bash
cd /Users/witee/Code/landport-freight-management-api
node scripts/generate-website-token.mjs
```

### 步骤 2：复制 Token

从输出中复制 Token 字符串（以 `eyJ` 开头的长字符串）

### 步骤 3：测试接口

```bash
cd /Users/witee/Code/dachengguoji
TOKEN="你的Token here"
echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8"
curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -100
```

## 三、完整测试示例

### 示例 1：获取案例列表（基础）

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI3NDIxLCJleHAiOjE3OTM5NjM0MjF9.6ToltiOHVgY1tyiAwhJrZpPifFnaPG3lmI3HaUJzTXo" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

### 示例 2：带搜索关键词

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI3NDIxLCJleHAiOjE3OTM5NjM0MjF9.6ToltiOHVgY1tyiAwhJrZpPifFnaPG3lmI3HaUJzTXo" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8&keyword=项目" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8&keyword=项目" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

### 示例 3：获取案例详情

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI3NDIxLCJleHAiOjE3OTM5NjM0MjF9.6ToltiOHVgY1tyiAwhJrZpPifFnaPG3lmI3HaUJzTXo" && echo "测试接口: http://127.0.0.1:7001/api/cases/1" && curl -s -X GET "http://127.0.0.1:7001/api/cases/1" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 四、使用测试脚本

### 运行测试脚本

```bash
cd /Users/witee/Code/landport-freight-management-api
./scripts/test-api.sh
```

## 五、预期成功响应

### 成功响应示例

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
        "images": [
          "/uploads/2025-11-06/1/image1.jpg"
        ],
        "createdAt": "2025-11-06T10:00:00.000Z",
        "updatedAt": "2025-11-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 8,
      "total": 100,
      "totalPages": 13
    }
  }
}
```

## 六、注意事项

1. **Token 有效期：** Token 有效期为 1 年，过期后需要重新生成
2. **API 地址：** 确保后端服务正在运行（`http://127.0.0.1:7001`）
3. **Token 格式：** Token 必须以 `Bearer ` 开头（注意 Bearer 后面有空格）
4. **请求头：** 必须包含 `Authorization` 和 `Content-Type` 请求头

## 七、常见错误

### 错误 1: 401 Unauthorized

```json
{
  "code": 401,
  "message": "未登录或令牌无效"
}
```

**原因：** Token 无效或过期

**解决方案：** 重新生成 Token

### 错误 2: 连接失败

**原因：** 后端服务未启动

**解决方案：** 启动后端服务

```bash
cd /Users/witee/Code/landport-freight-management-api
npm run dev
```

## 八、一键测试命令（最新 Token）

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="$(cd /Users/witee/Code/landport-freight-management-api && node scripts/generate-website-token.mjs 2>&1 | grep -A 1 '^Token:' | tail -1 | tr -d ' ')" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

**说明：** 这个命令会自动生成最新的 Token 并测试接口，可以直接复制使用。

