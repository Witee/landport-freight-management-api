import { Service } from 'egg';
import { Op } from 'sequelize';
import GoodsFactory from '../model/Goods.js';
import UserFactory from '../model/User.js';

// 本地进程内标记：避免重复 sync（仅用于 local 环境开发）
let __modelsSyncedFlag = false;

export default class GoodsService extends Service {
  // 本地辅助：确保模型已加载、关联已建立，并在本地环境按需执行一次 sync
  private async loadModels() {
    const { ctx } = this;
    const appAny = this.app as any;
    const GoodsModel = (ctx.model as any)?.Goods || GoodsFactory(appAny);
    const UserModel = (ctx.model as any)?.User || UserFactory(appAny);
    if (GoodsModel && UserModel && !(GoodsModel.associations && GoodsModel.associations.creator)) {
      GoodsModel.belongsTo(UserModel, { as: 'creator', foreignKey: 'createdBy' });
    }
    const shouldSync = this.app.config.env === 'local' && !!(this.app.config as any).sequelize?.sync;
    if (shouldSync && !__modelsSyncedFlag) {
      // 先同步用户表，再同步依赖其外键的货物表，避免外键约束报错
      if (UserModel?.sync) await UserModel.sync();
      if (GoodsModel?.sync) await GoodsModel.sync();
      __modelsSyncedFlag = true;
    }
    return { GoodsModel, UserModel } as const;
  }
  // 创建货物
  async createGoods(goodsData, userId) {
    const { GoodsModel } = await this.loadModels();
    return await GoodsModel.create({
      ...goodsData,
      status: 'pending',
      createdBy: userId,
    });
  }

  // 更新货物
  async updateGoods(id, goodsData, userId) {
    const { ctx } = this;
    const { GoodsModel } = await this.loadModels();
    const goods = await GoodsModel.findOne({
      where: { id, createdBy: userId },
    });
    if (!goods) {
      ctx.throw(404, '货物不存在或无权操作');
    }
    return await goods.update(goodsData);
  }

  // 删除货物
  async deleteGoods(id, userId) {
    const { ctx } = this;
    const { GoodsModel } = await this.loadModels();
    const goods = await GoodsModel.findOne({
      where: { id, createdBy: userId },
    });
    if (goods) {
      await goods.destroy();
      return true;
    } else {
      ctx.throw(404, '货物不存在或无权操作');
    }
  }

  // 获取货物列表
  async getGoodsList(query, userId?) {
    const { page = 1, pageSize = 10, keyword, status, receiverName, senderName } = query;
    let where: any = Object.create(null);
    if (userId) {
      where.createdBy = userId;
    }
    if (keyword) {
      where[Op.or] = [
        { receiverName: { [Op.like]: `%${keyword}%` } },
        { senderName: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (receiverName) {
      where.receiverName = { [Op.like]: `%${receiverName}%` };
    }
    if (senderName) {
      where.senderName = { [Op.like]: `%${senderName}%` };
    }
    const { GoodsModel, UserModel } = await this.loadModels();
    const { count, rows } = await GoodsModel.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']],
      include: UserModel
        ? [
            {
              model: UserModel,
              as: 'creator',
              attributes: ['id', 'nickname', 'avatar'],
            },
          ]
        : [],
    });
    return {
      list: rows,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }

  // 获取货物详情
  async getGoodsDetail(id, userId?) {
    const { ctx } = this;
    const where = userId ? { id, createdBy: userId } : { id };
    const { GoodsModel, UserModel } = await this.loadModels();
    const goods = await GoodsModel.findOne({
      where,
      include: UserModel
        ? [
            {
              model: UserModel,
              as: 'creator',
              attributes: ['id', 'nickname', 'avatar'],
            },
          ]
        : [],
    });
    if (!goods) {
      ctx.throw(404, '货物不存在');
    }
    return goods;
  }

  // 更新货物状态
  async updateGoodsStatus(id, status, userId) {
    const { ctx } = this;
    const { GoodsModel } = await this.loadModels();
    const goods = await GoodsModel.findOne({
      where: { id, createdBy: userId },
    });
    if (!goods) {
      ctx.throw(404, '货物不存在或无权操作');
    }
    return await goods.update({ status });
  }
}
