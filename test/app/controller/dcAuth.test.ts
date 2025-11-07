import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

describe('DcAuthController', () => {
  let UserModel: any;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
  });

  describe('login', () => {
    test('sysAdmin 应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_sysadmin_login',
        nickname: '系统管理员登录',
        username: 'sysadmin',
        password: hashedPassword,
        role: 'sysAdmin',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'sysadmin',
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.user.role).toBe('sysAdmin');
      expect(res.body.data.token).toBeDefined();
    });

    test('admin 应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_admin_login',
        nickname: '管理员登录',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'admin',
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.token).toBeDefined();
    });

    test('user 不应该可以登录', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_user_login',
        nickname: '普通用户登录',
        username: 'user',
        password: hashedPassword,
        role: 'user',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'user',
          password: password,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('不是管理员');
    });

    test('错误的密码应该返回 401', async () => {
      const password = 'test123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const _user = await UserModel.create({
        openid: 'test_wrong_password',
        nickname: '错误密码',
        username: 'wrong',
        password: hashedPassword,
        role: 'admin',
      });

      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .send({
          username: 'wrong',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('用户名或密码错误');
    });
  });
});

