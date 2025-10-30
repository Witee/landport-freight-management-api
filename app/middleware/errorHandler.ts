module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
      // 404 统一处理
      if (ctx.status === 404 && !ctx.body) {
        ctx.body = { code: 404, message: 'Not Found' };
      }
    } catch (err: any) {
      const status = (err && (err.status || (err as any).statusCode)) || 500;
      ctx.status = status;
      ctx.body = {
        code: status,
        message: err && err.message ? err.message : 'Internal Server Error',
      };
      ctx.app.emit('error', err, ctx);
    }
  };
};
