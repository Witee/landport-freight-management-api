export default {
  sequelize: {
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
};
