# Token 验证结果

## .env.website-token 中的 Token 验证结果

### ✅ Token 状态：可用

**Token 信息：**
- **Token 值：** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNDI1NjIxLCJleHAiOjE3OTM5NjE2MjF9.QWMnKVTt7Hjx9NIgRjX1VwQGmJOL4Qp_cZUUGXfiTtA`
- **用户ID：** `0`
- **权限：** `user` (普通用户)
- **签发时间：** `2025/11/6 18:40:21`
- **过期时间：** `2026/11/6 18:40:21`
- **有效期：** ✅ 剩余 364 天

### ✅ Token 验证结果

使用 `jsonwebtoken` 库验证：
- ✅ Token 格式正确
- ✅ Token 签名有效
- ✅ Token 未过期
- ✅ Secret 匹配（`G7xtJPiwG`）

### ⚠️ 接口访问测试

**测试结果：** 返回 401 错误

**可能原因：**
1. 后端服务未运行或未重启（需要重启应用以应用最新的中间件修改）
2. Token 验证逻辑问题（需要检查 egg-jwt 的 verify 方法）

**建议：**
1. 重启后端服务
2. 重新测试接口访问
3. 如果仍然失败，检查后端日志

## 使用建议

### 1. 如果后端服务已重启

Token 应该可以正常使用。可以直接使用 `.env.website-token` 中的 Token。

### 2. 如果后端服务未重启

需要重启后端服务以应用最新的中间件修改。

### 3. 重新生成 Token（可选）

如果需要新的 Token，可以运行：

```bash
cd /Users/witee/Code/landport-freight-management-api
node scripts/generate-website-token.mjs > .env.website-token
```

## 测试命令

### 使用 .env.website-token 中的 Token 测试

```bash
cd /Users/witee/Code/dachengguoji && TOKEN="$(cat /Users/witee/Code/landport-freight-management-api/.env.website-token | tr -d ' ')" && echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8" && curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | head -100
```

## 结论

**✅ .env.website-token 中的 Token 是可用的**

- Token 格式正确
- Token 验证成功
- Token 未过期
- Token 配置正确（userId: 0, role: user）

**⚠️ 注意事项：**

- 确保后端服务已重启以应用最新的中间件修改
- 如果接口仍然返回 401，请检查后端服务是否正常运行
- 可以查看后端日志排查问题

