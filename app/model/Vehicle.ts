export default (app) => {
  const { STRING, INTEGER, JSON } = app.Sequelize;
  const Vehicle = app.model.define(
    'Vehicle',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '所属用户ID',
      },
      brand: {
        type: STRING(100),
        allowNull: false,
        comment: '品牌',
      },
      horsepower: {
        type: STRING(50),
        allowNull: false,
        comment: '马力',
      },
      loadCapacity: {
        type: STRING(50),
        allowNull: false,
        comment: '载重',
      },
      axleCount: {
        type: INTEGER,
        allowNull: false,
        comment: '轴数',
      },
      tireCount: {
        type: INTEGER,
        allowNull: false,
        comment: '轮胎数量',
      },
      trailerLength: {
        type: STRING(50),
        allowNull: false,
        comment: '挂车长度',
      },
      certificateImages: {
        type: JSON,
        allowNull: true,
        comment: '证件图片URL数组',
      },
      otherImages: {
        type: JSON,
        allowNull: true,
        comment: '其它图片URL数组',
      },
    },
    {
      tableName: 'vehicles',
      timestamps: true,
      underscored: false,
    }
  );
  return Vehicle;
};

