#!/usr/bin/env node
/**
 * 同步数据库表结构脚本
 * 用于线上环境创建或更新数据库表
 * 
 * 用法: node scripts/sync-tables.mjs
 * 
 * 环境变量:
 * - MYSQL_HOST: MySQL 主机地址（默认: 127.0.0.1）
 * - MYSQL_PORT: MySQL 端口（默认: 3306）
 * - MYSQL_DB: 数据库名称（默认: landport）
 * - MYSQL_USER: MySQL 用户名（默认: root）
 * - MYSQL_PASSWORD: MySQL 密码
 */

import { Sequelize } from 'sequelize';

const parsePort = (value, fallback) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const MYSQL_HOST = process.env.MYSQL_HOST?.trim() || '127.0.0.1';
const MYSQL_PORT = parsePort(process.env.MYSQL_PORT, 3306);
const MYSQL_DB = process.env.MYSQL_DB?.trim() || 'landport';
const MYSQL_USER = process.env.MYSQL_USER?.trim() || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD ?? '';

console.log('=== 数据库表同步脚本 ===\n');
console.log(`数据库: ${MYSQL_DB}`);
console.log(`主机: ${MYSQL_HOST}:${MYSQL_PORT}`);
console.log(`用户: ${MYSQL_USER}\n`);

// 创建 Sequelize 实例
const sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: console.log, // 输出 SQL 语句
});

// 定义模型（简化版，仅用于同步表结构）
const { DataTypes } = Sequelize;

// Users 模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  openid: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  nickname: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// Cases 模型
const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  projectName: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'cases',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// Goods 模型
const Goods = sequelize.define('Goods', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  waybillNo: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  receiverName: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  receiverPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  senderName: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  senderPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  volume: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  freight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('collected', 'transporting', 'delivered', 'cancelled', 'exception'),
    defaultValue: 'collected',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  tableName: 'goods',
  timestamps: true,
});

// 建立关联
Goods.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// 同步表结构
async function syncTables() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 同步表结构（只创建不存在的表，不修改已有表）
    console.log('开始同步表结构...\n');
    
    // 先同步 users 表（因为 goods 表依赖它）
    await User.sync({ alter: false, force: false });
    console.log('✅ users 表同步完成');
    
    // 同步 cases 表
    await Case.sync({ alter: false, force: false });
    console.log('✅ cases 表同步完成');
    
    // 同步 goods 表（依赖 users 表）
    await Goods.sync({ alter: false, force: false });
    console.log('✅ goods 表同步完成');

    console.log('\n=== 表结构同步完成 ===');
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行同步
syncTables();


