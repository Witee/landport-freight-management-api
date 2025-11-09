import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../../app/model/User.js';
import CaseFactory from '../../app/model/Case.js';
import { clearTestDatabase } from '../setup.js';

describe('案例接口权限集成测试', () => {
  let UserModel: any;
  let CaseModel: any;
  let sysAdminToken: string;
  let adminToken: string;
  let websiteToken: string;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    UserModel = UserFactory(app as any);
    CaseModel = CaseFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
    await CaseModel.sync({ alter: false, force: false });

    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const sysAdminUser = await UserModel.create({
      openid: 'test_sysadmin_cases',
      nickname: '系统管理员案例',
      username: 'sysadmin_cases',
      password: hashedPassword,
      role: 'sysAdmin',
    });

    const adminUser = await UserModel.create({
      openid: 'test_admin_cases',
      nickname: '管理员案例',
      username: 'admin_cases',
      password: hashedPassword,
      role: 'admin',
    });

    sysAdminToken = (app as any).jwt.sign(
      { u: sysAdminUser.id },
      (app.config as any).dcJwt.secret,
      { expiresIn: '1h' }
    );

    adminToken = (app as any).jwt.sign(
      { u: adminUser.id },
      (app.config as any).dcJwt.secret,
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
      images: ['/uploads/test1.jpg'],
      tags: ['冷链', '进口'],
    });

    await CaseModel.create({
      projectName: '测试案例2',
      date: '2025-01-02',
      images: ['/uploads/test2.jpg'],
      tags: ['散货'],
    });
  });

  describe('website-token 访问案例接口', () => {
    test('website-token 访问 GET /api/dc/cases 应该允许（正常访问）', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      const assetHost = (app.config as any).assetHost.replace(/\/+$/, '');
      const images = res.body.data.list.flatMap((item: any) => item.images || []);
      expect(images).toContain(`${assetHost}/landport/uploads/test1.jpg`);
      expect(images).toContain(`${assetHost}/landport/uploads/test2.jpg`);
    });

    test('website-token 访问 GET /api/dc/cases 应该支持分页参数', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.pageSize).toBe(10);
    });

    test('website-token 访问 GET /api/dc/cases 应该支持筛选参数', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .query({ keyword: '测试', startDate: '2025-01-01', endDate: '2025-01-31' })
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('website-token 访问 GET /api/dc/cases 应该支持 tags 筛选（多标签 OR）', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases')
        .query({ tags: ['冷链', '散货'] })
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      const names = res.body.data.list.map((item: any) => item.projectName);
      expect(names).toContain('测试案例1');
      expect(names).toContain('测试案例2');
    });

    test('website-token 访问 GET /api/dc/cases/:id 应该允许（正常访问）', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases/1')
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      const assetHost = (app.config as any).assetHost.replace(/\/+$/, '');
      expect(res.body.data.images?.[0]).toBe(`${assetHost}/landport/uploads/test1.jpg`);
    });

    test('website-token 访问 GET /api/dc/cases/:id 不存在的案例ID应该返回404', async () => {
      const res = await app
        .httpRequest()
        .get('/api/dc/cases/99999')
        .set('Authorization', `Bearer ${websiteToken}`);

      expect(res.status).toBe(404);
    });

    test('website-token 访问 POST /api/dc/cases 应该被拒绝（返回 401 或 403）', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('X-Token', websiteToken)
        .send({
          projectName: 'website-token创建的项目',
          date: '2025-01-01',
          images: [],
        });

      expect([401, 403]).toContain(res.status);
    });

    test('website-token 访问 PUT /api/dc/cases/:id 应该被拒绝（返回 401 或 403）', async () => {
      const res = await app
        .httpRequest()
        .put('/api/dc/cases/1')
        .set('X-Token', websiteToken)
        .send({
          projectName: 'website-token更新的项目',
        });

      expect([401, 403]).toContain(res.status);
    });

    test('website-token 访问 DELETE /api/dc/cases/:id 应该被拒绝（返回 401 或 403）', async () => {
      const res = await app
        .httpRequest()
        .delete('/api/dc/cases/1')
        .set('X-Token', websiteToken);

      expect([401, 403]).toContain(res.status);
    });
  });

  describe('不同 role 访问写操作接口', () => {
    test('sysAdmin 应该可以创建案例', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send({
          projectName: 'sysAdmin创建的项目',
          date: '2025-01-03',
          images: [],
          tags: ['跨境'],
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.tags).toContain('跨境');
    });

    test('admin 应该可以创建案例', async () => {
      const res = await app
        .httpRequest()
        .post('/api/dc/cases')
        .set('X-Token', adminToken)
        .send({
          projectName: 'admin创建的项目',
          date: '2025-01-04',
          images: [],
          tags: ['仓储'],
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.tags).toContain('仓储');
    });

    test('sysAdmin 应该可以更新案例', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待更新项目',
        date: '2025-01-05',
        images: [],
      });

      const res = await app
        .httpRequest()
        .put(`/api/dc/cases/${caseItem.id}`)
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send({
          projectName: 'sysAdmin更新的项目',
          tags: ['改造'],
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.tags).toContain('改造');
    });

    test('admin 应该可以更新案例', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待更新项目2',
        date: '2025-01-06',
        images: [],
      });

      const res = await app
        .httpRequest()
        .put(`/api/dc/cases/${caseItem.id}`)
        .set('X-Token', adminToken)
        .send({
          projectName: 'admin更新的项目',
          tags: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
    });

    test('sysAdmin 应该可以删除案例', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待删除项目',
        date: '2025-01-07',
        images: [],
      });

      const res = await app
        .httpRequest()
        .delete(`/api/dc/cases/${caseItem.id}`)
        .set('Authorization', `Bearer ${sysAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    test('admin 应该可以删除案例', async () => {
      const caseItem = await CaseModel.create({
        projectName: '待删除项目2',
        date: '2025-01-08',
        images: [],
      });

      const res = await app
        .httpRequest()
        .delete(`/api/dc/cases/${caseItem.id}`)
        .set('X-Token', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });
  });
});

