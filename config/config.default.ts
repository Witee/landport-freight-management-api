import path from 'path';

const resolveAssetHost = (env: string) => {
  const fromEnv = process.env.ASSET_HOST && String(process.env.ASSET_HOST).trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  if (env === 'local' || env === 'unittest') {
    return 'https://dev.dachengguoji.com.cn';
  }
  return 'https://dachengguoji.com.cn';
};

export default (appInfo) => {
  const keysFromEnv = process.env.APP_KEYS && String(process.env.APP_KEYS).trim();
  const config = {
    keys: keysFromEnv || `${appInfo.name}_QsVn1B7y4z`,
    // 中间件执行顺序：统一由 jwtAuth 解析 token，requireAuth/requireDcAuth 分别处理 LPWX 与 DC 权限
    middleware: ['errorHandler', 'jwtAuth', 'requireAuth', 'requireDcAuth'],
    multipart: {
      mode: 'file',
    },
  };
  const userConfig = {
    // Sequelize 通用默认项：统一时区为东八区
    sequelize: {
      timezone: '+08:00',
      // 让 MySQL 返回 DATETIME/TIMESTAMP 为字符串，避免被 JSON 序列化成 UTC 的 ISO 字符串
      dialectOptions: {
        dateStrings: true,
        // 对部分驱动/版本，仅设置 dateStrings 可能不足，增加 typeCast 以确保 DATETIME/TIMESTAMP/DATE 返回字符串
        typeCast(field, next) {
          try {
            const t = field && field.type;
            if (t === 'DATETIME' || t === 'TIMESTAMP' || t === 'DATE') {
              return field.string();
            }
          } catch {}
          return next();
        },
      },
    },
    multipart: {
      mode: 'file',
      fileSize: '20mb',
      fileExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
    },
    static: {
      prefix: '/uploads',
      dir: ((process.env.UPLOAD_ROOT_DIR && process.env.UPLOAD_ROOT_DIR.trim()) ||
        (process.env.UPLOAD_PUBLIC_DIR && process.env.UPLOAD_PUBLIC_DIR.trim()) ||
        path.join(appInfo.baseDir, 'app/uploads')),
    },
    jwt: {
      secret: 'G7xtJPiwG',
      expiresIn: '7d',
    },
    dcJwt: {
      secret: 'DcJwtSecret2025',
      expiresIn: '30d',
    },
    validate: {
      convert: true,
      widelyUndefined: true,
    },
    security: {
      csrf: {
        enable: false,
      },
      domainWhiteList: ['http://localhost:3000'],
    },
    cors: {
      origin: '*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    },
    wechat: {
      appID: 'wx13d3787702b7906c',
      appSecret: '0a98a6c6874e2f99736545a3542cb03e',
      // 是否在本地使用 mock（dev_ 前缀），默认关闭；可通过环境变量 WX_USE_MOCK=1 开启
      useMock:
        String(process.env.WX_USE_MOCK).toLowerCase() === '1' ||
        String(process.env.WX_USE_MOCK).toLowerCase() === 'true',
    },
    assetHost: resolveAssetHost(appInfo.env),
    development: {
      ignoreDirs: ['app/uploads'],
    },
    // 可配置的上传根目录，默认指向项目内 app/uploads；支持新旧环境变量名称。
    uploadRootDir:
      (process.env.UPLOAD_ROOT_DIR && process.env.UPLOAD_ROOT_DIR.trim()) ||
      (process.env.UPLOAD_PUBLIC_DIR && process.env.UPLOAD_PUBLIC_DIR.trim()) ||
      path.join(appInfo.baseDir, 'app/uploads'),
  };
  return { ...config, ...userConfig };
};
