const path = require('path');
module.exports = (appInfo) => {
  const config = {
    keys: appInfo.name + '_{{keys}}',
    middleware: ['errorHandler', 'jwtAuth'],
    multipart: {
      mode: 'file',
    },
  };
  const bizConfig = {
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
  return Object.assign({}, config, { bizConfig });
};
