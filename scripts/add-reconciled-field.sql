-- 为 transport_records 表添加 isReconciled 字段
-- 用于标记运输记录是否已对账

ALTER TABLE transport_records 
ADD COLUMN isReconciled BOOLEAN DEFAULT FALSE COMMENT '是否已对账' 
AFTER images;

-- 为 isReconciled 字段创建索引，提高查询性能
CREATE INDEX idx_isReconciled ON transport_records(isReconciled);

