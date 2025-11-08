import { Context } from 'egg';

export default (_options, app) => {
  return async function jwtAuth(ctx: Context, next) {
    const path = ctx.path || '';
    const method = (ctx.method || 'GET').toUpperCase();

    const jwtSecret = (app.config as any)?.jwt?.secret || 'G7xtJPiwG';
    const dcJwtSecret = (app.config as any)?.dcJwt?.secret || 'DcJwtSecret2025';

    const setUserState = (payload: any, error?: string) => {
      if (error) {
        ctx.state.user = {};
        ctx.state.tokenError = error;
      } else {
        ctx.state.user = payload || {};
        ctx.state.tokenError = undefined;
      }
    };
    const setDcState = (payload: any, error?: string) => {
      if (error) {
        ctx.state.dcUser = {};
        ctx.state.dcTokenError = error;
      } else {
        ctx.state.dcUser = payload || {};
        ctx.state.dcTokenError = undefined;
      }
    };

    const getHeader = (...names: string[]) => {
      for (const name of names) {
        const value = ctx.get(name);
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'string') {
            return value[0].trim();
          }
        } else if (typeof value === 'string' && value.length > 0) {
          return value.trim();
        }
      }
      return '';
    };

    const extractBearer = (value: string) => value.replace(/^Bearer\s+/i, '').trim();

    const verifyToken = (token: string, secret: string) => {
      try {
        return app.jwt.verify(token, secret);
      } catch (err: any) {
        throw err && err.name ? err.name : 'InvalidToken';
      }
    };

    const loadDcAccount = async (userId: number) => {
      if (userId === undefined || userId === null) return null;
      let UserModel = (ctx.model as any)?.User;
      if (!UserModel) {
        const UserFactoryModule = await import('../model/User.js');
        const UserFactoryFn = UserFactoryModule.default;
        UserModel = UserFactoryFn(app as any);
      }
      if (!UserModel) return null;
      try {
        const user = await UserModel.findByPk(userId);
        if (user && (user.role === 'sysAdmin' || user.role === 'admin')) {
          return { userId: user.id, role: user.role };
        }
        return null;
      } catch (err) {
        ctx.logger.error('[jwtAuth] load dc user failed:', err);
        return null;
      }
    };

    // 默认状态
    setUserState({}, 'NoToken');
    setDcState({}, 'NoToken');

    try {
      if (path.startsWith('/api/lpwx/')) {
        const token = getHeader('x-token', 'X-Token');
        if (!token) {
          setUserState({}, 'NoToken');
        } else {
          try {
            const payload = verifyToken(token, jwtSecret);
            setUserState(payload);
          } catch (errName) {
            setUserState({}, errName as string);
          }
        }
      } else if (path === '/api/dc/cases' && method === 'GET') {
        const auth = getHeader('authorization', 'Authorization');
        const token = extractBearer(auth);
        if (!token) {
          setUserState({}, 'NoToken');
        } else {
          try {
            const payload = verifyToken(token, jwtSecret);
            setUserState(payload);
          } catch (errName) {
            setUserState({}, errName as string);
          }
        }

        const dcToken = getHeader('x-token', 'X-Token');
        if (dcToken) {
          try {
            const payload = verifyToken(dcToken, dcJwtSecret) as any;
            const dcInfo = await loadDcAccount(payload?.u ?? payload?.userId);
            if (dcInfo) {
              setDcState(dcInfo);
            } else {
              setDcState({}, 'Forbidden');
            }
          } catch (errName) {
            setDcState({}, errName as string);
          }
        }
      } else if (path.startsWith('/api/dc/')) {
        const token = getHeader('x-token', 'X-Token');
        if (!token) {
          setDcState({}, 'NoToken');
        } else {
          try {
            const payload = verifyToken(token, dcJwtSecret) as any;
            const dcInfo = await loadDcAccount(payload?.u ?? payload?.userId);
            if (dcInfo) {
              setDcState(dcInfo);
            } else {
              setDcState({}, 'Forbidden');
            }
          } catch (errName) {
            setDcState({}, errName as string);
          }
        }
      } else {
        const token = getHeader('x-token', 'X-Token');
        if (token) {
          try {
            const payload = verifyToken(token, jwtSecret);
            setUserState(payload);
          } catch (errName) {
            setUserState({}, errName as string);
          }
        }
      }
    } catch (err) {
      ctx.logger.error('[jwtAuth] parse error:', err);
      setUserState({}, 'ParseError');
      setDcState({}, 'ParseError');
    }

    await next();
  };
};
