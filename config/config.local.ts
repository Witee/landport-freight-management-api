export default {
  sequelize: {
    dialect: 'mysql',
    host: '192.168.0.66',
    port: 3306,
    database: 'landport',
    username: 'root',
    password: 'Admin123.',
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
    // 自动同步模型到数据库，仅用于本地开发环境
    // 注意：alter: true 可能导致索引过多错误，改为 false 只创建不存在的表，不修改已有表
    sync: {
      alter: false,
      force: false,
    },
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  },
  redis: {
    client: {
      port: 6379,
      host: '192.168.0.66',
      password: '',
      db: 0,
    },
  },
};
