import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

describe('requireAdminAuth Middleware', () => {
  let UserModel: any;
  let sysAdminToken: string;
  let adminToken: string;
  let websiteToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });

    // 确保 UserModel 被注册到 ctx.model.User，以便中间件可以使用同一个实例
    // 通过模拟一个请求来触发中间件初始化
    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_requireadmin',
      nickname: '系统管理员requireadmin',
      username: 'sysadmin_requireadmin',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    const adminUser = await UserModel.create({
      openid: 'test_admin_requireadmin',
      nickname: '管理员requireadmin',
      username: 'admin_requireadmin',
      password: hashedPassword,
      role: 'admin',
    });

    // 使用 jsonwebtoken 库生成 token，确保格式正确
    const jwt = await import('jsonwebtoken');
    sysAdminToken = jwt.default.sign(
      { u: sysAdminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.default.sign(
      { u: adminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    // 生成 website-token（普通用户 token，userId: 0）
    websiteToken = (app as any).jwt.sign(
      { userId: 0, role: 'user' },
      (app.config as any).jwt.secret,
      { expiresIn: '365d' }
    );
  });

  describe('权限检查', () => {
    test('sysAdmin 应该可以访问 dc 写操作接口', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send({
          projectName: '测试项目',
          date: '2025-01-01',
          images: [],
        });

      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    test('admin 应该可以访问 dc 写操作接口', async () => {
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
      expect(res.status).not.toBe(403);
    });

    test('website-token 访问 GET /api/dc/cases 应该放行', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).not.toBe(401);
    });

    test('website-token 访问写操作应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', `Bearer ${websiteToken}`)
        .send({
          projectName: '测试项目',
          date: '2025-01-01',
          images: [],
        });

      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc 接口应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').send({
        projectName: '测试项目',
        date: '2025-01-01',
        images: [],
      });

      expect(res.status).toBe(401);
    });
  });
});

