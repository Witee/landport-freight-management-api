// @ts-nocheck
import { Controller } from 'egg';
import UserFactory from '../model/User.js';

export default class AuthController extends Controller {
  async wxLogin() {
    const { ctx, app } = this;
    const { openid = 'demo-openid', nickname = 'demo', avatar = '', role } = ctx.request.body || {};

    // 获取或加载 User 模型
    const UserModel = (ctx.model as any)?.User || UserFactory(app as any);

    // 创建或查找用户
    const _res = await UserModel.findOrCreate({
      where: { openid },
      defaults: { nickname: nickname || 'demo', avatar: avatar || null, role: role || 'user' },
    });
    const user: any = _res[0];
    const created: boolean = _res[1];
    // 如果提供了新属性，则更新
    const needUpdate: any = {};
    // @ts-ignore
    if (nickname && nickname !== user.nickname) needUpdate.nickname = nickname;
    // @ts-ignore
    if (avatar && avatar !== user.avatar) needUpdate.avatar = avatar;
    // @ts-ignore
    if (role && role !== user.role) needUpdate.role = role;
    if (Object.keys(needUpdate).length) await user.update(needUpdate);

    // 颁发 JWT
    // @ts-ignore
    const token = (app as any).jwt.sign({ userId: user.id, role: user.role }, app.config.jwt.secret, {
      expiresIn: app.config.jwt.expiresIn,
    });

    ctx.body = {
      code: 200,
      message: created ? '注册并登录成功' : '登录成功',
      data: {
        token,
        // @ts-ignore
        user: { id: user.id, nickname: user.nickname, avatar: user.avatar, role: user.role },
      },
    };
  }
}
