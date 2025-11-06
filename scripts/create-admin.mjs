#!/usr/bin/env node
/**
 * 创建管理员账号脚本
 * 用法: node scripts/create-admin.mjs <username> <password>
 * 示例: node scripts/create-admin.mjs admin admin123
 */

import bcrypt from 'bcryptjs';

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error('用法: node scripts/create-admin.mjs <username> <password>');
  console.error('示例: node scripts/create-admin.mjs admin admin123');
  process.exit(1);
}

// 生成密码哈希
const saltRounds = 10;
const passwordHash = bcrypt.hashSync(password, saltRounds);

console.log('\n=== 管理员账号信息 ===');
console.log('用户名:', username);
console.log('密码:', password);
console.log('\n=== 密码哈希（用于数据库） ===');
console.log(passwordHash);
console.log('\n=== SQL 插入语句 ===');
console.log(`
-- 如果用户已存在，先更新
UPDATE users SET 
  username = '${username}', 
  password = '${passwordHash}', 
  role = 'admin',
  nickname = '管理员',
  openid = 'admin_${username}_${Date.now()}'
WHERE username = '${username}';

-- 如果用户不存在，插入新用户
INSERT INTO users (username, password, role, nickname, openid, createdAt, updatedAt)
SELECT '${username}', '${passwordHash}', 'admin', '管理员', 'admin_${username}_${Date.now()}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '${username}');
`);
console.log('\n提示: 将上述 SQL 语句在数据库中执行即可创建管理员账号\n');
