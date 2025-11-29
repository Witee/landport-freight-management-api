-- 为 vehicles 表添加 name 字段
-- 用于存储车辆名称，放在 phone 字段之前

ALTER TABLE vehicles 
ADD COLUMN name VARCHAR(100) COMMENT '车辆名称' 
AFTER userId;

