export default {
  sequelize: {
    dialect: 'mysql',
    host: '192.168.0.66',
    port: 3306,
    database: 'landport',
    username: 'root',
    password: 'Admin123.',
    timezone: '+08:00',
    // 自动同步模型到数据库，仅用于本地开发环境
    sync: {
      alter: true,
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
