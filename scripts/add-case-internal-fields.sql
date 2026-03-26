-- ==========================================
-- 案例管理模块 - 内部字段扩展迁移脚本
-- 创建时间：2026-03-26
-- 说明：在现有 cases 表中新增内部管理字段
-- ==========================================

-- 1. 新增内部管理字段
ALTER TABLE `cases`
  ADD COLUMN `internalWeight` DECIMAL(10, 2) NULL COMMENT '货物重量（吨）' AFTER `images`,
  ADD COLUMN `internalVehiclePlate` VARCHAR(20) NULL COMMENT '蒙古货车车牌号' AFTER `internalWeight`,
  ADD COLUMN `internalImages` JSON NULL COMMENT '对内留存图片数组' AFTER `internalVehiclePlate`,
  ADD COLUMN `internalStatus` VARCHAR(20) NULL DEFAULT 'pending' COMMENT '运输状态：pending(待运输)/transporting(运输中)/arrived(已到达)' AFTER `internalImages`,
  ADD COLUMN `internalRemark` VARCHAR(500) NULL COMMENT '内部备注' AFTER `internalStatus`;

-- 2. 添加索引以优化统计查询
ALTER TABLE `cases`
  ADD INDEX `idx_internal_vehicle_plate` (`internalVehiclePlate`),
  ADD INDEX `idx_internal_status` (`internalStatus`),
  ADD INDEX `idx_date_status` (`date`, `internalStatus`);

-- 3. 验证字段是否成功添加
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM 
  INFORMATION_SCHEMA.COLUMNS
WHERE 
  TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'cases'
  AND COLUMN_NAME LIKE 'internal%'
ORDER BY 
  ORDINAL_POSITION;

-- ==========================================
-- 回滚脚本（如需撤销更改）
-- ==========================================
-- ALTER TABLE `cases`
--   DROP COLUMN `internalWeight`,
--   DROP COLUMN `internalVehiclePlate`,
--   DROP COLUMN `internalImages`,
--   DROP COLUMN `internalStatus`,
--   DROP COLUMN `internalRemark`,
--   DROP INDEX `idx_internal_vehicle_plate`,
--   DROP INDEX `idx_internal_status`,
--   DROP INDEX `idx_date_status`;
