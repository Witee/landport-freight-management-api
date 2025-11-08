import { describe, test, expect, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import jwtAuth from '../../../app/middleware/jwtAuth.js';
import UserFactory from '../../../app/model/User.js';
import { clearTestDatabase } from '../../setup.js';

let middleware: any;
let lpwxToken: string;
let dcToken: string;
let websiteToken: string;

const runMiddleware = async (options: any) => {
  const ctx = app.mockContext({
    headers: options.headers || {},
    method: options.method || 'GET',
    path: options.path || '/',
  });
  await middleware(ctx, async () => {});
  return ctx;
};

beforeAll(async () => {
  middleware = jwtAuth({}, app as any);

  await clearTestDatabase(app);
  const UserModel = UserFactory(app as any);
  await UserModel.sync({ alter: false, force: false });

  const adminUser = await UserModel.create({
    openid: 'jwt_test_dc_admin',
    nickname: 'DC管理员',
    role: 'admin',
  });

  const jwtSecret = (app.config as any).jwt.secret;
  const dcJwtSecret = (app.config as any).dcJwt.secret;

  lpwxToken = (app as any).jwt.sign(
    { userId: 101, role: 'user' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const jsonwebtoken = await import('jsonwebtoken');
  dcToken = jsonwebtoken.default.sign(
    { u: adminUser.id },
    dcJwtSecret,
    { expiresIn: '1h' }
  );

  websiteToken = (app as any).jwt.sign(
    { userId: 0, role: 'user' },
    jwtSecret,
    { expiresIn: '1h' }
  );
});

describe('jwtAuth middleware', () => {
  test('lpwx 接口应从 X-Token 读取并写入 ctx.state.user', async () => {
    const ctx = await runMiddleware({
      path: '/api/lpwx/goods/list',
      method: 'GET',
      headers: { 'x-token': lpwxToken },
    });
    expect(ctx.state.user?.userId).toBe(101);
    expect(ctx.state.tokenError).toBeUndefined();
    expect(ctx.state.dcUser).toEqual({});
    expect(ctx.state.dcTokenError).toBe('NoToken');
  });

  test('lpwx 接口无 X-Token 应记录 NoToken', async () => {
    const ctx = await runMiddleware({
      path: '/api/lpwx/goods/list',
      method: 'GET',
    });
    expect(ctx.state.user).toEqual({});
    expect(ctx.state.tokenError).toBe('NoToken');
  });

  test('dc 接口应从 X-Token 解析并写入 ctx.state.dcUser（含角色）', async () => {
    const ctx = await runMiddleware({
      path: '/api/dc/cases',
      method: 'POST',
      headers: { 'x-token': dcToken },
    });
    expect(ctx.state.dcUser?.userId).toBeTruthy();
    expect(ctx.state.dcUser?.role).toBe('admin');
    expect(ctx.state.dcTokenError).toBeUndefined();
    expect(ctx.state.user).toEqual({});
    expect(ctx.state.tokenError).toBe('NoToken');
  });

  test('GET /api/dc/cases 仅从 Authorization 读取 website-token', async () => {
    const ctx = await runMiddleware({
      path: '/api/dc/cases',
      method: 'GET',
      headers: { Authorization: `Bearer ${websiteToken}` },
    });
    expect(ctx.state.user?.userId).toBe(0);
    expect(ctx.state.tokenError).toBeUndefined();
    expect(ctx.state.dcUser).toEqual({});
    expect(ctx.state.dcTokenError).toBe('NoToken');
  });

  test('GET /api/dc/cases 同时提供 Authorization 与 X-Token', async () => {
    const ctx = await runMiddleware({
      path: '/api/dc/cases',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${websiteToken}`,
        'x-token': dcToken,
      },
    });
    expect(ctx.state.user?.userId).toBe(0);
    expect(ctx.state.dcUser?.role).toBe('admin');
    expect(ctx.state.tokenError).toBeUndefined();
    expect(ctx.state.dcTokenError).toBeUndefined();
  });
});
