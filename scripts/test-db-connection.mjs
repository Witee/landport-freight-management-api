#!/usr/bin/env node
/* 测试数据库连接脚本 */
import { Sequelize } from 'sequelize';
import config from '../config/config.unittest.ts';

const dbConfig = config.sequelize;

console.log('正在测试数据库连接...');
console.log('配置信息:');
console.log('  主机:', dbConfig.host);
console.log('  端口:', dbConfig.port);
console.log('  数据库:', dbConfig.database);
console.log('  用户名:', dbConfig.username);
console.log('  密码:', dbConfig.password ? '***' : '(空)');
console.log('');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 3000,
      idle: 10000,
    },
  }
);

try {
  await sequelize.authenticate();
  console.log('✓ 数据库连接成功！');
  
  // 测试查询
  const [results] = await sequelize.query('SELECT DATABASE() as `current_db`, USER() as `current_user`');
  if (results && results.length > 0) {
    console.log('当前数据库:', results[0].current_db);
    console.log('当前用户:', results[0].current_user);
  }
  
  // 检查数据库是否存在
  const [dbs] = await sequelize.query('SHOW DATABASES LIKE ?', {
    replacements: [dbConfig.database],
  });
  
  if (dbs.length > 0) {
    console.log('✓ 数据库存在');
  } else {
    console.log('✗ 数据库不存在，需要创建');
  }
  
  await sequelize.close();
  process.exit(0);
} catch (error) {
  console.error('✗ 数据库连接失败！');
  console.error('错误信息:', error.message);
  
  if (error.message.includes('Access denied')) {
    console.log('');
    console.log('可能的原因:');
    console.log('1. 用户名或密码错误');
    console.log('2. 用户不存在，需要创建用户');
    console.log('3. 用户没有从当前 IP 访问的权限');
    console.log('');
    console.log('解决方案:');
    console.log('请执行以下 SQL 命令创建用户并授权:');
    console.log('');
    console.log(`CREATE USER IF NOT EXISTS '${dbConfig.username}'@'%' IDENTIFIED BY '${dbConfig.password}';`);
    console.log(`GRANT ALL PRIVILEGES ON \`${dbConfig.database}\`.* TO '${dbConfig.username}'@'%';`);
    console.log('FLUSH PRIVILEGES;');
  } else if (error.message.includes('Unknown database')) {
    console.log('');
    console.log('数据库不存在，需要创建数据库:');
    console.log(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;`);
  }
  
  process.exit(1);
}

