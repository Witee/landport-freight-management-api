-- 修复测试用户权限（安全版本，不删除用户）
-- 使用方法：mysql -u root -p -h 192.168.0.66 < scripts/fix-test-user-safe.sql

-- 创建测试数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 如果用户已存在，只更新密码和权限
-- 如果用户不存在，需要手动创建（见下面的注释）

-- 更新用户密码（如果用户已存在）
-- ALTER USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';
-- ALTER USER 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';

-- 授予权限（如果用户已存在）
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息（验证）
SELECT User, Host FROM mysql.user WHERE User = 'landport_test';

-- 显示用户权限
SHOW GRANTS FOR 'landport_test'@'%';
SHOW GRANTS FOR 'landport_test'@'localhost';

-- 如果上面的 GRANT 命令失败，说明用户不存在
-- 需要手动创建用户（需要 CREATE USER 权限）：
-- CREATE USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';
-- CREATE USER 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';

