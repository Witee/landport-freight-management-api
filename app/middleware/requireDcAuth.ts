export default () => {
  return async function requireDcAuth(ctx, next) {
    if ((ctx.method || '').toUpperCase() === 'OPTIONS') {
      return await next();
    }

    const path = ctx.path || '';
    if (!path.startsWith('/api/dc/')) {
      return await next();
    }

    if (path === '/api/dc/auth/login') {
      return await next();
    }

    if (path.startsWith('/api/dc/cases') && ctx.method === 'GET') {
      return await next();
    }

    const dcUser = ctx.state?.dcUser;
    const userId = dcUser?.userId ?? dcUser?.u;
    if (!dcUser || userId === undefined || userId === null) {
      const tokenError = ctx.state?.dcTokenError;
      if (tokenError === 'TokenExpiredError') {
        ctx.throw(401, '登录已过期，请重新登录');
      } else if (tokenError === 'NoToken') {
        ctx.throw(401, '未登录，请先登录');
      } else if (tokenError === 'InvalidTokenFormat') {
        ctx.throw(401, '令牌格式错误，请检查 X-Token 是否正确设置');
      } else if (tokenError === 'JsonWebTokenError') {
        ctx.throw(401, '令牌无效，请重新登录');
      } else {
        ctx.throw(401, `未登录或令牌无效 (${tokenError || 'Unknown'})`);
      }
    }

    const role = dcUser.role;
    if (role !== 'sysAdmin' && role !== 'admin') {
      ctx.throw(403, '需要管理员权限');
    }

    return await next();
  };
};
