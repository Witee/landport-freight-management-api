-- ============================================
-- 车队管理模块数据库表创建脚本
-- 用于线上部署时手动创建表结构
-- ============================================
-- 
-- 使用说明：
-- 1. 连接到目标数据库
-- 2. 执行此脚本创建所有车队管理相关的表
-- 3. 如果表已存在，脚本不会报错（使用 IF NOT EXISTS）
--
-- 执行方式：
--   mysql -h <host> -u <user> -p <database> < deploy-fleet-tables.sql
--   或
--   mysql> source /path/to/deploy-fleet-tables.sql
--
-- ============================================

-- 1. 车辆表（vehicles）
-- 存储车辆基本信息
CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
  name VARCHAR(100) COMMENT '车辆名称',
  phone VARCHAR(50) COMMENT '联系电话',
  brand VARCHAR(100) NOT NULL COMMENT '品牌',
  horsepower VARCHAR(50) NOT NULL COMMENT '马力',
  loadCapacity VARCHAR(50) NOT NULL COMMENT '载重',
  axleCount INT NOT NULL COMMENT '轴数',
  tireCount INT NOT NULL COMMENT '轮胎数量',
  trailerLength VARCHAR(50) NOT NULL COMMENT '挂车长度',
  licensePlate VARCHAR(20) COMMENT '车牌号',
  certificateImages JSON COMMENT '证件图片URL数组',
  otherImages JSON COMMENT '其它图片URL数组',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆信息表';

-- 2. 货运记录表（transport_records）
-- 存储每辆车的货运记录，包括收入、支出等信息
CREATE TABLE IF NOT EXISTS transport_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicleId BIGINT UNSIGNED NOT NULL COMMENT '车辆ID',
  goodsName VARCHAR(200) NOT NULL COMMENT '货物名称',
  date DATE NOT NULL COMMENT '日期',
  -- 收入字段
  freight DECIMAL(10,2) DEFAULT 0 COMMENT '运费',
  otherIncome DECIMAL(10,2) DEFAULT 0 COMMENT '其它费用',
  -- 支出字段
  fuelCost DECIMAL(10,2) DEFAULT 0 COMMENT '油费',
  repairCost DECIMAL(10,2) DEFAULT 0 COMMENT '维修费',
  accommodationCost DECIMAL(10,2) DEFAULT 0 COMMENT '住宿费',
  mealCost DECIMAL(10,2) DEFAULT 0 COMMENT '饭费',
  otherExpense DECIMAL(10,2) DEFAULT 0 COMMENT '其它费用',
  -- 其他字段
  remark TEXT COMMENT '备注',
  images JSON COMMENT '图片URL数组',
  isReconciled BOOLEAN DEFAULT FALSE COMMENT '是否已对账',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 索引
  INDEX idx_vehicleId (vehicleId),
  INDEX idx_date (date),
  INDEX idx_isReconciled (isReconciled),
  -- 外键约束
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='货运记录表';

-- 3. 车辆分享 Token 表（vehicle_share_tokens）
-- 存储车辆信息的分享 token，用于公开访问完整车辆信息
CREATE TABLE IF NOT EXISTS vehicle_share_tokens (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(100) UNIQUE NOT NULL COMMENT '分享token',
  vehicleId BIGINT UNSIGNED NOT NULL COMMENT '车辆ID',
  expireAt DATETIME NOT NULL COMMENT '过期时间（固定30天有效期）',
  useCount INT UNSIGNED DEFAULT 0 COMMENT '使用次数',
  maxUseCount INT UNSIGNED DEFAULT NULL COMMENT '最大使用次数（NULL表示无限制）',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 索引
  INDEX idx_token (token),
  INDEX idx_expireAt (expireAt),
  -- 外键约束
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆分享Token表';

-- ============================================
-- 执行完成提示
-- ============================================
SELECT '车队管理表创建完成！' AS message;
SELECT '已创建表：vehicles, transport_records, vehicle_share_tokens' AS tables;

