-- 检查测试用户状态
-- 使用方法：mysql -u root -p -h 192.168.0.66 < scripts/check-test-user.sql

-- 检查用户是否存在
SELECT User, Host, plugin, authentication_string IS NOT NULL as has_password 
FROM mysql.user 
WHERE User = 'landport_test';

-- 检查数据库是否存在
SHOW DATABASES LIKE 'landport_test';

-- 检查用户权限
SHOW GRANTS FOR 'landport_test'@'%';
SHOW GRANTS FOR 'landport_test'@'localhost';

