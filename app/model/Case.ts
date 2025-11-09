// 达成国际货运官网案例表
export default (app) => {
  const { STRING, INTEGER, DATE, JSON } = app.Sequelize;
  const Case = app.model.define(
    'Case',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      projectName: {
        type: STRING(128),
        allowNull: false,
        comment: '项目名称',
      },
      date: {
        type: DATE,
        allowNull: false,
        comment: '日期',
      },
      tags: {
        type: JSON,
        allowNull: true,
        comment: '案例标签列表（字符串数组）',
      },
      images: {
        type: JSON,
        allowNull: true,
        comment: '图片链接地址数组',
      },
    },
    {
      tableName: 'cases',
      timestamps: true,
      underscored: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );
  return Case;
};

