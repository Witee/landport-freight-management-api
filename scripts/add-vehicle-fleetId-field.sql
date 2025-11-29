-- 为 vehicles 表添加 fleetId 字段
-- 用于支持车辆关联到车队功能

-- 检查字段是否已存在，如果不存在则添加
SET @dbname = DATABASE();
SET @tablename = 'vehicles';
SET @columnname = 'fleetId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "字段 fleetId 已存在，跳过添加" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BIGINT UNSIGNED NULL COMMENT ''所属车队ID（NULL表示个人车辆）'' AFTER userId;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 为 fleetId 字段创建索引（如果不存在）
SET @indexname = 'idx_fleetId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "索引 idx_fleetId 已存在，跳过创建" AS message;',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(fleetId);')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SELECT 'vehicles 表已添加 fleetId 字段和索引' AS message;

