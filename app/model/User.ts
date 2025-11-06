export default (app) => {
  const { STRING, INTEGER, DATE, ENUM } = app.Sequelize;
  const User = app.model.define(
    'User',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      openid: {
        type: STRING(64),
        allowNull: false,
        unique: true,
        comment: '微信openid',
      },
      nickname: {
        type: STRING(64),
        allowNull: false,
        comment: '用户昵称',
      },
      username: {
        type: STRING(64),
        allowNull: true,
        unique: true,
        comment: '后台登录用户名',
      },
      password: {
        type: STRING(255),
        allowNull: true,
        comment: '后台登录密码（加密）',
      },
      avatar: {
        type: STRING(255),
        allowNull: true,
        comment: '头像URL',
      },
      phone: {
        type: STRING(20),
        allowNull: true,
        comment: '手机号',
      },
      role: {
        type: ENUM('admin', 'user'),
        defaultValue: 'user',
        comment: '用户角色',
      },
      lastLoginAt: {
        type: DATE,
        allowNull: true,
        comment: '最后登录时间',
      },
    },
    {
      tableName: 'users',
      modelName: 'User',
      underscored: false,
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );
  return User;
};
