export default {
  sequelize: {
    // 单测环境也统一东八区，避免断言受本机时区影响
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
