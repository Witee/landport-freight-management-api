#!/bin/bash
# 创建测试数据库脚本
# 使用方法：bash scripts/create-test-db.sh

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}正在创建测试数据库...${NC}"

# 检查 MySQL 是否可用
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}错误: 未找到 mysql 命令，请确保 MySQL 已安装并在 PATH 中${NC}"
    exit 1
fi

# 读取数据库密码（如果未设置环境变量，会提示输入）
if [ -z "$MYSQL_PASSWORD" ]; then
    echo -e "${YELLOW}请输入 MySQL root 密码:${NC}"
    read -s MYSQL_PASSWORD
    export MYSQL_PASSWORD
fi

# 执行 SQL 脚本
mysql -u root -p"$MYSQL_PASSWORD" <<EOF
-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS \`landport_test\`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 显示创建的数据库信息
SHOW CREATE DATABASE \`landport_test\`;

-- 显示数据库列表（确认创建成功）
SHOW DATABASES LIKE 'landport_test';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 测试数据库创建成功！${NC}"
    echo -e "${GREEN}数据库名称: landport_test${NC}"
    echo -e "${GREEN}字符集: utf8mb4${NC}"
    echo -e "${GREEN}排序规则: utf8mb4_unicode_ci${NC}"
    echo ""
    echo -e "${YELLOW}提示: 如果使用专门的测试用户，请取消注释 scripts/create-test-db.sql 中的用户创建部分${NC}"
else
    echo -e "${YELLOW}错误: 数据库创建失败，请检查 MySQL 连接和权限${NC}"
    exit 1
fi

