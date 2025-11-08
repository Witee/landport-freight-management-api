import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../app/model/User.js';
import { clearTestDatabase } from '../setup.js';

describe('上传接口权限集成测试', () => {
  let UserModel: any;
  let userToken: string;
  let adminToken: string;
  let sysAdminToken: string;
  let websiteToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });

    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userUser = await UserModel.create({
      openid: 'test_user_upload',
      nickname: '普通用户上传',
      role: 'user',
    });

    const adminUser = await UserModel.create({
      openid: 'test_admin_upload',
      nickname: '管理员上传',
      username: 'admin_upload',
      password: hashedPassword,
      role: 'admin',
    });

    const sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_upload',
      nickname: '系统管理员上传',
      username: 'sysadmin_upload',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    userToken = (app as any).jwt.sign(
      { userId: userUser.id, role: userUser.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );

    adminToken = (app as any).jwt.sign(
      { u: adminUser.id },
      (app.config as any).dcJwt.secret,
      { expiresIn: '1h' }
    );

    sysAdminToken = (app as any).jwt.sign(
      { u: sysAdminUser.id },
      (app.config as any).dcJwt.secret,
      { expiresIn: '1h' }
    );

    // 生成 website-token（普通用户 token，userId: 0）
    websiteToken = (app as any).jwt.sign(
      { userId: 0, role: 'user' },
      (app.config as any).jwt.secret,
      { expiresIn: '365d' }
    );
  });

  describe('普通用户上传接口', () => {
    test('普通用户应该可以访问 lpwx 上传接口', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/upload/goods-image')
        .set('X-Token', userToken);

      // 即使没有文件，也应该返回 400 而不是 401
      expect(res.status).not.toBe(401);
    });

    test('无 token 访问 lpwx 上传接口应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/lpwx/upload/goods-image');

      expect(res.status).toBe(401);
    });
  });

  describe('管理员上传接口', () => {
    test('sysAdmin 应该可以访问 dc 上传接口', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('X-Token', sysAdminToken);

      // 即使没有文件，也应该返回 400 而不是 401
      expect(res.status).not.toBe(401);
    });

    test('admin 应该可以访问 dc 上传接口', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('X-Token', adminToken);

      // 即使没有文件，也应该返回 400 而不是 401
      expect(res.status).not.toBe(401);
    });

    test('website-token 访问 dc 上传接口应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('X-Token', websiteToken);

      expect(res.status).toBe(401);
    });

    test('普通用户 token 访问 dc 上传接口应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('X-Token', userToken);

      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc 上传接口应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/upload/goods-image');

      expect(res.status).toBe(401);
    });
  });
});

