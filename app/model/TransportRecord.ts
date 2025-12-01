export default (app) => {
  const { STRING, INTEGER, DECIMAL, TEXT, JSON, DATE, BOOLEAN } = app.Sequelize;
  const TransportRecord = app.model.define(
    'TransportRecord',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicleId: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '车辆ID',
      },
      fleetId: {
        type: INTEGER.UNSIGNED,
        allowNull: true,
        comment: '所属车队ID（NULL表示个人记录）',
      },
      goodsName: {
        type: STRING(200),
        allowNull: false,
        comment: '货物名称',
      },
      date: {
        type: DATE,
        allowNull: false,
        comment: '日期',
      },
      freight: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '运费',
      },
      otherIncome: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '其它费用',
      },
      fuelCost: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '油费',
      },
      repairCost: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '维修费',
      },
      accommodationCost: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '住宿费',
      },
      mealCost: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '饭费',
      },
      otherExpense: {
        type: DECIMAL(10, 2),
        defaultValue: 0,
        comment: '其它费用',
      },
      remark: {
        type: TEXT,
        allowNull: true,
        comment: '备注',
      },
      images: {
        type: JSON,
        allowNull: true,
        comment: '图片URL数组',
      },
      isReconciled: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否已对账',
      },
    },
    {
      tableName: 'transport_records',
      timestamps: true,
      underscored: false,
    }
  );
  return TransportRecord;
};

