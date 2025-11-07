-- 修复测试用户权限
-- 使用方法：mysql -u root -p -h 192.168.0.66 < scripts/fix-test-user.sql

-- 首先删除可能存在的旧用户（如果存在）
DROP USER IF EXISTS 'landport_test'@'%';
DROP USER IF EXISTS 'landport_test'@'localhost';
DROP USER IF EXISTS 'landport_test'@'192.168.0.168';

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建测试用户，允许从任何 IP 访问（使用 '%'）
CREATE USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';

-- 授予测试数据库的所有权限
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';

-- 也创建 localhost 用户（用于本地测试）
CREATE USER 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息（验证创建成功）
SELECT User, Host FROM mysql.user WHERE User = 'landport_test';

-- 显示用户权限
SHOW GRANTS FOR 'landport_test'@'%';
SHOW GRANTS FOR 'landport_test'@'localhost';

