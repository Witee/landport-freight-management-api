module.exports = {
  sequelize: {
    dialect: 'mysql',
    host: '192.168.0.66',
    port: 3306,
    database: 'landport',
    username: 'root',
    password: 'Admin123.',
    timezone: '+08:00',
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
