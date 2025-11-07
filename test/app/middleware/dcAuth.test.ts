import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

describe('dcAuth Middleware', () => {
  let UserModel: any;
  let sysAdminToken: string;
  let adminToken: string;
  let _userToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });

    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_middleware',
      nickname: '系统管理员中间件',
      username: 'sysadmin_middleware',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    const adminUser = await UserModel.create({
      openid: 'test_admin_middleware',
      nickname: '管理员中间件',
      username: 'admin_middleware',
      password: hashedPassword,
      role: 'admin',
    });

    const userUser = await UserModel.create({
      openid: 'test_user_middleware',
      nickname: '普通用户中间件',
      role: 'user',
    });

    // 生成 tokens（使用 jsonwebtoken 库以确保正确性）
    sysAdminToken = jwt.sign(
      { u: sysAdminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { u: adminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    _userToken = jwt.sign(
      { userId: userUser.id, role: userUser.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('token 解析', () => {
    test('应该正确解析 sysAdmin token', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send({
          projectName: '测试项目',
          date: '2025-01-01',
          images: [],
        });

      // 如果 token 解析成功，应该能够访问（即使案例不存在也会返回 404 而不是 401）
      expect(res.status).not.toBe(401);
    });

    test('应该正确解析 admin token', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: '测试项目',
          date: '2025-01-01',
          images: [],
        });

      expect(res.status).not.toBe(401);
    });

    test('无效 token 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          projectName: '测试项目',
          date: '2025-01-01',
          images: [],
        });

      expect(res.status).toBe(401);
    });

    test('无 token 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').send({
        projectName: '测试项目',
        date: '2025-01-01',
        images: [],
      });

      expect(res.status).toBe(401);
    });
  });
});

