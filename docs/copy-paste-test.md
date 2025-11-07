# 可直接复制的测试命令

## 一键测试命令（自动生成最新 Token）

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="$(cd /Users/witee/Code/landport-freight-management-api && node scripts/generate-website-token.mjs 2>&1 | grep -A 1 '^Token:' | tail -1 | tr -d ' ')" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 使用固定 Token（如果后端已启动）

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI3NzAxLCJleHAiOjE3OTM5NjM3MDF9.b-esNe3JXbuFXhOzpfoMeKHxZqzQhZIFiHM5ric1SJA" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 分步执行（推荐）

### 步骤 1：生成 Token

```bash
cd /Users/witee/Code/landport-freight-management-api
node scripts/generate-website-token.mjs
```

### 步骤 2：复制 Token 并测试

```bash
cd /Users/witee/Code/dachengguoji
TOKEN="你的Token"
echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8"
curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 预期成功响应

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
      "pageSize": 8,
      "total": 100,
      "totalPages": 13
    }
  }
}
```

