import { Controller } from 'egg';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../model/User.js';

export default class DcAuthController extends Controller {
  async login() {
    const { ctx, app } = this;
    ctx.validate({
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, allowEmpty: false },
    });

    const { username, password } = ctx.request.body;

    // 获取或加载 User 模型
    const UserModel = (ctx.model as any)?.User || UserFactory(app as any);
    // 本地环境按需同步，确保新增列（如 username、password）存在
    try {
      const syncConfig = (app.config as any).sequelize?.sync;
      const shouldSync = app.config.env === 'local' && !!syncConfig;
      if (shouldSync && UserModel?.sync) {
        const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
        await UserModel.sync(syncOptions);
      }
    } catch {}

    // 查找用户
    const user: any = await UserModel.findOne({
      where: { username },
    });

    if (!user) {
      ctx.throw(401, '用户名或密码错误');
    }

    // 验证密码
    if (!user.password) {
      ctx.throw(401, '该用户未设置密码');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ctx.throw(401, '用户名或密码错误');
    }

    // 检查是否为管理员（sysAdmin 或 admin）
    if (user.role !== 'sysAdmin' && user.role !== 'admin') {
      ctx.throw(403, '该用户不是管理员');
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 颁发 JWT token（使用最短格式：只存储用户ID，role根据实际用户role设置）
    const token = (app as any).jwt.sign(
      { u: user.id },
      (app.config as any).dcJwt.secret,
      {
        expiresIn: (app.config as any).dcJwt.expiresIn,
      }
    );

    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
    };
  }
}

