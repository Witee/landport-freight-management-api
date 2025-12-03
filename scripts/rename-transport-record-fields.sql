-- ============================================
-- 重命名 transport_records 表中的字段
-- ============================================
-- 说明：此脚本用于重命名字段，将"住宿费"改为"停车费"，"饭费"改为"通关费"

-- 1. 重命名 accommodationCost 字段为 parkingCost
ALTER TABLE transport_records 
CHANGE COLUMN accommodationCost parkingCost DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '停车费';

-- 2. 重命名 mealCost 字段为 clearanceCost
ALTER TABLE transport_records 
CHANGE COLUMN mealCost clearanceCost DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '通关费';

-- 验证
SELECT '已重命名 transport_records 表中的字段' AS message;
DESCRIBE transport_records;

