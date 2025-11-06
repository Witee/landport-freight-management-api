export default () => {
  return async function requireAuth(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
      return await next();
    }
    const path = ctx.path || '';
    // 放行静态文件（上传的图片等）
    if (path.startsWith('/landport/public/') || path.startsWith('/public/')) {
      return await next();
    }
    // 放行认证相关接口
    if (path.startsWith('/api/auth/')) {
      return await next();
    }
    // 放行后台管理认证接口
    if (path.startsWith('/api/admin/auth/')) {
      return await next();
    }
    // 案例管理接口：GET 请求允许普通用户访问，写操作需要管理员权限（由 requireAdminAuth 处理）
    if (path.startsWith('/api/cases')) {
      // GET 请求需要普通用户认证
      if (ctx.method === 'GET') {
        const user = ctx.state && ctx.state.user;
        // 使用 !== undefined 确保 0 值也能正确处理
        if (user && user.userId !== undefined && user.userId !== null) {
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
      }
      // 写操作（POST、PUT、DELETE）由 requireAdminAuth 处理
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
    // 使用 !== undefined 确保 0 值也能正确处理
    if (user && user.userId !== undefined && user.userId !== null) {
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
