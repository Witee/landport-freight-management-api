export default {
  sequelize: {
    host: 'host.docker.internal',
    port: 3306,
    database: 'landport',
    username: 'root',
    password: 'Admin123.',
    // 生产环境统一东八区
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
  },
  redis: {
    client: {
      port: 6379,
      host: 'host.docker.internal',
      password: '',
      db: 0,
    },
  },
};
