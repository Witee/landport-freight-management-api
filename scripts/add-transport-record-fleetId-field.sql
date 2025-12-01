-- ============================================
-- 为 transport_records 表添加 fleetId 字段
-- ============================================
-- 说明：此脚本用于为货运记录表添加车队ID字段，支持车队数据筛选

-- 1. 添加 fleetId 字段
ALTER TABLE transport_records 
ADD COLUMN fleetId BIGINT UNSIGNED NULL COMMENT '所属车队ID（NULL表示个人记录）' 
AFTER vehicleId;

-- 2. 添加联合索引 (fleetId, vehicleId) 用于提高查询性能
CREATE INDEX idx_fleetId_vehicleId ON transport_records(fleetId, vehicleId);

-- 3. 添加 fleetId 单独索引（可选，用于按车队查询）
CREATE INDEX idx_fleetId ON transport_records(fleetId);

-- 验证
SELECT '已为 transport_records 表添加 fleetId 字段和索引' AS message;

