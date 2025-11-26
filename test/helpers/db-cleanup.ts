/**
 * 数据库清理工具函数
 * 用于在测试运行前清空测试数据库
 */

import UserFactory from '../../app/model/User.js';
import GoodsFactory from '../../app/model/Goods.js';
import CaseFactory from '../../app/model/Case.js';
import VehicleFactory from '../../app/model/Vehicle.js';
import TransportRecordFactory from '../../app/model/TransportRecord.js';
import CertificateShareTokenFactory from '../../app/model/CertificateShareToken.js';

/**
 * 清空测试数据库的所有表
 * @param app - Egg.js 应用实例
 */
export async function clearTestDatabase(app: any) {
  try {
    // 加载模型
    const UserModel = UserFactory(app);
    const GoodsModel = GoodsFactory(app);
    const CaseModel = CaseFactory(app);
    const VehicleModel = VehicleFactory(app);
    const TransportRecordModel = TransportRecordFactory(app);
    const CertificateShareTokenModel = CertificateShareTokenFactory(app);

    // 确保表已创建
    await UserModel.sync({ alter: false, force: false });
    await GoodsModel.sync({ alter: false, force: false });
    await CaseModel.sync({ alter: false, force: false });
    await VehicleModel.sync({ alter: false, force: false });
    await TransportRecordModel.sync({ alter: false, force: false });
    await CertificateShareTokenModel.sync({ alter: false, force: false });

    // 清空所有表的数据（按顺序清空，避免外键约束问题）
    // 注意：使用 truncate 比 delete 更快，但会重置自增 ID
    // 先清空有外键依赖的表
    await CertificateShareTokenModel.destroy({ where: {}, truncate: true, cascade: true });
    await TransportRecordModel.destroy({ where: {}, truncate: true, cascade: true });
    await VehicleModel.destroy({ where: {}, truncate: true, cascade: true });
    await CaseModel.destroy({ where: {}, truncate: true, cascade: true });
    await GoodsModel.destroy({ where: {}, truncate: true, cascade: true });
    await UserModel.destroy({ where: {}, truncate: true, cascade: true });

    console.log('[test] 测试数据库已清空');
  } catch (error) {
    console.warn('[test] 清空数据库失败，继续执行测试:', error);
    // 不清空数据库不应该阻止测试运行
    throw error;
  }
}

