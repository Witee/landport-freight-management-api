export default (app) => {
  const { STRING, INTEGER, DATE } = app.Sequelize;
  const CertificateShareToken = app.model.define(
    'CertificateShareToken',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: STRING(100),
        allowNull: false,
        unique: true,
        comment: '分享token',
      },
      vehicleId: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '车辆ID',
      },
      expireAt: {
        type: DATE,
        allowNull: false,
        comment: '过期时间',
      },
      useCount: {
        type: INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '使用次数',
      },
      maxUseCount: {
        type: INTEGER.UNSIGNED,
        allowNull: true,
        comment: '最大使用次数（NULL表示无限制）',
      },
    },
    {
      tableName: 'certificate_share_tokens',
      timestamps: true,
      underscored: false,
    }
  );
  return CertificateShareToken;
};

