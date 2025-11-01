export default (app) => {
  const { STRING, INTEGER, DECIMAL, TEXT, JSON, ENUM } = app.Sequelize;
  const Goods = app.model.define(
    'Goods',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: STRING(128),
        allowNull: true,
        comment: '货物名称',
      },
      waybillNo: {
        type: STRING(64),
        allowNull: true,
        comment: '运单号码',
      },
      receiverName: {
        type: STRING(64),
        allowNull: true,
        comment: '收件人姓名',
      },
      receiverPhone: {
        type: STRING(20),
        allowNull: true,
        comment: '收件人电话',
      },
      senderName: {
        type: STRING(64),
        allowNull: true,
        comment: '发件人姓名',
      },
      senderPhone: {
        type: STRING(20),
        allowNull: true,
        comment: '发件人电话',
      },
      volume: {
        type: DECIMAL(10, 3),
        allowNull: true,
        comment: '体积(m³)',
      },
      weight: {
        type: DECIMAL(10, 2),
        allowNull: true,
        comment: '重量(kg)',
      },
      freight: {
        type: DECIMAL(10, 2),
        allowNull: true,
        comment: '运费(¥)',
      },
      status: {
        type: ENUM('pending', 'collected', 'transporting', 'delivered', 'cancelled', 'exception'),
        defaultValue: 'pending',
        comment: '运输状态',
      },
      remark: {
        type: TEXT,
        allowNull: true,
        comment: '备注',
      },
      images: {
        type: JSON,
        allowNull: true,
        comment: '货物图片',
      },
      createdBy: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '创建人ID',
      },
    },
    {
      tableName: 'goods',
      timestamps: true,
      underscored: false,
    }
  );
  return Goods;
};
