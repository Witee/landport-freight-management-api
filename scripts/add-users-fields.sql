-- 为 users 表添加缺失的字段
-- 用于线上环境更新 users 表结构
-- 
-- 注意：执行前请先检查字段是否已存在
-- 如果字段已存在，执行会报错，可以忽略错误或使用安全版本脚本

-- 使用数据库
USE landport;

-- 添加 username 字段
-- 如果字段已存在，会报错：Duplicate column name 'username'
ALTER TABLE `users` 
ADD COLUMN `username` VARCHAR(64) NULL COMMENT '后台登录用户名' AFTER `nickname`;

-- 添加 password 字段
-- 如果字段已存在，会报错：Duplicate column name 'password'
ALTER TABLE `users` 
ADD COLUMN `password` VARCHAR(255) NULL COMMENT '后台登录密码（加密）' AFTER `username`;

-- 为 username 字段添加唯一索引
-- 注意：如果索引已存在，会报错：Duplicate key name 'uk_username'
-- 注意：如果表中已有 username 为 NULL 的记录，需要先处理重复值
CREATE UNIQUE INDEX `uk_username` ON `users` (`username`);

