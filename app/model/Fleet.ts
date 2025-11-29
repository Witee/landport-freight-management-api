export default (app) => {
  const { STRING, INTEGER, TEXT } = app.Sequelize;
  const Fleet = app.model.define(
    'Fleet',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: STRING(100),
        allowNull: false,
        comment: '车队名称',
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: '车队描述',
      },
    },
    {
      tableName: 'fleets',
      timestamps: true,
      underscored: false,
      paranoid: false, // 禁用软删除
    }
  );
  return Fleet;
};

