export default () => {
  const getErrorStatus = (e: any): number => (e && (e.status || e.statusCode)) || 500;
  const getErrorMessage = (e: any): string => (e && e.message) || 'Internal Server Error';
  return async function errorHandler(ctx, next) {
    try {
      await next();
      // 404 统一处理
      if (ctx.status === 404 && !ctx.body) {
        ctx.body = { code: 404, message: 'Not Found' };
      }
    } catch (err) {
      const status = getErrorStatus(err as any);
      ctx.status = status;
      ctx.body = {
        code: status,
        message: getErrorMessage(err as any),
      };
      ctx.app.emit('error', err as any, ctx);
    }
  };
};
