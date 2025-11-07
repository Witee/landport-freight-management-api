import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import UserService from '../../../app/service/UserService.js';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

describe('UserService', () => {
  let userService: UserService;
  let UserModel: any;

  beforeAll(async () => {
    // 清空测试数据库
    await clearTestDatabase(app);
    
    // 创建测试用户表
    UserModel = UserFactory(app as any);
    await UserModel.sync({ alter: false, force: false });
    
    // 获取 UserService 实例
    try {
      userService = await app.getEggObject(UserService);
    } catch (error) {
      // 如果无法通过 getEggObject 获取，直接实例化
      userService = new UserService({ app, ctx: {} as any } as any);
    }
  });

  describe('checkPermission', () => {
    test('应该正确识别 sysAdmin 角色', async () => {
      const user = await UserModel.create({
        openid: 'test_sysadmin',
        nickname: '系统管理员',
        role: 'sysAdmin',
      });

      const result = await userService.checkPermission(user.id, 'admin');
      expect(result).toBe(true);

      const result2 = await userService.checkPermission(user.id, 'sysAdmin');
      expect(result2).toBe(true);
    });

    test('应该正确识别 admin 角色', async () => {
      const user = await UserModel.create({
        openid: 'test_admin',
        nickname: '管理员',
        role: 'admin',
      });

      const result = await userService.checkPermission(user.id, 'admin');
      expect(result).toBe(true);

      const result2 = await userService.checkPermission(user.id, 'sysAdmin');
      expect(result2).toBe(false);
    });

    test('应该正确识别 user 角色', async () => {
      const user = await UserModel.create({
        openid: 'test_user',
        nickname: '普通用户',
        role: 'user',
      });

      const result = await userService.checkPermission(user.id, 'user');
      expect(result).toBe(true);

      const result2 = await userService.checkPermission(user.id, 'admin');
      expect(result2).toBe(false);
    });

    test('权限层级：sysAdmin > admin > user', async () => {
      const sysAdmin = await UserModel.create({
        openid: 'test_sysadmin2',
        nickname: '系统管理员2',
        role: 'sysAdmin',
      });

      const admin = await UserModel.create({
        openid: 'test_admin2',
        nickname: '管理员2',
        role: 'admin',
      });

      const user = await UserModel.create({
        openid: 'test_user2',
        nickname: '普通用户2',
        role: 'user',
      });

      // sysAdmin 可以访问管理员权限
      expect(await userService.checkPermission(sysAdmin.id, 'admin')).toBe(true);
      // admin 不能访问 sysAdmin 权限（如果需要单独检查）
      expect(await userService.checkPermission(admin.id, 'admin')).toBe(true);
      // user 不能访问管理员权限
      expect(await userService.checkPermission(user.id, 'admin')).toBe(false);
    });
  });

  describe('isSysAdmin', () => {
    test('应该正确识别 sysAdmin', async () => {
      const user = await UserModel.create({
        openid: 'test_sysadmin3',
        nickname: '系统管理员3',
        role: 'sysAdmin',
      });

      const result = await userService.isSysAdmin(user.id);
      expect(result).toBe(true);
    });

    test('admin 不是 sysAdmin', async () => {
      const user = await UserModel.create({
        openid: 'test_admin3',
        nickname: '管理员3',
        role: 'admin',
      });

      const result = await userService.isSysAdmin(user.id);
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    test('sysAdmin 是管理员', async () => {
      const user = await UserModel.create({
        openid: 'test_sysadmin4',
        nickname: '系统管理员4',
        role: 'sysAdmin',
      });

      const result = await userService.isAdmin(user.id);
      expect(result).toBe(true);
    });

    test('admin 是管理员', async () => {
      const user = await UserModel.create({
        openid: 'test_admin4',
        nickname: '管理员4',
        role: 'admin',
      });

      const result = await userService.isAdmin(user.id);
      expect(result).toBe(true);
    });

    test('user 不是管理员', async () => {
      const user = await UserModel.create({
        openid: 'test_user4',
        nickname: '普通用户4',
        role: 'user',
      });

      const result = await userService.isAdmin(user.id);
      expect(result).toBe(false);
    });
  });
});

