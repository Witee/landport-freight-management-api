# 添加车辆联系电话字段 - 手动执行命令

## 快速执行

```sql
ALTER TABLE vehicles 
ADD COLUMN phone VARCHAR(50) COMMENT '联系电话' 
AFTER userId;
```

## 执行方式

### 方式一：使用 mysql 命令行

```bash
mysql -h <host> -u <user> -p <database> -e "ALTER TABLE vehicles ADD COLUMN phone VARCHAR(50) COMMENT '联系电话' AFTER userId;"
```

**示例：**
```bash
mysql -h 192.168.0.66 -u root -p landport -e "ALTER TABLE vehicles ADD COLUMN phone VARCHAR(50) COMMENT '联系电话' AFTER userId;"
```

### 方式二：在 MySQL 客户端中执行

```sql
-- 1. 连接到数据库
mysql -h <host> -u <user> -p

-- 2. 选择数据库
USE <database>;

-- 3. 执行命令
ALTER TABLE vehicles 
ADD COLUMN phone VARCHAR(50) COMMENT '联系电话' 
AFTER userId;
```

### 方式三：使用 SQL 脚本文件

```bash
mysql -h <host> -u <user> -p <database> < scripts/add-vehicle-phone-field.sql
```

## 验证命令

执行以下 SQL 验证字段是否添加成功：

```sql
-- 查看表结构
DESC vehicles;

-- 或查看字段信息
SHOW COLUMNS FROM vehicles LIKE 'phone';
```

## 字段说明

- **字段名：** `phone`
- **类型：** `VARCHAR(50)`
- **允许为空：** 是（`NULL`）
- **位置：** 在 `userId` 字段之后
- **注释：** 联系电话

## 注意事项

- 如果字段已存在，执行会报错。可以先检查：
  ```sql
  SHOW COLUMNS FROM vehicles LIKE 'phone';
  ```
- 如果字段已存在但位置不对，需要先删除再添加，或使用 `MODIFY` 命令调整位置。

