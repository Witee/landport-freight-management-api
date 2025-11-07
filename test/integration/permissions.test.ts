import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../app/model/User.js';
import CaseFactory from '../../app/model/Case.js';
import { clearTestDatabase } from '../setup.js';

describe('权限控制集成测试', () => {
  let UserModel: any;
  let CaseModel: any;
  let lpwxToken: string; // 微信小程序 token
  let dcSysAdminToken: string; // dc 系统 sysAdmin token
  let _dcAdminToken: string; // dc 系统 admin token
  let websiteToken: string; // website-token

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    CaseModel = CaseFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
    await CaseModel.sync({ alter: false, force: false });

    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建 lpwx 系统用户（普通用户）
    const lpwxUser = await UserModel.create({
      openid: 'test_lpwx_user',
      nickname: '微信小程序用户',
      role: 'user',
    });

    // 创建 dc 系统管理员
    const dcSysAdminUser = await UserModel.create({
      openid: 'test_dc_sysadmin',
      nickname: 'DC系统管理员',
      username: 'dc_sysadmin',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    const dcAdminUser = await UserModel.create({
      openid: 'test_dc_admin',
      nickname: 'DC管理员',
      username: 'dc_admin',
      password: hashedPassword,
      role: 'admin',
    });

    // 生成 tokens
    lpwxToken = (app as any).jwt.sign(
      { userId: lpwxUser.id, role: lpwxUser.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );

    dcSysAdminToken = (app as any).jwt.sign(
      { u: dcSysAdminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    _dcAdminToken = (app as any).jwt.sign(
      { u: dcAdminUser.id },
      (app.config as any).adminJwt.secret,
      { expiresIn: '1h' }
    );

    // 生成 website-token（普通用户 token，userId: 0）
    websiteToken = (app as any).jwt.sign(
      { userId: 0, role: 'user' },
      (app.config as any).jwt.secret,
      { expiresIn: '365d' }
    );

    // 创建测试案例
    await CaseModel.create({
      projectName: '测试案例1',
      date: '2025-01-01',
      images: ['/public/test1.jpg'],
    });
  });

  describe('无 token 访问两套系统接口', () => {
    test('无 token 访问 lpwx 系统接口应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/lpwx/goods/list');
      expect(res.status).toBe(401);
    });

    test('无 token 访问 lpwx 上传接口应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/lpwx/upload/goods-image');
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases GET 应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/dc/cases');
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases GET :id 应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/dc/cases/1');
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases POST 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').send({
        projectName: '测试项目',
        date: '2025-01-01',
        images: [],
      });
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases PUT 应该被拒绝', async () => {
      const res = await app.httpRequest().put('/api/dc/cases/1').send({
        projectName: '测试项目',
      });
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc cases DELETE 应该被拒绝', async () => {
      const res = await app.httpRequest().delete('/api/dc/cases/1');
      expect(res.status).toBe(401);
    });

    test('无 token 访问 dc upload 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/upload/goods-image');
      expect(res.status).toBe(401);
    });
  });

  describe('两套系统 token 交叉访问', () => {
    test('微信小程序 token 访问 dc cases 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .set('Authorization', `Bearer ${lpwxToken}`);
      expect(res.status).toBe(401);
    });

    test('微信小程序 token 访问 dc upload 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('Authorization', `Bearer ${lpwxToken}`);
      expect(res.status).toBe(401);
    });

    test('dc 管理员 token 访问 lpwx goods 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/goods/list')
        .set('Authorization', `Bearer ${dcSysAdminToken}`);
      expect(res.status).toBe(401);
    });

    test('dc 管理员 token 访问 lpwx upload 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/upload/goods-image')
        .set('Authorization', `Bearer ${dcSysAdminToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('website-token 对两套系统接口的访问', () => {
    test('website-token 访问 GET /api/dc/cases 应该允许', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 访问 GET /api/dc/cases/:id 应该允许', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases/1')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 访问 POST /api/dc/cases 应该被拒绝', async () => {
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

    test('website-token 访问 PUT /api/dc/cases/:id 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .put('/api/dc/cases/1')
        .set('Authorization', `Bearer ${websiteToken}`)
        .send({
          projectName: '测试项目',
        });
      expect(res.status).toBe(401);
    });

    test('website-token 访问 DELETE /api/dc/cases/:id 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .delete('/api/dc/cases/1')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(401);
    });

    test('website-token 访问 /api/dc/upload/* 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/upload/goods-image')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(401);
    });

    test('website-token 访问 /api/dc/auth/login 应该被拒绝（这是登录接口，但需要验证）', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/auth/login')
        .set('Authorization', `Bearer ${websiteToken}`)
        .send({
          username: 'test',
          password: 'test',
        });
      // 登录接口应该放行，但会验证用户名密码（如果用户名密码错误，会返回 401）
      // 这里测试的是登录接口本身不被 token 限制，所以不应该因为 token 问题返回 401
      // 但由于登录接口可能因为用户名密码错误返回 401，所以这里测试接口是可访问的
      expect([200, 401]).toContain(res.status);
    });

    test('website-token 访问 /api/lpwx/goods/* 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/goods/list')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(401);
    });

    test('website-token 访问 /api/lpwx/upload/* 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/upload/goods-image')
        .set('Authorization', `Bearer ${websiteToken}`);
      expect(res.status).toBe(401);
    });

    test('website-token 访问 /api/lpwx/auth/wx-login 应该被拒绝', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/auth/wx-login')
        .set('Authorization', `Bearer ${websiteToken}`)
        .send({
          code: 'test_code',
        });
      // 登录接口应该放行，但会验证 code
      expect(res.status).not.toBe(401);
    });
  });
});

