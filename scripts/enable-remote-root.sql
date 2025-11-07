-- 允许 root 用户从远程连接（需要在数据库服务器上执行）
-- 使用方法：在数据库服务器 (192.168.0.66) 上执行
-- mysql -u root -p < scripts/enable-remote-root.sql

-- 检查当前 root 用户的权限
SELECT User, Host FROM mysql.user WHERE User = 'root';

-- 创建或更新 root 用户，允许从任何 IP 连接（不推荐，安全风险）
-- 如果 root@'%' 已存在，更新密码
ALTER USER 'root'@'%' IDENTIFIED BY 'your_root_password';

-- 如果 root@'%' 不存在，创建它
-- CREATE USER 'root'@'%' IDENTIFIED BY 'your_root_password';
-- GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- 或者只允许从特定 IP 连接（更安全）
-- CREATE USER 'root'@'192.168.0.168' IDENTIFIED BY 'your_root_password';
-- GRANT ALL PRIVILEGES ON *.* TO 'root'@'192.168.0.168' WITH GRANT OPTION;

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证
SELECT User, Host FROM mysql.user WHERE User = 'root';

