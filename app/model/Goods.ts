module.exports = (app) => {
  const { STRING, INTEGER, DECIMAL, TEXT, JSON, ENUM } = app.Sequelize;
  const Goods = app.model.define(
    'Goods',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      receiverName: {
        type: STRING(64),
        allowNull: false,
        comment: '收件人姓名',
      },
      receiverPhone: {
        type: STRING(20),
        allowNull: false,
        comment: '收件人电话',
      },
      senderName: {
        type: STRING(64),
        allowNull: false,
        comment: '发件人姓名',
      },
      senderPhone: {
        type: STRING(20),
        allowNull: false,
        comment: '发件人电话',
      },
      volume: {
        type: DECIMAL(10, 3),
        allowNull: false,
        comment: '体积(m³)',
      },
      weight: {
        type: DECIMAL(10, 2),
        allowNull: false,
        comment: '重量(kg)',
      },
      status: {
        type: ENUM('pending', 'collected', 'transporting', 'delivered', 'cancelled'),
        defaultValue: 'pending',
        comment: '货物状态',
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
