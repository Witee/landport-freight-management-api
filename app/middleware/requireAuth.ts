export default () => {
  return async function requireAuth(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
      return await next();
    }
    const path = ctx.path || '';
    // 放行静态文件（上传的图片等）
    if (
      path.startsWith('/uploads/') ||
      path.startsWith('/landport/uploads/') ||
      path.startsWith('/landport/public/') ||
      path.startsWith('/public/')
    ) {
      return await next();
    }
    // 放行认证相关接口
    if (path.startsWith('/api/lpwx/auth/')) {
      return await next();
    }
    // 放行车队管理登录接口
    if (path === '/api/lpwx/fleet/auth/login') {
      return await next();
    }
    // 放行达成官网管理认证接口
    if (path.startsWith('/api/dc/auth/')) {
      return await next();
    }
    // 案例管理接口：GET 请求允许普通用户访问（支持 website-token），也允许管理员访问（sysAdmin/admin token）
    if (path.startsWith('/api/dc/cases')) {
      // GET 请求需要普通用户认证（支持 website-token）或管理员认证（sysAdmin/admin token）
      if (ctx.method === 'GET') {
        const user = ctx.state?.user;
        const dcUser = ctx.state?.dcUser;
        // 使用 !== undefined 确保 0 值也能正确处理
        // 允许 website-token（userId: 0）或管理员 token 访问
        // 注意：website-token 是普通用户 token，userId 为 0
        // 微信小程序 token（userId: 实际用户ID）不应该访问 dc 系统接口
        if ((user && user.userId === 0) || (dcUser && dcUser.userId !== undefined && dcUser.userId !== null)) {
          return await next();
        }
        // 根据解析阶段记录的错误，给出更明确提示
        const tokenError = ctx.state?.tokenError;
        const dcTokenError = ctx.state?.dcTokenError;
        if (tokenError === 'TokenExpiredError' || dcTokenError === 'TokenExpiredError') {
          ctx.throw(401, '登录已过期，请重新登录');
        } else if (tokenError === 'NoToken' && dcTokenError === 'NoToken') {
          ctx.throw(401, '未登录，请先登录');
        } else {
          ctx.throw(401, '未登录或令牌无效');
        }
      }
      // 写操作（POST、PUT、DELETE）由 requireDcAuth 处理
      return await next();
    }
    // 放行其他 dc 接口（由 requireDcAuth 处理）
    if (path.startsWith('/api/dc/')) {
      return await next();
    }
    // 仅保护 /api/lpwx 下的业务接口（第一套系统：陆港微信小程序）
    if (!path.startsWith('/api/lpwx/')) {
      return await next();
    }
    const user = ctx.state?.user;
    // 使用 !== undefined 确保 0 值也能正确处理
    // 注意：website-token（userId: 0）不应该访问 lpwx 系统接口
    if (user && user.userId !== undefined && user.userId !== null && user.userId !== 0) {
      return await next();
    }
    // 根据解析阶段记录的错误，给出更明确提示
    const tokenError = ctx.state?.tokenError;
    if (tokenError === 'TokenExpiredError') {
      ctx.throw(401, '登录已过期，请重新登录');
    } else if (tokenError === 'NoToken') {
      ctx.throw(401, '未登录，请先登录');
    } else {
      ctx.throw(401, '未登录或令牌无效');
    }
  };
};
