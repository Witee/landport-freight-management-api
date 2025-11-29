# 车队管理模块数据库表部署指南

## 一、概述

本文档提供车队管理模块数据库表的创建脚本和使用说明，用于线上部署时手动创建表结构。

## 二、需要创建的表

车队管理模块包含以下三个表：

1. **vehicles** - 车辆信息表
2. **transport_records** - 货运记录表
3. **certificate_share_tokens** - 证件分享 Token 表

## 三、部署步骤

### 步骤 1：准备数据库连接信息

确认以下信息：
- 数据库主机地址
- 数据库名称
- 数据库用户名和密码
- 数据库端口（默认 3306）

### 步骤 2：执行 SQL 脚本

#### 方式一：使用 mysql 命令行工具

```bash
# 连接到数据库并执行脚本
mysql -h <数据库主机> -u <用户名> -p <数据库名> < scripts/deploy-fleet-tables.sql

# 示例：
mysql -h 192.168.0.66 -u root -p landport < scripts/deploy-fleet-tables.sql
```

#### 方式二：在 MySQL 客户端中执行

```sql
-- 1. 连接到数据库
mysql -h <数据库主机> -u <用户名> -p

-- 2. 选择数据库
USE <数据库名>;

-- 3. 执行脚本
source /path/to/scripts/deploy-fleet-tables.sql;
```

#### 方式三：复制 SQL 内容手动执行

1. 打开 `scripts/deploy-fleet-tables.sql` 文件
2. 复制所有 SQL 语句
3. 在 MySQL 客户端中粘贴并执行

### 步骤 3：验证表创建

执行以下 SQL 语句验证表是否创建成功：

```sql
-- 查看所有车队管理相关的表
SHOW TABLES LIKE '%vehicle%' OR LIKE '%transport%' OR LIKE '%certificate%';

-- 或查看表结构
DESC vehicles;
DESC transport_records;
DESC certificate_share_tokens;

-- 查看表的索引
SHOW INDEX FROM vehicles;
SHOW INDEX FROM transport_records;
SHOW INDEX FROM certificate_share_tokens;
```

## 四、表结构说明

### 4.1 vehicles（车辆信息表）

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| `id` | BIGINT UNSIGNED | 车辆ID（主键，自增） | PRIMARY |
| `userId` | BIGINT UNSIGNED | 所属用户ID | idx_userId |
| `brand` | VARCHAR(100) | 品牌 | - |
| `horsepower` | VARCHAR(50) | 马力 | - |
| `loadCapacity` | VARCHAR(50) | 载重 | - |
| `axleCount` | INT | 轴数 | - |
| `tireCount` | INT | 轮胎数量 | - |
| `trailerLength` | VARCHAR(50) | 挂车长度 | - |
| `certificateImages` | JSON | 证件图片URL数组 | - |
| `otherImages` | JSON | 其它图片URL数组 | - |
| `createdAt` | DATETIME | 创建时间 | - |
| `updatedAt` | DATETIME | 更新时间 | - |

### 4.2 transport_records（货运记录表）

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| `id` | BIGINT UNSIGNED | 记录ID（主键，自增） | PRIMARY |
| `vehicleId` | BIGINT UNSIGNED | 车辆ID（外键） | idx_vehicleId |
| `goodsName` | VARCHAR(200) | 货物名称 | - |
| `date` | DATE | 日期 | idx_date |
| `freight` | DECIMAL(10,2) | 运费 | - |
| `otherIncome` | DECIMAL(10,2) | 其它费用 | - |
| `fuelCost` | DECIMAL(10,2) | 油费 | - |
| `repairCost` | DECIMAL(10,2) | 维修费 | - |
| `accommodationCost` | DECIMAL(10,2) | 住宿费 | - |
| `mealCost` | DECIMAL(10,2) | 饭费 | - |
| `otherExpense` | DECIMAL(10,2) | 其它费用 | - |
| `remark` | TEXT | 备注 | - |
| `images` | JSON | 图片URL数组 | - |
| `isReconciled` | BOOLEAN | 是否已对账 | idx_isReconciled |
| `createdAt` | DATETIME | 创建时间 | - |
| `updatedAt` | DATETIME | 更新时间 | - |

**外键约束：**
- `vehicleId` 外键关联 `vehicles(id)`，级联删除

