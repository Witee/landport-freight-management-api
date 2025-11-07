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

  // 权限检查：校验用户是否为管理员（sysAdmin 或 admin）
  // sysAdmin：系统管理员，拥有最高权限，可以访问所有系统
  // admin：某一套管理系统的管理员，可以访问对应系统的管理功能
  async checkPermission(userId: number | undefined, role: 'sysAdmin' | 'admin' | 'user' = 'admin'): Promise<boolean> {
    if (!userId) return false;
    const User = await this.loadUserModel();
    const user = await User.findByPk(userId);
    if (!user) return false;
    
    // 如果检查的是 sysAdmin 权限，只有 sysAdmin 用户可以
    if (role === 'sysAdmin') {
      return user.role === 'sysAdmin';
    }
    
    // 如果检查的是 admin 权限，sysAdmin 和 admin 都可以
    if (role === 'admin') {
      return user.role === 'sysAdmin' || user.role === 'admin';
    }
    
    // 其他情况（如 'user'），精确匹配
    return user.role === role;
  }

  // 检查是否为系统管理员（sysAdmin）
  async isSysAdmin(userId: number | undefined): Promise<boolean> {
    if (!userId) return false;
    const User = await this.loadUserModel();
    const user = await User.findByPk(userId);
    if (!user) return false;
    return user.role === 'sysAdmin';
  }

  // 检查是否为管理员（sysAdmin 或 admin）
  async isAdmin(userId: number | undefined): Promise<boolean> {
    return this.checkPermission(userId, 'admin');
  }
}
