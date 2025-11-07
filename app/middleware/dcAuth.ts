export default (_options, app) => {
  return async function dcAuth(ctx, next) {
    try {
      const auth = ctx.get('authorization') || ctx.get('Authorization') || '';
      // 移除 Bearer 前缀，并去除首尾空格
      let token = auth.replace(/^Bearer\s+/i, '').trim();
      // 确保 token 不包含换行符或其他特殊字符
      token = token.replace(/\s+/g, '');
      if (token) {
        // 检查 token 格式（JWT 应该包含两个点）
        if (!token.includes('.') || token.split('.').length !== 3) {
          ctx.state.adminUser = {};
          ctx.state.adminTokenError = 'InvalidTokenFormat';
          ctx.logger.warn('[dcAuth] Invalid token format, token length:', token.length);
        } else {
          try {
            // 使用 jsonwebtoken 库直接验证，因为 egg-jwt 的 app.jwt.verify 可能不支持传入 secret
            const jwt = await import('jsonwebtoken');
            const adminJwtSecret = (app.config as any).adminJwt?.secret || 'AdminJwtSecret2025';
            const payload = jwt.default.verify(token, adminJwtSecret) as any;
            // 将短格式转换为标准格式（u -> userId，role从数据库查询）
            // 兼容新旧格式：支持 u 和 userId 字段（使用 !== undefined 确保 0 值也能正确处理）
            const userId = payload.u !== undefined ? payload.u : payload.userId;
            if (userId === undefined || userId === null) {
              ctx.logger.warn('[dcAuth] Token payload missing userId/u:', payload);
              ctx.state.adminUser = {};
              ctx.state.adminTokenError = 'InvalidToken';
            } else {
              // 从数据库查询用户的 role（支持 sysAdmin 和 admin）
              try {
                // 尝试从 ctx.model 获取，如果不存在则使用 UserFactory
                let UserModel = (ctx.model as any)?.User;
                if (!UserModel) {
                  // 动态导入 UserFactory（避免循环依赖）
                  const UserFactoryModule = await import('../model/User.js');
                  const UserFactoryFn = UserFactoryModule.default;
                  UserModel = UserFactoryFn(app);
                }
                
                if (UserModel) {
                  const user = await UserModel.findByPk(userId);
                  if (user && (user.role === 'sysAdmin' || user.role === 'admin')) {
                    ctx.state.adminUser = {
                      userId: userId,
                      role: user.role, // 从数据库获取实际 role（sysAdmin 或 admin）
                    };
                    ctx.state.adminTokenError = undefined;
                  } else {
                    ctx.logger.warn('[dcAuth] User not found or not admin:', userId);
                    ctx.state.adminUser = {};
                    ctx.state.adminTokenError = 'InvalidToken';
                  }
                } else {
                  // 如果无法查询数据库，默认设置为 admin（向后兼容）
                  ctx.state.adminUser = {
                    userId: userId,
                    role: 'admin',
                  };
                  ctx.state.adminTokenError = undefined;
                }
              } catch (dbErr) {
                ctx.logger.error('[dcAuth] Database query error:', dbErr);
                // 数据库查询失败时，默认设置为 admin（向后兼容）
                ctx.state.adminUser = {
                  userId: userId,
                  role: 'admin',
                };
                ctx.state.adminTokenError = undefined;
              }
            }
          } catch (err) {
            // token 无效或过期，记录错误类型，置空用户，交由后续中间件决定是否拦截
            ctx.state.adminUser = {};
            const tokenErrName = (err as any)?.name;
            ctx.state.adminTokenError = tokenErrName || 'InvalidToken';
            ctx.logger.warn('[dcAuth] Token verification failed:', tokenErrName, 'token length:', token.length);
          }
        }
      } else {
        ctx.state.adminUser = {};
        ctx.state.adminTokenError = 'NoToken';
      }
    } catch (err) {
      ctx.state.adminUser = {};
      ctx.state.adminTokenError = 'ParseError';
      ctx.logger.error('[dcAuth] Parse error:', err);
    }
    await next();
  };
};

