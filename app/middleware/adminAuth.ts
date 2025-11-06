export default (_options, app) => {
  return async function adminAuth(ctx, next) {
    try {
      const auth = ctx.get('authorization') || ctx.get('Authorization') || '';
      // 移除 Bearer 前缀，并去除首尾空格
      const token = auth.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        // 检查 token 格式（JWT 应该包含两个点）
        if (!token.includes('.') || token.split('.').length !== 3) {
          ctx.state.adminUser = {};
          ctx.state.adminTokenError = 'InvalidTokenFormat';
          ctx.logger.warn('[adminAuth] Invalid token format, token length:', token.length);
        } else {
          try {
            const payload = app.jwt.verify(token, (app.config as any).adminJwt.secret);
            // 将短格式转换为标准格式（u -> userId，role固定为admin）
            // 兼容新旧格式：支持 u 和 userId 字段（使用 !== undefined 确保 0 值也能正确处理）
            const userId = payload.u !== undefined ? payload.u : payload.userId;
            if (userId === undefined || userId === null) {
              ctx.logger.warn('[adminAuth] Token payload missing userId/u:', payload);
              ctx.state.adminUser = {};
              ctx.state.adminTokenError = 'InvalidToken';
            } else {
              ctx.state.adminUser = {
                userId: userId,
                role: 'admin', // 所有通过adminAuth的都是admin
              };
              ctx.state.adminTokenError = undefined;
            }
          } catch (err) {
            // token 无效或过期，记录错误类型，置空用户，交由后续中间件决定是否拦截
            ctx.state.adminUser = {};
            const tokenErrName = (err as any)?.name;
            ctx.state.adminTokenError = tokenErrName || 'InvalidToken';
            ctx.logger.warn('[adminAuth] Token verification failed:', tokenErrName, 'token length:', token.length);
          }
        }
      } else {
        ctx.state.adminUser = {};
        ctx.state.adminTokenError = 'NoToken';
      }
    } catch (err) {
      ctx.state.adminUser = {};
      ctx.state.adminTokenError = 'ParseError';
      ctx.logger.error('[adminAuth] Parse error:', err);
    }
    await next();
  };
};

