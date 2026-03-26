// 达成国际货运官网案例表
export default (app) => {
  const { STRING, INTEGER, DATE, JSON, DECIMAL } = app.Sequelize;
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
      // 内部管理字段（仅管理员可见）
      internalWeight: {
        type: DECIMAL(10, 2),
        allowNull: true,
        comment: '货物重量（吨）',
      },
      internalVehiclePlate: {
        type: STRING(20),
        allowNull: true,
        comment: '蒙古货车车牌号',
      },
      internalImages: {
        type: JSON,
        allowNull: true,
        comment: '对内留存图片数组',
      },
      internalStatus: {
        type: STRING(20),
        allowNull: true,
        defaultValue: 'pending',
        comment: '运输状态：pending(待运输)/transporting(运输中)/arrived(已到达)',
      },
      internalRemark: {
        type: STRING(500),
        allowNull: true,
        comment: '内部备注',
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

