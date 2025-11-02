const parsePort = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const MYSQL_HOST = process.env.MYSQL_HOST?.trim() || '127.0.0.1';
const MYSQL_PORT = parsePort(process.env.MYSQL_PORT, 3306);
const MYSQL_DB = process.env.MYSQL_DB?.trim() || 'landport';
const MYSQL_USER = process.env.MYSQL_USER?.trim() || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD ?? '';

const REDIS_HOST = process.env.REDIS_HOST?.trim() || '127.0.0.1';
const REDIS_PORT = parsePort(process.env.REDIS_PORT, 6379);
const REDIS_DB = parsePort(process.env.REDIS_DB, 0);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? '';

export default {
  sequelize: {
    dialect: 'mysql',
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    database: MYSQL_DB,
    username: MYSQL_USER,
    password: MYSQL_PASSWORD,
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
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
    },
  },
};
