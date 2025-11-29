-- 为 vehicles 表添加 licensePlate 字段
-- 用于存储车牌号，放在 trailerLength 字段之后

ALTER TABLE vehicles 
ADD COLUMN licensePlate VARCHAR(20) COMMENT '车牌号' 
AFTER trailerLength;

