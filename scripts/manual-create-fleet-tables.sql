-- ============================================
-- 手动执行：创建车队管理相关表
-- ============================================

-- 1. 创建车队表（fleets）
CREATE TABLE IF NOT EXISTS fleets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '车队名称',
  description TEXT COMMENT '车队描述',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车队信息表';

-- 2. 创建车队成员表（fleet_members）
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

-- 验证：查看表结构
-- DESCRIBE fleets;
-- DESCRIBE fleet_members;

-- 验证：查看表是否创建成功
-- SHOW TABLES LIKE 'fleet%';

