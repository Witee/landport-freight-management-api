export default () => {
  return async function requireAdminAuth(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
      return await next();
    }

    const path = ctx.path || '';
    // 仅保护达成官网管理接口（dc 前缀）
    if (!path.startsWith('/api/dc/')) {
      return await next();
    }

    // 放行达成官网登录接口
    if (path === '/api/dc/auth/login') {
      return await next();
    }

    // 案例管理接口：GET 请求允许普通用户访问（支持 website-token），不需要管理员权限
    if (path.startsWith('/api/dc/cases') && ctx.method === 'GET') {
      // GET 请求已经在 requireAuth 中检查了普通用户认证（支持 website-token），这里直接放行
      return await next();
    }

    // 其他 dc 接口（写操作、上传等）需要管理员权限（sysAdmin 或 admin）
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

    // 检查是否为管理员（通过 dcAuth 的都是 sysAdmin 或 admin）
    const role = adminUser.role;
    if (role !== 'sysAdmin' && role !== 'admin') {
      ctx.throw(403, '需要管理员权限');
    }

    return await next();
  };
};

