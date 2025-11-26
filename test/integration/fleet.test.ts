import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import UserFactory from '../../app/model/User.js';
import VehicleFactory from '../../app/model/Vehicle.js';
import TransportRecordFactory from '../../app/model/TransportRecord.js';
import CertificateShareTokenFactory from '../../app/model/CertificateShareToken.js';
import { clearTestDatabase } from '../setup.js';

describe('车队管理接口集成测试', () => {
  let UserModel: any;
  let VehicleModel: any;
  let TransportRecordModel: any;
  let CertificateShareTokenModel: any;
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;
  let vehicle1Id: number;
  let vehicle2Id: number;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);

    UserModel = UserFactory(app as any);
    VehicleModel = VehicleFactory(app as any);
    TransportRecordModel = TransportRecordFactory(app as any);
    CertificateShareTokenModel = CertificateShareTokenFactory(app as any);

    await UserModel.sync({ alter: false, force: false });
    await VehicleModel.sync({ alter: false, force: false });
    await TransportRecordModel.sync({ alter: false, force: false });
    await CertificateShareTokenModel.sync({ alter: false, force: false });

    // 创建测试用户
    const user1 = await UserModel.create({
      openid: 'test_fleet_user1',
      nickname: '车队用户1',
      role: 'user',
    });
    user1Id = user1.id;

    const user2 = await UserModel.create({
      openid: 'test_fleet_user2',
      nickname: '车队用户2',
      role: 'user',
    });
    user2Id = user2.id;

    user1Token = (app as any).jwt.sign(
      { userId: user1.id, role: user1.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );

    user2Token = (app as any).jwt.sign(
      { userId: user2.id, role: user2.role },
      (app.config as any).jwt.secret,
      { expiresIn: '1h' }
    );

    // 创建测试车辆
    const vehicle1 = await VehicleModel.create({
      userId: user1Id,
      brand: '测试品牌1',
      horsepower: '300',
      loadCapacity: '10吨',
      axleCount: 3,
      tireCount: 12,
      trailerLength: '13米',
      certificateImages: ['/uploads/test/cert1.jpg'],
      otherImages: ['/uploads/test/other1.jpg'],
    });
    vehicle1Id = vehicle1.id;

    const vehicle2 = await VehicleModel.create({
      userId: user2Id,
      brand: '测试品牌2',
      horsepower: '400',
      loadCapacity: '15吨',
      axleCount: 4,
      tireCount: 16,
      trailerLength: '17米',
    });
    vehicle2Id = vehicle2.id;
  });

  describe('数据隔离测试', () => {
    test('用户1应该只能看到自己的车辆', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/fleet/vehicles')
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.list.length).toBe(1);
      expect(res.body.data.list[0].brand).toBe('测试品牌1');
    });

    test('用户1不应该能访问用户2的车辆', async () => {
      const res = await app
        .httpRequest()
        .get(`/api/lpwx/fleet/vehicles/${vehicle2Id}`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(403);
    });

    test('用户1不应该能更新用户2的车辆', async () => {
      const res = await app
        .httpRequest()
        .put(`/api/lpwx/fleet/vehicles/${vehicle2Id}`)
        .set('X-Token', user1Token)
        .send({ brand: '被修改的品牌' });

      expect(res.status).toBe(403);
    });

    test('用户1不应该能删除用户2的车辆', async () => {
      const res = await app
        .httpRequest()
        .delete(`/api/lpwx/fleet/vehicles/${vehicle2Id}`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(403);
    });
  });

  describe('车辆管理 CRUD', () => {
    test('应该能够创建车辆', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/fleet/vehicles')
        .set('X-Token', user1Token)
        .send({
          brand: '新品牌',
          horsepower: '350',
          loadCapacity: '12吨',
          axleCount: 3,
          tireCount: 12,
          trailerLength: '14米',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.brand).toBe('新品牌');
    });

    test('应该能够更新车辆', async () => {
      const res = await app
        .httpRequest()
        .put(`/api/lpwx/fleet/vehicles/${vehicle1Id}`)
        .set('X-Token', user1Token)
        .send({
          brand: '更新后的品牌',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.brand).toBe('更新后的品牌');
    });

    test('应该能够获取车辆详情', async () => {
      const res = await app
        .httpRequest()
        .get(`/api/lpwx/fleet/vehicles/${vehicle1Id}`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBe(vehicle1Id);
      expect(Array.isArray(res.body.data.certificateImages)).toBe(true);
      expect(Array.isArray(res.body.data.otherImages)).toBe(true);
    });
  });

  describe('货运记录管理', () => {
    let recordId: number;

    test('应该能够创建货运记录', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/fleet/transport-records')
        .set('X-Token', user1Token)
        .send({
          vehicleId: vehicle1Id,
          goodsName: '测试货物',
          date: '2025-01-15',
          freight: '1000',
          otherIncome: '200',
          fuelCost: '300',
          repairCost: '100',
          accommodationCost: '150',
          mealCost: '80',
          otherExpense: '50',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.goodsName).toBe('测试货物');
      recordId = res.body.data.id;
    });

    test('不应该能为其他用户的车辆创建记录', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/fleet/transport-records')
        .set('X-Token', user1Token)
        .send({
          vehicleId: vehicle2Id, // 用户2的车辆
          goodsName: '测试货物',
          date: '2025-01-15',
          freight: '1000',
          otherIncome: '200',
          fuelCost: '300',
          repairCost: '100',
          accommodationCost: '150',
          mealCost: '80',
          otherExpense: '50',
        });

      expect(res.status).toBe(403);
    });

    test('应该能够获取货运记录列表', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/fleet/transport-records')
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });

    test('应该能够更新货运记录', async () => {
      const res = await app
        .httpRequest()
        .put(`/api/lpwx/fleet/transport-records/${recordId}`)
        .set('X-Token', user1Token)
        .send({
          goodsName: '更新后的货物名称',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.goodsName).toBe('更新后的货物名称');
    });

    test('应该能够删除货运记录', async () => {
      const res = await app
        .httpRequest()
        .delete(`/api/lpwx/fleet/transport-records/${recordId}`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    test('应该能够更新记录的对账状态', async () => {
      // 先创建一个记录
      const createRes = await app
        .httpRequest()
        .post('/api/lpwx/fleet/transport-records')
        .set('X-Token', user1Token)
        .send({
          vehicleId: vehicle1Id,
          goodsName: '对账测试货物',
          date: '2025-01-20',
          freight: '2000',
          otherIncome: '300',
          fuelCost: '400',
          repairCost: '150',
          accommodationCost: '200',
          mealCost: '100',
          otherExpense: '80',
        });

      expect(createRes.status).toBe(200);
      const newRecordId = createRes.body.data.id;

      // 标记为已对账
      const updateRes = await app
        .httpRequest()
        .put(`/api/lpwx/fleet/transport-records/${newRecordId}`)
        .set('X-Token', user1Token)
        .send({
          isReconciled: true,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.isReconciled).toBe(true);

      // 改回未对账
      const updateRes2 = await app
        .httpRequest()
        .put(`/api/lpwx/fleet/transport-records/${newRecordId}`)
        .set('X-Token', user1Token)
        .send({
          isReconciled: false,
        });

      expect(updateRes2.status).toBe(200);
      expect(updateRes2.body.data.isReconciled).toBe(false);
    });

    test('应该能够按对账状态筛选记录列表', async () => {
      // 创建已对账和未对账的记录
      const reconciledRecord = await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '已对账记录',
        date: '2025-01-21',
        freight: 1000,
        otherIncome: 200,
        fuelCost: 300,
        repairCost: 100,
        accommodationCost: 150,
        mealCost: 80,
        otherExpense: 50,
        isReconciled: true,
      });

      const unreconciledRecord = await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '未对账记录',
        date: '2025-01-22',
        freight: 1500,
        otherIncome: 300,
        fuelCost: 400,
        repairCost: 150,
        accommodationCost: 200,
        mealCost: 100,
        otherExpense: 80,
        isReconciled: false,
      });

      // 查询已对账的记录
      const reconciledRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/transport-records?isReconciled=true')
        .set('X-Token', user1Token);

      expect(reconciledRes.status).toBe(200);
      expect(reconciledRes.body.data.list.some((r: any) => r.id === reconciledRecord.id)).toBe(true);
      expect(reconciledRes.body.data.list.some((r: any) => r.id === unreconciledRecord.id)).toBe(false);

      // 查询未对账的记录
      const unreconciledRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/transport-records?isReconciled=false')
        .set('X-Token', user1Token);

      expect(unreconciledRes.status).toBe(200);
      expect(unreconciledRes.body.data.list.some((r: any) => r.id === reconciledRecord.id)).toBe(false);
      expect(unreconciledRes.body.data.list.some((r: any) => r.id === unreconciledRecord.id)).toBe(true);

      // 查询全部记录（不传 isReconciled）
      const allRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/transport-records')
        .set('X-Token', user1Token);

      expect(allRes.status).toBe(200);
      expect(allRes.body.data.list.some((r: any) => r.id === reconciledRecord.id)).toBe(true);
      expect(allRes.body.data.list.some((r: any) => r.id === unreconciledRecord.id)).toBe(true);
    });
  });

  describe('统计接口', () => {
    beforeAll(async () => {
      // 创建一些测试记录用于统计
      await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '统计测试货物1',
        date: '2025-01-10',
        freight: 1000,
        otherIncome: 200,
        fuelCost: 300,
        repairCost: 100,
        accommodationCost: 150,
        mealCost: 80,
        otherExpense: 50,
      });

      await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '统计测试货物2',
        date: '2025-01-12',
        freight: 1500,
        otherIncome: 300,
        fuelCost: 400,
        repairCost: 150,
        accommodationCost: 200,
        mealCost: 100,
        otherExpense: 80,
      });
    });

    test('应该能够获取总览统计', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/fleet/stats/overview?startDate=2025-01-01&endDate=2025-01-31')
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('totalProfit');
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('totalExpense');
      expect(typeof res.body.data.totalProfit).toBe('number');
      expect(typeof res.body.data.totalIncome).toBe('number');
      expect(typeof res.body.data.totalExpense).toBe('number');
    });

    test('应该能够获取对账统计', async () => {
      const res = await app
        .httpRequest()
        .get('/api/lpwx/fleet/stats/reconciliation?period=last30days')
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('profit');
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('totalExpense');
      expect(res.body.data).toHaveProperty('expenseBreakdown');
      expect(Array.isArray(res.body.data.expenseBreakdown)).toBe(true);
    });

    test('应该能够按对账状态筛选统计', async () => {
      // 创建已对账和未对账的记录用于统计
      await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '已对账统计记录',
        date: '2025-01-23',
        freight: 2000,
        otherIncome: 400,
        fuelCost: 500,
        repairCost: 200,
        accommodationCost: 300,
        mealCost: 150,
        otherExpense: 100,
        isReconciled: true,
      });

      await TransportRecordModel.create({
        vehicleId: vehicle1Id,
        goodsName: '未对账统计记录',
        date: '2025-01-24',
        freight: 3000,
        otherIncome: 600,
        fuelCost: 800,
        repairCost: 300,
        accommodationCost: 400,
        mealCost: 200,
        otherExpense: 150,
        isReconciled: false,
      });

      // 统计全部记录
      const allRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/stats/reconciliation?period=last30days')
        .set('X-Token', user1Token);

      expect(allRes.status).toBe(200);
      const allTotalIncome = allRes.body.data.totalIncome;

      // 只统计已对账的记录
      const reconciledRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/stats/reconciliation?period=last30days&isReconciled=true')
        .set('X-Token', user1Token);

      expect(reconciledRes.status).toBe(200);
      expect(reconciledRes.body.data.totalIncome).toBeLessThan(allTotalIncome);

      // 只统计未对账的记录
      const unreconciledRes = await app
        .httpRequest()
        .get('/api/lpwx/fleet/stats/reconciliation?period=last30days&isReconciled=false')
        .set('X-Token', user1Token);

      expect(unreconciledRes.status).toBe(200);
      expect(unreconciledRes.body.data.totalIncome).toBeLessThan(allTotalIncome);
    });
  });

  describe('证件分享', () => {
    let shareToken: string;

    test('应该能够生成分享 token（固定7天有效期）', async () => {
      const res = await app
        .httpRequest()
        .post(`/api/lpwx/fleet/vehicles/${vehicle1Id}/certificates/share-token`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('expireAt');
      expect(res.body.data).toHaveProperty('shareUrl');
      shareToken = res.body.data.token;

      // 验证过期时间为7天后
      const expireAt = new Date(res.body.data.expireAt);
      const now = new Date();
      const daysDiff = Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    test('不应该能为其他用户的车辆生成分享 token', async () => {
      const res = await app
        .httpRequest()
        .post(`/api/lpwx/fleet/vehicles/${vehicle2Id}/certificates/share-token`)
        .set('X-Token', user1Token);

      expect(res.status).toBe(403);
    });

    test('应该能够通过 token 获取证件信息（公开接口）', async () => {
      const res = await app
        .httpRequest()
        .get(`/api/public/fleet/certificates/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('vehicleId');
      expect(res.body.data).toHaveProperty('vehicleBrand');
      expect(res.body.data).toHaveProperty('certificates');
      expect(Array.isArray(res.body.data.certificates)).toBe(true);
    });

    test('无效的 token 应该返回错误', async () => {
      const res = await app
        .httpRequest()
        .get('/api/public/fleet/certificates/invalid-token');

      expect(res.status).toBe(404);
    });
  });

  describe('认证要求', () => {
    test('未登录用户不应该能访问车辆列表', async () => {
      const res = await app.httpRequest().get('/api/lpwx/fleet/vehicles');

      expect(res.status).toBe(401);
    });

    test('未登录用户不应该能创建车辆', async () => {
      const res = await app
        .httpRequest()
        .post('/api/lpwx/fleet/vehicles')
        .send({
          brand: '测试品牌',
          horsepower: '300',
          loadCapacity: '10吨',
          axleCount: 3,
          tireCount: 12,
          trailerLength: '13米',
        });

      expect(res.status).toBe(401);
    });
  });
});

