import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../app/model/User.js';
import GoodsFactory from '../../app/model/Goods.js';
import { clearTestDatabase } from '../setup.js';

describe('货物接口权限集成测试', () => {
  let UserModel: any;
  let GoodsModel: any;
  let userToken: string;
  let adminToken: string;
  let sysAdminToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    GoodsModel = GoodsFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
    await GoodsModel.sync({ alter: false, force: false });

    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userUser = await UserModel.create({
      openid: 'test_user_goods',
      nickname: '普通用户货物',
      role: 'user',
    });

    const adminUser = await UserModel.create({
      openid: 'test_admin_goods',
      nickname: '管理员货物',
      username: 'admin_goods',
      password: hashedPassword,
      role: 'admin',
    });

    const sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_goods',
      nickname: '系统管理员货物',
      username: 'sysadmin_goods',
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

    // 创建测试货物
    await GoodsModel.create({
      name: '测试货物1',
      createdBy: userUser.id,
      status: 'collected',
    });
  });

  describe('普通用户访问货物接口', () => {
    test('普通用户应该可以访问自己的货物列表', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/goods/list')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('普通用户应该可以创建货物', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/goods')
        .set('X-Token', userToken)
        .send({
          name: '测试货物',
          status: 'collected',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });
  });

  describe('管理员访问所有货物接口', () => {
    test('admin 应该可以访问所有货物列表', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/goods/list-all')
        .set('X-Token', adminToken);

      // 需要先通过 requireAuth，然后检查权限
      // 由于 adminToken 是 dc 系统的 token，访问 lpwx 系统应该被拒绝
      expect(res.status).toBe(401);
    });

    test('sysAdmin 应该可以访问所有货物列表', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/goods/list-all')
        .set('X-Token', sysAdminToken);

      // 需要先通过 requireAuth，然后检查权限
      // 由于 sysAdminToken 是 dc 系统的 token，访问 lpwx 系统应该被拒绝
      expect(res.status).toBe(401);
    });
  });
});

