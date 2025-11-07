-- 创建数据表脚本
-- 用于线上环境初始化数据库表结构

-- 使用数据库
USE landport;

-- 创建 cases 表
CREATE TABLE IF NOT EXISTS `cases` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `projectName` VARCHAR(128) NOT NULL COMMENT '项目名称',
  `date` DATE NOT NULL COMMENT '日期',
  `images` JSON NULL COMMENT '图片链接地址数组',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例表';

-- 创建 users 表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `nickname` VARCHAR(64) NOT NULL COMMENT '用户昵称',
  `username` VARCHAR(64) NULL COMMENT '后台登录用户名',
  `password` VARCHAR(255) NULL COMMENT '后台登录密码（加密）',
  `avatar` VARCHAR(255) NULL COMMENT '头像URL',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `lastLoginAt` DATETIME NULL COMMENT '最后登录时间',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建 goods 表
CREATE TABLE IF NOT EXISTS `goods` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(128) NULL COMMENT '货物名称',
  `waybillNo` VARCHAR(64) NULL COMMENT '运单号码',
  `receiverName` VARCHAR(64) NULL COMMENT '收件人姓名',
  `receiverPhone` VARCHAR(20) NULL COMMENT '收件人电话',
  `senderName` VARCHAR(64) NULL COMMENT '发件人姓名',
  `senderPhone` VARCHAR(20) NULL COMMENT '发件人电话',
  `volume` DECIMAL(10, 3) NULL COMMENT '体积(m³)',
  `weight` DECIMAL(10, 2) NULL COMMENT '重量(kg)',
  `freight` DECIMAL(10, 2) NULL COMMENT '运费(¥)',
  `status` ENUM('collected', 'transporting', 'delivered', 'cancelled', 'exception') NOT NULL DEFAULT 'collected' COMMENT '运输状态',
  `remark` TEXT NULL COMMENT '备注',
  `images` JSON NULL COMMENT '货物图片',
  `createdBy` INT UNSIGNED NOT NULL COMMENT '创建人ID',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_createdBy` (`createdBy`),
  INDEX `idx_status` (`status`),
  INDEX `idx_waybillNo` (`waybillNo`),
  CONSTRAINT `fk_goods_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='货物表';


