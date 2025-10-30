import { Service } from 'egg';
import { Op } from 'sequelize';

export default class GoodsService extends Service {
  // 创建货物
  async createGoods(goodsData, userId) {
    const { ctx } = this;
    return await ctx.model.Goods.create({
      ...goodsData,
      status: 'pending',
      createdBy: userId,
    });
  }

  // 更新货物
  async updateGoods(id, goodsData, userId) {
    const { ctx } = this;
    const goods = await ctx.model.Goods.findOne({
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
    const goods = await ctx.model.Goods.findOne({
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
    const { ctx } = this;
    const { page = 1, pageSize = 10, keyword, status, receiverName, senderName } = query;
    const where = Object.create(null);
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
    const { count, rows } = await ctx.model.Goods.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ctx.model.User,
          as: 'creator',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
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
    const where: any = { id: id };
    if (userId) {
      where.createdBy = userId;
    }
    const goods = await ctx.model.Goods.findOne({
      where,
      include: [
        {
          model: ctx.model.User,
          as: 'creator',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
    });
    if (!goods) {
      ctx.throw(404, '货物不存在');
    }
    return goods;
  }

  // 更新货物状态
  async updateGoodsStatus(id, status, userId) {
    const { ctx } = this;
    const goods = await ctx.model.Goods.findOne({
      where: { id, createdBy: userId },
    });
    if (!goods) {
      ctx.throw(404, '货物不存在或无权操作');
    }
    return await goods.update({ status });
  }
}
