-- 创建测试数据库
-- 使用方法：mysql -u root -p < scripts/create-test-db.sql
-- 或者：mysql -u root -p -e "source scripts/create-test-db.sql"

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 显示创建的数据库信息
SHOW CREATE DATABASE `landport_test`;

-- 可选：创建专门的测试用户（更安全，推荐）
-- 取消下面的注释来创建测试用户
/*
CREATE USER IF NOT EXISTS 'landport_test'@'localhost' IDENTIFIED BY 'test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';
FLUSH PRIVILEGES;
*/

-- 显示数据库列表（确认创建成功）
SHOW DATABASES LIKE 'landport_test';

