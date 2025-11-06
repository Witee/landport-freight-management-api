export default () => {
  return async function requireAdmin(ctx, next) {
    // 放行 CORS 预检
    if (ctx.method === 'OPTIONS') {
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
      } else {
        ctx.throw(401, '未登录或令牌无效');
      }
    }

    // 检查是否为管理员（通过adminAuth的都是admin）
    const role = adminUser.role;
    if (role !== 'admin') {
      ctx.throw(403, '需要管理员权限');
    }

    return await next();
  };
};

