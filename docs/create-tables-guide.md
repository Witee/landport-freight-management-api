# 线上环境创建数据表指南

## 概述

本文档说明如何在线上环境创建数据库表。项目使用 Sequelize ORM，但在生产环境中不会自动同步表结构，需要手动创建。

## 方法一：使用 SQL 脚本（推荐）

### 1. 准备 SQL 脚本

项目已提供 SQL 脚本：`scripts/create-tables.sql`

### 2. 在 MySQL 中执行

#### 方式 A：通过 MySQL 命令行

```bash
# 连接到 MySQL
mysql -h 172.17.0.1 -P 3306 -u root -p

# 执行 SQL 脚本
source /data/landport-freight-management-api/scripts/create-tables.sql

# 或者直接执行
mysql -h 172.17.0.1 -P 3306 -u root -p landport < /data/landport-freight-management-api/scripts/create-tables.sql
```

#### 方式 B：在 Docker 容器中执行

```bash
# 进入容器
docker exec -it landport-app sh

# 在容器中执行 SQL 脚本
mysql -h 172.17.0.1 -P 3306 -u root -p landport < /code/scripts/create-tables.sql
```

#### 方式 C：通过 MySQL 客户端工具

使用 Navicat、phpMyAdmin、DBeaver 等工具连接到数据库，然后执行 `scripts/create-tables.sql` 文件中的 SQL 语句。

### 3. 验证表是否创建成功

```sql
-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESCRIBE cases;
DESCRIBE users;
DESCRIBE goods;
```

## 方法二：使用 Node.js 脚本

### 1. 准备环境变量

在 Docker 容器中，环境变量已经设置好了：
- `MYSQL_HOST=172.17.0.1`
- `MYSQL_PORT=3306`（或通过环境变量设置）
- `MYSQL_DB=landport`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=Admin123.`

### 2. 在容器中执行脚本

```bash
# 进入容器
docker exec -it landport-app sh

# 进入项目目录
cd /code

# 执行同步脚本
node scripts/sync-tables.mjs
```

### 3. 或者从宿主机执行（通过 Docker）

```bash
# 在宿主机执行
docker exec landport-app sh -c "cd /code && node scripts/sync-tables.mjs"
```

### 4. 自定义环境变量

如果需要使用不同的数据库配置：

```bash
docker exec -it landport-app sh -c "cd /code && MYSQL_HOST=172.17.0.1 MYSQL_PORT=3306 MYSQL_DB=landport MYSQL_USER=root MYSQL_PASSWORD='Admin123.' node scripts/sync-tables.mjs"
```

## 方法三：在部署脚本中自动创建

### 修改部署脚本

在 `scripts/deploy.sh` 中添加表创建步骤：

```bash
# 在启动容器后，添加表创建步骤
echo "5. 创建数据库表..."
docker exec landport-app sh -c "cd /code && node scripts/sync-tables.mjs" || {
  echo "⚠️  表创建失败，请手动执行 SQL 脚本"
}
```

## 表结构说明

### cases 表（案例表）

- `id`: 主键ID
- `projectName`: 项目名称
- `date`: 日期
- `images`: 图片链接地址数组（JSON）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### users 表（用户表）

- `id`: 主键ID
- `openid`: 微信openid（唯一）
- `nickname`: 用户昵称
- `username`: 后台登录用户名（唯一，可为空）
- `password`: 后台登录密码（加密，可为空）
- `avatar`: 头像URL
- `phone`: 手机号
- `role`: 用户角色（admin/user）
- `lastLoginAt`: 最后登录时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### goods 表（货物表）

- `id`: 主键ID
- `name`: 货物名称
- `waybillNo`: 运单号码
- `receiverName`: 收件人姓名
- `receiverPhone`: 收件人电话
- `senderName`: 发件人姓名
- `senderPhone`: 发件人电话
- `volume`: 体积(m³)
- `weight`: 重量(kg)
- `freight`: 运费(¥)
- `status`: 运输状态（collected/transporting/delivered/cancelled/exception）
- `remark`: 备注
- `images`: 货物图片（JSON）
- `createdBy`: 创建人ID（外键关联 users 表）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## 故障排查

### 问题 1: 表已存在错误

**错误信息：**
```
Table 'landport.cases' already exists
```

**解决方案：**
- SQL 脚本使用了 `CREATE TABLE IF NOT EXISTS`，不会报错
- Node.js 脚本使用了 `sync({ alter: false, force: false })`，不会覆盖已有表
- 如果表已存在但结构不同，需要手动修改或使用 `ALTER TABLE`

### 问题 2: 外键约束错误

**错误信息：**
```
Cannot add foreign key constraint
```

**解决方案：**
- 确保先创建 `users` 表，再创建 `goods` 表
- SQL 脚本已按正确顺序创建表
- Node.js 脚本也会按顺序同步表

### 问题 3: 数据库连接失败

**错误信息：**
```
Access denied for user 'root'@'172.17.0.1'
```

**解决方案：**
1. 检查数据库连接配置
2. 确认 MySQL 允许从容器 IP 连接
3. 检查用户名和密码是否正确
4. 确认数据库 `landport` 已创建

### 问题 4: 字符集问题

**错误信息：**
```
Incorrect string value
```

**解决方案：**
- SQL 脚本已设置 `CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
- 确保 MySQL 支持 utf8mb4 字符集

## 注意事项

1. **数据安全：**
   - 在生产环境执行前，建议先备份数据库
   - `CREATE TABLE IF NOT EXISTS` 不会覆盖已有表，相对安全
   - Node.js 脚本使用 `force: false`，不会删除已有数据

2. **表顺序：**
   - 必须先创建 `users` 表，再创建 `goods` 表（因为外键依赖）
   - `cases` 表独立，可以任意顺序创建

3. **权限要求：**
   - 执行脚本的用户需要有 `CREATE TABLE` 权限
   - 需要有 `ALTER TABLE` 权限（如果使用 `alter: true`）

4. **环境变量：**
   - 确保环境变量正确设置
   - 密码中包含特殊字符时，注意引号转义

## 快速执行命令

### 使用 SQL 脚本（推荐）

```bash
# 在宿主机执行
mysql -h 172.17.0.1 -P 3306 -u root -p'Admin123.' landport < /data/landport-freight-management-api/scripts/create-tables.sql
```

### 使用 Node.js 脚本

```bash
# 在容器中执行
docker exec landport-app sh -c "cd /code && node scripts/sync-tables.mjs"
```

## 更新日志

- 2025-11-06: 初始版本，提供 SQL 脚本和 Node.js 脚本两种方式创建数据表


