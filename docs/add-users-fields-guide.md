# 为 users 表添加缺失字段指南

## 问题说明

线上数据库的 `users` 表缺少以下字段：
- `username` - 后台登录用户名
- `password` - 后台登录密码（加密）

这些字段在代码模型中已定义，但数据库表中缺失，需要手动添加。

## 方法一：使用 SQL 脚本（推荐）

### 1. 检查字段是否已存在

在执行脚本前，先检查字段是否已存在：

```sql
-- 查看 users 表结构
DESCRIBE users;

-- 或者查看字段是否存在
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'landport' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('username', 'password');
```

### 2. 执行 SQL 脚本

#### 方式 A：直接执行（如果确定字段不存在）

```bash
# 在宿主机执行
mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /data/landport-freight-management-api/scripts/add-users-fields.sql
```

#### 方式 B：在容器中执行

```bash
# 进入容器
docker exec -it landport-app sh

# 执行 SQL 脚本
mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /code/scripts/add-users-fields.sql
```

#### 方式 C：使用 MySQL 客户端工具

使用 Navicat、phpMyAdmin、DBeaver 等工具连接到数据库，然后执行 `scripts/add-users-fields.sql` 文件中的 SQL 语句。

### 3. 处理错误

如果字段已存在，执行会报错：
```
ERROR 1060 (42S21): Duplicate column name 'username'
```

这是正常的，可以忽略或使用安全版本脚本。

## 方法二：使用安全版本脚本

安全版本脚本会先检查字段是否存在，避免重复添加：

```bash
# 在宿主机执行
mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /data/landport-freight-management-api/scripts/add-users-fields-safe.sql
```

## 方法三：手动执行 SQL

如果不想使用脚本，可以手动执行以下 SQL：

```sql
USE landport;

-- 添加 username 字段
ALTER TABLE `users` 
ADD COLUMN `username` VARCHAR(64) NULL COMMENT '后台登录用户名' AFTER `nickname`;

-- 添加 password 字段
ALTER TABLE `users` 
ADD COLUMN `password` VARCHAR(255) NULL COMMENT '后台登录密码（加密）' AFTER `username`;

-- 为 username 字段添加唯一索引
CREATE UNIQUE INDEX `uk_username` ON `users` (`username`);
```

## 验证

执行完成后，验证字段是否已添加：

```sql
-- 查看 users 表结构
DESCRIBE users;

-- 应该能看到 username 和 password 字段
```

## 注意事项

1. **唯一索引约束：**
   - `username` 字段有唯一索引约束
   - 如果表中已有记录，且多个记录的 `username` 都为 `NULL`，MySQL 允许这种情况（NULL 值不违反唯一约束）
   - 但如果已有非 NULL 的重复值，创建索引会失败

2. **字段位置：**
   - `username` 字段添加在 `nickname` 字段之后
   - `password` 字段添加在 `username` 字段之后
   - 如果需要调整位置，可以修改 SQL 脚本中的 `AFTER` 子句

3. **数据安全：**
   - 添加字段不会影响现有数据
   - 新字段允许为 `NULL`，不会破坏现有记录
   - 建议在执行前备份数据库

4. **索引创建：**
   - 如果 `username` 字段已有数据，创建唯一索引可能需要一些时间
   - 如果表中数据量很大，建议在低峰期执行

## 故障排查

### 问题 1: 字段已存在错误

**错误信息：**
```
ERROR 1060 (42S21): Duplicate column name 'username'
```

**解决方案：**
- 这是正常的，说明字段已存在
- 可以忽略错误，或使用安全版本脚本

### 问题 2: 索引创建失败

**错误信息：**
```
ERROR 1062 (23000): Duplicate entry 'xxx' for key 'uk_username'
```

**解决方案：**
1. 检查是否有重复的 `username` 值：
   ```sql
   SELECT username, COUNT(*) as count 
   FROM users 
   WHERE username IS NOT NULL 
   GROUP BY username 
   HAVING count > 1;
   ```

2. 处理重复值（修改或删除重复记录）

3. 重新创建索引

### 问题 3: 权限不足

**错误信息：**
```
ERROR 1142 (42000): ALTER command denied to user 'xxx'@'xxx'
```

**解决方案：**
- 确保使用的用户有 `ALTER TABLE` 权限
- 使用 `root` 用户或具有足够权限的用户

## 快速执行命令

### 推荐方式（在宿主机执行）

```bash
mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /data/landport-freight-management-api/scripts/add-users-fields.sql
```

### 在容器中执行

```bash
docker exec landport-app sh -c "mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /code/scripts/add-users-fields.sql"
```

## 更新日志

- 2025-11-06: 初始版本，提供添加 users 表缺失字段的 SQL 脚本


