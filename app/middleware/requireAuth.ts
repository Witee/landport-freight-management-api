export default () => {
  return async function requireAuth(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
      return await next();
    }
    const path = ctx.path || '';
    // 放行认证相关接口
    if (path.startsWith('/api/auth/')) {
      return await next();
    }
    // 放行后台管理认证接口
    if (path.startsWith('/api/admin/auth/')) {
      return await next();
    }
    // 放行案例管理接口（由 requireAdminAuth 处理）
    if (path.startsWith('/api/cases')) {
      return await next();
    }
    // 放行其他 admin 接口（由 requireAdminAuth 处理）
    if (path.startsWith('/api/admin/')) {
      return await next();
    }
    // 仅保护 /api 下的业务接口
    if (!path.startsWith('/api/')) {
      return await next();
    }
    const user = ctx.state && ctx.state.user;
    if (user && user.userId) {
      return await next();
    }
    // 根据解析阶段记录的错误，给出更明确提示
    const tokenError = ctx.state && ctx.state.tokenError;
    if (tokenError === 'TokenExpiredError') {
      ctx.throw(401, '登录已过期，请重新登录');
    } else if (tokenError === 'NoToken') {
      ctx.throw(401, '未登录，请先登录');
    } else {
      ctx.throw(401, '未登录或令牌无效');
    }
  };
};
