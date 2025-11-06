#!/bin/bash
# 测试管理员登录脚本
# 用法: ./scripts/test-admin-login.sh <username> <password>
# 示例: ./scripts/test-admin-login.sh admin admin123

BASE_URL="http://127.0.0.1:7001"
USERNAME=${1:-admin}
PASSWORD=${2:-admin123}

echo "=== 测试管理员登录 ==="
echo "接口地址: ${BASE_URL}/api/admin/auth/login"
echo "用户名: ${USERNAME}"
echo ""

# 发送登录请求
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${USERNAME}\",
    \"password\": \"${PASSWORD}\"
  }")

echo "响应:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 提取 token
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "=== 登录成功！Token 已获取 ==="
  echo "Token: ${TOKEN}"
  echo ""
  echo "=== 使用 Token 访问案例列表接口 ==="
  curl -s -X GET "${BASE_URL}/api/cases" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "请求失败"
else
  echo "=== 登录失败 ==="
fi

