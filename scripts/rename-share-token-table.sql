-- 重命名分享 Token 表
-- 从 certificate_share_tokens 重命名为 vehicle_share_tokens
-- 用于支持车辆分享功能（返回完整车辆信息，而不仅仅是证件图片）

-- 重命名表
RENAME TABLE certificate_share_tokens TO vehicle_share_tokens;

-- 更新表注释
ALTER TABLE vehicle_share_tokens 
COMMENT = '车辆分享 Token 表（原证件分享，已升级为完整车辆信息分享）';

