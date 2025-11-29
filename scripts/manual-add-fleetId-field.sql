-- ============================================
-- 手动执行：为 vehicles 表添加 fleetId 字段
-- ============================================

-- 1. 为 vehicles 表添加 fleetId 字段
ALTER TABLE vehicles 
ADD COLUMN fleetId BIGINT UNSIGNED NULL COMMENT '所属车队ID（NULL表示个人车辆）' 
AFTER userId;

-- 2. 为 fleetId 字段创建索引
CREATE INDEX idx_fleetId ON vehicles(fleetId);

-- 验证：查看 vehicles 表结构
-- DESCRIBE vehicles;

-- 验证：查看索引
-- SHOW INDEX FROM vehicles WHERE Key_name = 'idx_fleetId';

