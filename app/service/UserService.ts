import { Service } from 'egg';
import UserFactory from '../model/User.js';

// 本地进程内标记，避免重复 sync
let __userModelSynced = false;

export default class UserService extends Service {
  private async loadUserModel() {
    const { ctx, app } = this;
    const appAny = app as any;
    const UserModel = (ctx.model as any)?.User || UserFactory(appAny);
    const shouldSync = app.config.env === 'local' && !!(app.config as any).sequelize?.sync;
    if (shouldSync && !__userModelSynced && UserModel?.sync) {
      await UserModel.sync();
      __userModelSynced = true;
    }
    return UserModel as any;
  }

  // 简单的权限检查：校验用户是否为指定角色（默认 'admin'）
  async checkPermission(userId: number | undefined, role: 'admin' | 'user' = 'admin'): Promise<boolean> {
    if (!userId) return false;
    const User = await this.loadUserModel();
    const user = await User.findByPk(userId);
    if (!user) return false;
    return user.role === role;
  }
}
