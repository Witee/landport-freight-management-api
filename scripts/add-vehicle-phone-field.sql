-- 为 vehicles 表添加 phone 字段
-- 用于存储车辆联系电话，方便在分享时显示

ALTER TABLE vehicles 
ADD COLUMN phone VARCHAR(50) COMMENT '联系电话' 
AFTER userId;

