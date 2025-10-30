module.exports = (_options, app) => {
  return async function jwtAuth(ctx, next) {
    try {
      const auth = ctx.get('authorization') || ctx.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      if (token) {
        try {
          const payload = app.jwt.verify(token, app.config.jwt.secret);
          ctx.state.user = payload || {};
        } catch (e) {
          // token 无效则置空，但不中断请求，具体路由自行鉴权
          ctx.state.user = {};
        }
      } else {
        ctx.state.user = {};
      }
    } catch (e) {
      ctx.state.user = {};
    }
    await next();
  };
};
