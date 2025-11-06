# 管理员登录测试指南

## 1. 创建管理员账号

### 方法一：使用脚本生成密码哈希

```bash
node scripts/create-admin.mjs admin admin123
```

脚本会输出：
- 密码哈希值
- SQL 插入语句

将 SQL 语句在数据库中执行即可创建管理员账号。

### 方法二：手动创建

在数据库中执行以下 SQL（将 `admin` 和 `admin123` 替换为你的用户名和密码）：

```sql
-- 生成密码哈希（使用 Node.js）
-- 在 Node.js 中运行: const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));

-- 插入管理员账号（替换 <password_hash> 为上面生成的哈希值）
INSERT INTO users (username, password, role, nickname, openid, createdAt, updatedAt)
VALUES ('admin', '<password_hash>', 'admin', '管理员', CONCAT('admin_', UNIX_TIMESTAMP()), NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  role = 'admin';
```

## 2. 测试登录接口

### 使用 curl 命令

```bash
curl -X POST http://127.0.0.1:7001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 使用测试脚本

```bash
chmod +x scripts/test-admin-login.sh
./scripts/test-admin-login.sh admin admin123
```

### 预期响应

成功响应：
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

## 3. 使用 Token 访问接口

### 获取案例列表

```bash
TOKEN="你的token"
curl -X GET http://127.0.0.1:7001/api/cases \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### 创建案例（需要管理员权限）

```bash
TOKEN="你的token"
curl -X POST http://127.0.0.1:7001/api/cases \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "测试项目",
    "date": "2025-01-15",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }'
```

### 获取案例详情

```bash
TOKEN="你的token"
CASE_ID=1
curl -X GET http://127.0.0.1:7001/api/cases/${CASE_ID} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### 更新案例（需要管理员权限）

```bash
TOKEN="你的token"
CASE_ID=1
curl -X PUT http://127.0.0.1:7001/api/cases/${CASE_ID} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "更新后的项目名称",
    "date": "2025-01-16"
  }'
```

### 删除案例（需要管理员权限）

```bash
TOKEN="你的token"
CASE_ID=1
curl -X DELETE http://127.0.0.1:7001/api/cases/${CASE_ID} \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## 4. 使用 Postman 或类似工具

1. **登录接口**
   - Method: `POST`
   - URL: `http://127.0.0.1:7001/api/admin/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```

2. **访问案例接口**
   - Method: `GET`
   - URL: `http://127.0.0.1:7001/api/cases`
   - Headers: 
     - `Authorization: Bearer <你的token>`
     - `Content-Type: application/json`

## 5. 常见错误

- **401 未登录或令牌无效**: Token 已过期或无效，需要重新登录
- **403 需要管理员权限**: 当前用户不是管理员，无法执行增删改操作
- **404 案例不存在**: 案例 ID 不存在
- **422 参数验证失败**: 请求参数不符合要求

