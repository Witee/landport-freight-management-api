import path from 'path';

export default (appInfo) => {
  const config = {
    keys: appInfo.name + '_{{keys}}',
    middleware: ['errorHandler', 'jwtAuth'],
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
      fileSize: '10mb',
      fileExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
    },
    static: {
      prefix: '/public',
      dir: path.join(appInfo.baseDir, 'app/public'),
    },
    jwt: {
      secret: 'G7xtJPiwG',
      expiresIn: '7d',
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
  };
  return { ...config, ...userConfig };
};
