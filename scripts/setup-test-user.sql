-- 设置测试数据库用户和权限
-- 使用方法：mysql -u root -p < scripts/setup-test-user.sql
-- 或者：mysql -u root -p -e "source scripts/setup-test-user.sql"

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建测试用户（如果不存在）
-- 使用 '%' 允许从任何 IP 访问，如果只需要本地访问，使用 'localhost'
CREATE USER IF NOT EXISTS 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';

-- 授予测试数据库的所有权限
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';

-- 如果只需要本地访问，也可以创建 localhost 用户
CREATE USER IF NOT EXISTS 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息
SELECT User, Host FROM mysql.user WHERE User = 'landport_test';

-- 显示数据库信息
SHOW CREATE DATABASE `landport_test`;

-- 显示用户权限
SHOW GRANTS FOR 'landport_test'@'%';
SHOW GRANTS FOR 'landport_test'@'localhost';

