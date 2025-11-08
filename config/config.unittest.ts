export default {
  sequelize: {
    // 单测环境也统一东八区，避免断言受本机时区影响
    dialect: 'mysql',
    host: process.env.MYSQL_HOST?.trim() || '192.168.0.66',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: process.env.MYSQL_DB?.trim() || 'landport_test',
    username: process.env.MYSQL_USER?.trim() || 'landport_test',
    password: process.env.MYSQL_PASSWORD || 'Test_password_123',
    timezone: '+08:00',
    dialectOptions: {
      dateStrings: true,
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
    // 测试环境自动同步模型
    sync: {
      alter: false,
      force: false,
    },
  },
  // 测试环境启用微信 mock
  wechat: {
    useMock: true,
  },
  // 测试环境 JWT 配置（与生产环境保持一致）
  jwt: {
    secret: 'G7xtJPiwG',
    expiresIn: '7d',
  },
  dcJwt: {
    secret: 'DcJwtSecret2025',
    expiresIn: '30d',
  },
};
