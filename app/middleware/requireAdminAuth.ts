export default () => {
  return async function requireAdminAuth(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
      return await next();
    }

    const path = ctx.path || '';
    // 仅保护案例管理接口
    if (!path.startsWith('/api/cases') && !path.startsWith('/api/admin')) {
      return await next();
    }

    // 放行后台登录接口
    if (path === '/api/admin/auth/login') {
      return await next();
    }

    const adminUser = ctx.state && ctx.state.adminUser;
    // 兼容新旧格式：支持 u 和 userId 字段（使用 !== undefined 确保 0 值也能正确处理）
    const userId = adminUser?.userId !== undefined ? adminUser.userId : adminUser?.u;
    if (!adminUser || userId === undefined || userId === null) {
      // 根据解析阶段记录的错误，给出更明确提示
      const tokenError = ctx.state && ctx.state.adminTokenError;
      if (tokenError === 'TokenExpiredError') {
        ctx.throw(401, '登录已过期，请重新登录');
      } else if (tokenError === 'NoToken') {
        ctx.throw(401, '未登录，请先登录');
      } else if (tokenError === 'InvalidTokenFormat') {
        ctx.throw(401, '令牌格式错误，请检查 Authorization 头是否正确设置');
      } else if (tokenError === 'JsonWebTokenError') {
        ctx.throw(401, '令牌无效，请重新登录');
      } else {
        ctx.throw(401, `未登录或令牌无效 (${tokenError || 'Unknown'})`);
      }
    }

    return await next();
  };
};

