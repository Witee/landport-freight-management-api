-- 在数据库服务器上创建测试用户（允许远程连接）
-- 使用方法：在数据库服务器 (192.168.0.66) 上执行
-- mysql -u root -p < scripts/create-test-user-remote.sql

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建测试用户，允许从任何 IP 连接
CREATE USER IF NOT EXISTS 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';

-- 授予权限
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';

-- 也创建 localhost 用户（用于本地测试）
CREATE USER IF NOT EXISTS 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证
SELECT User, Host FROM mysql.user WHERE User = 'landport_test';
SHOW GRANTS FOR 'landport_test'@'%';
SHOW GRANTS FOR 'landport_test'@'localhost';

