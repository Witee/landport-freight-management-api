import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import UserFactory from '../../../app/model/User.js';
import CaseFactory from '../../../app/model/Case.js';
import { clearTestDatabase } from '../../setup.js';

describe('CaseController', () => {
  let UserModel: any;
  let CaseModel: any;
  let sysAdminToken: string;
  let adminToken: string;
  let userToken: string;
  let websiteToken: string;
  let sysAdminUser: any;
  let adminUser: any;
  let userUser: any;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);

    UserModel = UserFactory(app as any);
    CaseModel = CaseFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
    await CaseModel.sync({ alter: false, force: false });

    // 创建测试用户
    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_case',
      nickname: '系统管理员案例',
      username: 'sysadmin_case',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    adminUser = await UserModel.create({
      openid: 'test_admin_case',
      nickname: '管理员案例',
      username: 'admin_case',
      password: hashedPassword,
      role: 'admin',
    });

    userUser = await UserModel.create({
      openid: 'test_user_case',
      nickname: '普通用户案例',
      role: 'user',
    });

    // 生成 tokens（使用 jsonwebtoken 库以确保正确性）
    sysAdminToken = jwt.sign({ u: sysAdminUser.id }, (app.config as any).adminJwt.secret, { expiresIn: '1h' });

    adminToken = jwt.sign({ u: adminUser.id }, (app.config as any).adminJwt.secret, { expiresIn: '1h' });

    userToken = jwt.sign({ userId: userUser.id, role: userUser.role }, (app.config as any).jwt.secret, {
      expiresIn: '1h',
    });

    // 生成 website-token（普通用户 token，userId: 0）
    websiteToken = jwt.sign({ userId: 0, role: 'user' }, (app.config as any).jwt.secret, { expiresIn: '365d' });

    // 创建测试案例
    await CaseModel.create({
      projectName: '测试项目1',
      date: '2025-01-01',
      images: ['/uploads/test1.jpg'],
    });

    await CaseModel.create({
      projectName: '测试项目2',
      date: '2025-01-02',
      images: ['/uploads/test2.jpg'],
    });
  });

  describe('GET /api/dc/cases - 获取案例列表', () => {
    test('website-token 应该可以访问', async () => {
      const res = await app.httpRequest().get('/api/dc/cases').set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.list).toBeDefined();
    });

    test('普通用户 token 应该被拒绝（只有 website-token 和 admin token 可以访问）', async () => {
      const res = await app.httpRequest().get('/api/dc/cases').set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(401);
    });

    test('sysAdmin token 应该可以访问', async () => {
      const res = await app.httpRequest().get('/api/dc/cases').set('Authorization', `Bearer ${sysAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('无 token 应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/dc/cases');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dc/cases/:id - 获取案例详情', () => {
    test('website-token 应该可以访问', async () => {
      const res = await app.httpRequest().get('/api/dc/cases/1').set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.projectName).toBeDefined();
    });

    test('无 token 应该被拒绝', async () => {
      const res = await app.httpRequest().get('/api/dc/cases/1');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/dc/cases - 创建案例', () => {
    test('sysAdmin 应该可以创建', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').set('Authorization', `Bearer ${sysAdminToken}`).send({
        projectName: 'sysAdmin创建的项目',
        date: '2025-01-03',
        images: [],
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('admin 应该可以创建', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').set('Authorization', `Bearer ${adminToken}`).send({
        projectName: 'admin创建的项目',
        date: '2025-01-04',
        images: [],
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').set('Authorization', `Bearer ${websiteToken}`).send({
        projectName: 'website-token创建的项目',
        date: '2025-01-05',
        images: [],
      });

      expect(res.status).toBe(401);
    });

    test('普通用户 token 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').set('Authorization', `Bearer ${userToken}`).send({
        projectName: 'user创建的项目',
        date: '2025-01-06',
        images: [],
      });

      expect(res.status).toBe(401);
    });

    test('无 token 应该被拒绝', async () => {
      const res = await app.httpRequest().post('/api/dc/cases').send({
        projectName: '无token创建的项目',
        date: '2025-01-07',
        images: [],
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/dc/cases/:id - 更新案例', () => {
    test('sysAdmin 应该可以更新', async () => {
      const res = await app.httpRequest().put('/api/dc/cases/1').set('Authorization', `Bearer ${sysAdminToken}`).send({
        projectName: 'sysAdmin更新的项目',
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('admin 应该可以更新', async () => {
      const res = await app.httpRequest().put('/api/dc/cases/1').set('Authorization', `Bearer ${adminToken}`).send({
        projectName: 'admin更新的项目',
      });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 应该被拒绝', async () => {
      const res = await app.httpRequest().put('/api/dc/cases/1').set('Authorization', `Bearer ${websiteToken}`).send({
        projectName: 'website-token更新的项目',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/dc/cases/:id - 删除案例', () => {
    test('sysAdmin 应该可以删除', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待删除项目',
        date: '2025-01-08',
        images: [],
      });

      const res = await app
        .httpRequest()
        .delete(`/api/dc/cases/${caseItem.id}`)
        .set('Authorization', `Bearer ${sysAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('admin 应该可以删除', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待删除项目2',
        date: '2025-01-09',
        images: [],
      });

      const res = await app
        .httpRequest()
        .delete(`/api/dc/cases/${caseItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 应该被拒绝', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待删除项目3',
        date: '2025-01-10',
        images: [],
      });

      const res = await app
        .httpRequest()
        .delete(`/api/dc/cases/${caseItem.id}`)
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(401);
    });
  });
});
