-- 车队管理相关表结构

-- 车队表
CREATE TABLE IF NOT EXISTS fleets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '车队名称',
  description TEXT COMMENT '车队描述',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车队信息表';

-- 车队成员表
CREATE TABLE IF NOT EXISTS fleet_members (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  fleetId BIGINT UNSIGNED NOT NULL COMMENT '车队ID',
  userId BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  role ENUM('admin', 'member') DEFAULT 'member' COMMENT '角色：admin-管理员，member-普通成员',
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  INDEX idx_fleetId (fleetId),
  INDEX idx_userId (userId),
  INDEX idx_fleetId_userId (fleetId, userId),
  UNIQUE KEY uk_fleetId_userId (fleetId, userId),
  FOREIGN KEY (fleetId) REFERENCES fleets(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车队成员表';

-- 为 vehicles 表添加 fleetId 字段
ALTER TABLE vehicles 
ADD COLUMN fleetId BIGINT UNSIGNED NULL COMMENT '所属车队ID（NULL表示个人车辆）' 
AFTER userId;

-- 为 fleetId 字段创建索引
CREATE INDEX idx_fleetId ON vehicles(fleetId);

-- 添加外键约束（可选，如果不需要级联删除可以不加）
-- ALTER TABLE vehicles 
-- ADD FOREIGN KEY (fleetId) REFERENCES fleets(id) ON DELETE SET NULL;

SELECT '已创建表：fleets, fleet_members，已为 vehicles 表添加 fleetId 字段' AS message;

