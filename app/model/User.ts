module.exports = (app) => {
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
      avatar: {
        type: STRING(255),
        allowNull: true,
        comment: '头像URL',
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
    }
  );
  return User;
};
