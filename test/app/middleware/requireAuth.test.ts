import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

describe('requireAuth Middleware', () => {
  let UserModel: any;
  let userToken: string;
  let websiteToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });

    const userUser = await UserModel.create({
      openid: 'test_user_require',
      nickname: '普通用户require',
      role: 'user',
    });

    userToken = (app as any).jwt.sign(
      { userId: userUser.id, role: userUser.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );

    // 生成 website-token（普通用户 token，userId: 0）
    websiteToken = (app as any).jwt.sign(
      { userId: 0, role: 'user' },
      (app.config as any).jwt.secret,
      { expiresIn: '365d' }
    );
  });

  describe('路径匹配规则', () => {
    test('lpwx 前缀的接口需要普通用户 token', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/goods/list')
        .set('Authorization', `Bearer ${userToken}`);

      // 如果 token 有效，应该能够访问（即使没有数据也会返回 200）
      expect(res.status).not.toBe(401);
    });

    test('website-token 应该可以访问 GET /api/dc/cases', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).not.toBe(401);
    });

    test('website-token 应该可以访问 GET /api/dc/cases/:id', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases/1')
        .set('Authorization', `Bearer ${websiteToken}`);

      // 即使案例不存在，也应该返回 404 而不是 401
      expect(res.status).not.toBe(401);
    });

    test('无 token 访问 lpwx 接口应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/lpwx/goods/list');

      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases GET 应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/dc/cases');

      expect(res.status).toBe(401);
    });
  });
});

