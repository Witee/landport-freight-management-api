export default (_options, app) => {
  return async function jwtAuth(ctx, next) {
    try {
      const auth = ctx.get('authorization') || ctx.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      if (token) {
        try {
          const payload = app.jwt.verify(token, app.config.jwt.secret);
          ctx.state.user = payload || {};
          ctx.state.tokenError = undefined;
        } catch (err) {
          // token 无效或过期，记录错误类型，置空用户，交由后续中间件决定是否拦截
          ctx.state.user = {};
          const tokenErrName = (err as any)?.name;
          ctx.state.tokenError = tokenErrName || 'InvalidToken';
        }
      } else {
        ctx.state.user = {};
        ctx.state.tokenError = 'NoToken';
      }
    } catch (err) {
      ctx.state.user = {};
      ctx.state.tokenError = 'ParseError';
    }
    await next();
  };
};
