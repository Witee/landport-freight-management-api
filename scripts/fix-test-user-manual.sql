-- 手动修复测试用户（分步执行）
-- 如果 root 没有 CREATE USER 权限，需要分步执行

-- 步骤 1: 检查当前用户权限
SHOW GRANTS FOR CURRENT_USER();

-- 步骤 2: 创建数据库（通常不需要特殊权限）
CREATE DATABASE IF NOT EXISTS `landport_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 步骤 3: 检查用户是否存在
SELECT User, Host FROM mysql.user WHERE User = 'landport_test';

-- 步骤 4A: 如果用户已存在，只更新密码和权限
-- 取消下面的注释来执行：
/*
ALTER USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';
ALTER USER 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';
FLUSH PRIVILEGES;
*/

-- 步骤 4B: 如果用户不存在，需要创建用户（需要 CREATE USER 权限）
-- 如果 root 没有 CREATE USER 权限，需要联系数据库管理员
-- 或者使用有 CREATE USER 权限的用户执行：
/*
CREATE USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';
CREATE USER 'landport_test'@'localhost' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'localhost';
FLUSH PRIVILEGES;
*/

