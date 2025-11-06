#!/bin/bash

# API 测试脚本
# 用法: ./scripts/test-api.sh

# 生成 Token
echo "=== 生成 Token ==="
TOKEN=$(cd /Users/witee/Code/landport-freight-management-api && node scripts/generate-website-token.mjs 2>&1 | grep -A 1 "^Token:" | tail -1 | tr -d ' ')

if [ -z "$TOKEN" ]; then
  echo "错误: Token 生成失败"
  exit 1
fi

echo "Token: $TOKEN"
echo ""

# 测试接口
echo "=== 测试接口 ==="
echo "测试接口: http://127.0.0.1:7001/api/cases?page=1&pageSize=8"

curl -s -X GET "http://127.0.0.1:7001/api/cases?page=1&pageSize=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -100

echo ""
echo ""
echo "=== 测试完成 ==="

