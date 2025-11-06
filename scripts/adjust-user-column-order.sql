-- 调整 users 表中 username 和 password 字段的位置
-- 将 username 放在 nickname 后面，password 放在 username 后面

-- 注意：MySQL 的 MODIFY COLUMN 可以调整列的位置
-- 如果字段已经存在，使用 MODIFY COLUMN ... AFTER 来调整位置

-- 调整 username 字段位置（放在 nickname 后面）
ALTER TABLE `users` 
MODIFY COLUMN `username` VARCHAR(64) NULL COMMENT '后台登录用户名' 
AFTER `nickname`;

-- 调整 password 字段位置（放在 username 后面）
ALTER TABLE `users` 
MODIFY COLUMN `password` VARCHAR(255) NULL COMMENT '后台登录密码（加密）' 
AFTER `username`;

