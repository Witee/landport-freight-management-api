# 车队管理模块数据库表部署命令

## 快速部署

### 方式一：使用 mysql 命令行（推荐）

```bash
# 替换以下变量为实际值：
# - <host>: 数据库主机地址
# - <user>: 数据库用户名
# - <database>: 数据库名称

mysql -h <host> -u <user> -p <database> < scripts/deploy-fleet-tables.sql
```

**示例：**
```bash
mysql -h 192.168.0.66 -u root -p landport < scripts/deploy-fleet-tables.sql
```

### 方式二：在 MySQL 客户端中执行

```sql
-- 1. 连接到数据库
mysql -h <host> -u <user> -p

-- 2. 选择数据库
USE <database>;

-- 3. 执行脚本
source /path/to/scripts/deploy-fleet-tables.sql;
```

### 方式三：复制 SQL 内容执行

直接复制 `scripts/deploy-fleet-tables.sql` 文件中的所有 SQL 语句，在 MySQL 客户端中执行。

## 验证命令

执行以下 SQL 验证表是否创建成功：

```sql
-- 查看表
SHOW TABLES LIKE 'vehicles';
SHOW TABLES LIKE 'transport_records';
SHOW TABLES LIKE 'certificate_share_tokens';

-- 查看表结构
DESC vehicles;
DESC transport_records;
DESC certificate_share_tokens;
```

## 需要创建的表

1. **vehicles** - 车辆信息表
2. **transport_records** - 货运记录表（包含 `isReconciled` 字段）
3. **certificate_share_tokens** - 证件分享 Token 表

## 注意事项

- 脚本使用 `CREATE TABLE IF NOT EXISTS`，如果表已存在不会报错
- 如果表已存在但缺少 `isReconciled` 字段，请执行：`scripts/add-reconciled-field.sql`
- 所有表使用 `utf8mb4` 字符集和 `InnoDB` 存储引擎

## 详细文档

更多信息请参考：`docs/deploy-fleet-tables-guide.md`

