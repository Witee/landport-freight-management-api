export default (app) => {
  const { INTEGER, ENUM } = app.Sequelize;
  const FleetMember = app.model.define(
    'FleetMember',
    {
      id: {
        type: INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      fleetId: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '车队ID',
      },
      userId: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        comment: '用户ID',
      },
      role: {
        type: ENUM('admin', 'member'),
        defaultValue: 'member',
        comment: '角色：admin-管理员，member-普通成员',
      },
    },
    {
      tableName: 'fleet_members',
      timestamps: true,
      underscored: false,
      createdAt: 'joinedAt',
      updatedAt: false,
      paranoid: false, // 禁用软删除
    }
  );
  return FleetMember;
};

