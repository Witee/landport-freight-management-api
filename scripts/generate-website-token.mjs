#!/usr/bin/env node
/**
 * 生成前端官网服务端 Token
 * 用法: node scripts/generate-website-token.mjs
 * 
 * 该脚本生成一个长期有效的 JWT Token，供前端官网访问 /api/cases 接口使用。
 * Token 使用普通用户权限，有效期 1 年。
 * 
 * 默认情况下会自动生成 .env.website-token 文件。
 * 如果设置了 SKIP_FILE 环境变量为 'true'，则不会生成文件。
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT 配置（与 config.default.ts 中的配置一致）
const JWT_SECRET = 'G7xtJPiwG';
const EXPIRES_IN = '365d'; // 1 年有效期

// Token payload（固定系统用户，普通用户权限）
const payload = {
  userId: 0, // 固定系统用户 ID，不需要在数据库中存在
  role: 'user', // 普通用户权限，可访问 GET /api/cases
};

// 生成 Token
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: EXPIRES_IN,
});

// 如果设置了 ONLY_TOKEN 环境变量，只输出 token
if (process.env.ONLY_TOKEN === 'true') {
  console.log(token);
  process.exit(0);
}

// 计算过期时间（用于显示）
const now = new Date();
const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 天后

console.log('\n=== 前端官网服务端 Token ===\n');
console.log('Token:');
console.log(token);
console.log('\n---');
console.log('配置信息:');
console.log(`  - 用户ID: ${payload.userId}`);
console.log(`  - 权限: ${payload.role} (普通用户)`);
console.log(`  - 有效期: ${EXPIRES_IN} (${expiresAt.toLocaleString('zh-CN')})`);
console.log(`  - 用途: 访问 GET /api/cases 接口`);
console.log('\n---');
console.log('使用说明:');
console.log('1. 将上述 Token 配置到前端项目的环境变量中');
console.log('2. 在 UmiJS 代理配置中添加 Authorization 请求头:');
console.log('   headers: {');
console.log(`     'Authorization': \`Bearer \${process.env.WEBSITE_TOKEN}\``);
console.log('   }');
console.log('\n---');
console.log('前端环境变量配置示例:');
console.log('.env:');
console.log(`WEBSITE_TOKEN=${token}`);
console.log('\n提示: 请妥善保管此 Token，不要提交到代码仓库\n');

// 自动生成 .env.website-token 文件
if (process.env.SKIP_FILE !== 'true') {
  const tokenFile = path.join(__dirname, '..', '.env.website-token');
  try {
    fs.writeFileSync(tokenFile, token, 'utf8');
    console.log(`✓ 已自动生成 .env.website-token 文件: ${tokenFile}`);
  } catch (error) {
    console.error(`✗ 生成 .env.website-token 文件失败: ${error.message}`);
    process.exit(1);
  }
}

