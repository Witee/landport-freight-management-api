import type { EggPlugin } from 'egg';

const plugin: EggPlugin = {
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },
  validate: {
    enable: true,
    package: 'egg-validate',
  },
  jwt: {
    enable: true,
    package: 'egg-jwt',
  },
  redis: {
    enable: true,
    package: 'egg-redis',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  tracer: {
    enable: true,
    package: '@eggjs/tracer',
  },
};

export default plugin;
