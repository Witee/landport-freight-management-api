import { test, expect } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';

// 注意：此路由不存在，这是 Egg.js 模板的示例测试
// 实际项目中已移除 / 路由，所有接口都在 /api 前缀下
test.skip('should GET / status 200', async () => {
  const res = await app.httpRequest().get('/');
  expect(res.status).toBe(200);
  expect(res.text).toBe('hello egg');
});
