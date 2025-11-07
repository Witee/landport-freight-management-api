-- 为 users 表添加缺失的字段（安全版本）
-- 用于线上环境更新 users 表结构
-- 此版本会先检查字段是否存在，避免重复添加

-- 使用数据库
USE landport;

-- 检查并添加 username 字段
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` VARCHAR(64) NULL COMMENT ''后台登录用户名'' AFTER `nickname`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并添加 password 字段
SET @columnname = 'password';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` VARCHAR(255) NULL COMMENT ''后台登录密码（加密）'' AFTER `username`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并添加 username 唯一索引
SET @indexname = 'uk_username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE UNIQUE INDEX `', @indexname, '` ON `', @tablename, '` (`username`)')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;