### 4.3 certificate_share_tokens（证件分享 Token 表）

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| `id` | BIGINT UNSIGNED | ID（主键，自增） | PRIMARY |
| `token` | VARCHAR(100) | 分享token（唯一） | idx_token, UNIQUE |
| `vehicleId` | BIGINT UNSIGNED | 车辆ID（外键） | - |
| `expireAt` | DATETIME | 过期时间 | idx_expireAt |
| `useCount` | INT UNSIGNED | 使用次数 | - |
| `maxUseCount` | INT UNSIGNED | 最大使用次数（NULL表示无限制） | - |
| `createdAt` | DATETIME | 创建时间 | - |
| `updatedAt` | DATETIME | 更新时间 | - |

**外键约束：**
- `vehicleId` 外键关联 `vehicles(id)`，级联删除

## 五、注意事项

### 5.1 表创建顺序

脚本已经按照正确的顺序创建表：
1. 先创建 `vehicles` 表（无依赖）
2. 再创建 `transport_records` 表（依赖 `vehicles`）
3. 最后创建 `certificate_share_tokens` 表（依赖 `vehicles`）

### 5.2 外键约束

- `transport_records.vehicleId` 外键关联 `vehicles.id`，设置为 `ON DELETE CASCADE`（删除车辆时自动删除相关记录）
- `certificate_share_tokens.vehicleId` 外键关联 `vehicles.id`，设置为 `ON DELETE CASCADE`

### 5.3 索引说明

- `vehicles.userId`：用于快速查询用户的所有车辆
- `transport_records.vehicleId`：用于快速查询车辆的所有记录
- `transport_records.date`：用于按日期范围查询
- `transport_records.isReconciled`：用于按对账状态筛选
- `certificate_share_tokens.token`：用于快速查找 token（唯一索引）
- `certificate_share_tokens.expireAt`：用于清理过期 token

### 5.4 字符集和存储引擎

- 所有表使用 `utf8mb4` 字符集（支持 emoji 等特殊字符）
- 所有表使用 `InnoDB` 存储引擎（支持事务和外键）

### 5.5 已存在表的处理

脚本使用 `CREATE TABLE IF NOT EXISTS`，如果表已存在，不会报错，也不会修改现有表结构。

如果需要更新现有表结构（如添加 `isReconciled` 字段），请使用单独的迁移脚本：
- `scripts/add-reconciled-field.sql` - 为 `transport_records` 表添加 `isReconciled` 字段

## 六、验证清单

执行脚本后，请验证以下内容：

- [ ] `vehicles` 表创建成功
- [ ] `transport_records` 表创建成功
- [ ] `certificate_share_tokens` 表创建成功
- [ ] 所有索引创建成功
- [ ] 外键约束创建成功
- [ ] 表字符集为 `utf8mb4`
- [ ] 表存储引擎为 `InnoDB`

## 七、常见问题

### Q1: 执行脚本时报外键约束错误

**原因：** 可能是 `vehicles` 表还未创建，或者表创建顺序错误。

**解决：** 确保按照脚本中的顺序执行，先创建 `vehicles` 表。

### Q2: 表已存在，但缺少某些字段

**原因：** `CREATE TABLE IF NOT EXISTS` 不会修改已存在的表。

**解决：** 使用 `ALTER TABLE` 语句添加缺失的字段，或使用单独的迁移脚本。

### Q3: 如何为已存在的表添加 `isReconciled` 字段？

执行以下脚本：
```bash
mysql -h <host> -u <user> -p <database> < scripts/add-reconciled-field.sql
```

### Q4: 如何检查表是否创建成功？

执行以下 SQL：
```sql
SHOW TABLES LIKE 'vehicles';
SHOW TABLES LIKE 'transport_records';
SHOW TABLES LIKE 'certificate_share_tokens';
```

## 八、回滚方案

如果需要删除这些表（谨慎操作）：

```sql
-- 注意：删除顺序与创建顺序相反（先删除有外键依赖的表）
DROP TABLE IF EXISTS certificate_share_tokens;
DROP TABLE IF EXISTS transport_records;
DROP TABLE IF EXISTS vehicles;
```

**警告：** 删除表会永久删除所有数据，请确保已备份数据！

## 九、相关文件

- **创建脚本：** `scripts/deploy-fleet-tables.sql`
- **添加字段脚本：** `scripts/add-reconciled-field.sql`
- **原始创建脚本：** `scripts/create-fleet-tables.sql`

---

**文档版本：** v1.0  
**创建日期：** 2025-11-26  
**最后更新：** 2025-11-26

