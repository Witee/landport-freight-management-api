import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../app/model/User.js';
import { clearTestDatabase } from '../setup.js';

describe('认证流程集成测试', () => {
  let UserModel: any;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
  });

  describe('微信登录流程', () => {
    test('应该可以通过 code 登录', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/auth/wx-login')
        .send({
          code: 'test_code',
          nickname: '测试用户',
          avatar: 'https://example.com/avatar.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });
  });

  describe('管理员登录流程', () => {
    test('sysAdmin 应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_sysadmin_auth',
        nickname: '系统管理员认证',
        username: 'sysadmin_auth',
        password: hashedPassword,
        role: 'sysAdmin',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'sysadmin_auth',
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('sysAdmin');
    });

    test('admin 应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_admin_auth',
        nickname: '管理员认证',
        username: 'admin_auth',
        password: hashedPassword,
        role: 'admin',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'admin_auth',
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
    });

    test('user 不应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_user_auth',
        nickname: '普通用户认证',
        username: 'user_auth',
        password: hashedPassword,
        role: 'user',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'user_auth',
          password: password,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('不是管理员');
    });
  });

  describe('website-token 的生成和验证', () => {
    test('应该可以生成 website-token', () => {
      const token = (app as any).jwt.sign(
        { userId: 0, role: 'user' },
        (app.config as any).jwt.secret,
        { expiresIn: '365d' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('website-token 应该可以验证', () => {
      const token = (app as any).jwt.sign(
        { userId: 0, role: 'user' },
        (app.config as any).jwt.secret,
        { expiresIn: '365d' }
      );

      const payload = (app as any).jwt.verify(token, (app.config as any).jwt.secret);
      expect(payload.userId).toBe(0);
      expect(payload.role).toBe('user');
    });
  });
});

