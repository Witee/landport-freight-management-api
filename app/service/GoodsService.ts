import { Service } from 'egg';
import { Op } from 'sequelize';
import GoodsFactory from '../model/Goods.js';
import UserFactory from '../model/User.js';

const GOODS_STATUS_VALUES = ['collected', 'transporting', 'delivered', 'cancelled', 'exception'] as const;
const GOODS_STATUS_SET = new Set<string>(GOODS_STATUS_VALUES);
const DEFAULT_GOODS_STATUS = 'collected';

const normalizeStatusFilter = (input: unknown): string[] => {
  if (!input) return [];
  const collected: string[] = [];
  const collect = (value: unknown) => {
    if (typeof value === 'string') {
      value
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .forEach((segment) => collected.push(segment));
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    }
  };
  collect(input);
  return Array.from(new Set(collected.filter((value) => GOODS_STATUS_SET.has(value))));
};

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
    const syncConfig = (this.app.config as any).sequelize?.sync;
    const shouldSync = this.app.config.env === 'local' && !!syncConfig;
    if (shouldSync && !__modelsSyncedFlag) {
      // 解析 sync 选项，支持 alter: true 以变更已有表结构
      const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
      // 先同步用户表，再同步依赖其外键的货物表，避免外键约束报错
      if (UserModel?.sync) await UserModel.sync(syncOptions);
      if (GoodsModel?.sync) await GoodsModel.sync(syncOptions);
      __modelsSyncedFlag = true;
    }
    return { GoodsModel, UserModel } as const;
  }
  // 创建货物
  async createGoods(goodsData, userId) {
    const { GoodsModel } = await this.loadModels();
    // 仅当传入的 status 合法时才使用，否则采用系统默认状态
    const { status, ...rest } = goodsData || {};
    const payload: any = { ...rest, createdBy: userId };
    if (typeof status === 'string' && GOODS_STATUS_SET.has(status)) {
      payload.status = status;
    }
    if (!payload.status) {
      payload.status = DEFAULT_GOODS_STATUS;
    }
    return await GoodsModel.create(payload);
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
    const { page = 1, pageSize = 10, keyword, receiverName, senderName } = query;
    // 强制转换分页参数为数字，避免 SQL 语法错误
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    let where: any = Object.create(null);
    if (userId) {
      where.createdBy = userId;
    }
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { waybillNo: { [Op.like]: `%${keyword}%` } },
        { receiverName: { [Op.like]: `%${keyword}%` } },
        { receiverPhone: { [Op.like]: `%${keyword}%` } },
        { senderName: { [Op.like]: `%${keyword}%` } },
        { senderPhone: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }
    const statusFilter = normalizeStatusFilter([(query as any)?.status, (query as any)?.statuses]);
    if (statusFilter.length === 1) {
      where.status = statusFilter[0];
    } else if (statusFilter.length > 1) {
      where.status = { [Op.in]: statusFilter };
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
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
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
        page: pageNum,
        pageSize: pageSizeNum,
        total: count,
        totalPages: Math.ceil(count / pageSizeNum),
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
    if (!GOODS_STATUS_SET.has(status)) {
      ctx.throw(422, '状态值非法');
    }
    return await goods.update({ status });
  }

  // 追加图片到货物（仅限创建者）
  async addGoodsImages(id: number, urls: string[], userId: number) {
    const { ctx } = this;
    const { GoodsModel } = await this.loadModels();
    const goods = await GoodsModel.findOne({ where: { id, createdBy: userId } });
    if (!goods) ctx.throw(404, '货物不存在或无权操作');
    const current = Array.isArray((goods as any).images) ? (goods as any).images : [];
    // 合并去重
    const next = Array.from(new Set([...current, ...urls].filter(Boolean)));
    await goods.update({ images: next });
    return goods;
  }

  async getGoodsStats(userId: number | undefined) {
    const { GoodsModel } = await this.loadModels();
    const baseWhere = userId ? { createdBy: userId } : {};
    const now = new Date();

    const currentYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const nextYearStart = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

    const rangeWhere = (start: Date, end: Date) => ({
      ...baseWhere,
      createdAt: {
        [Op.gte]: start,
        [Op.lt]: end,
      },
    });

    const sequelize = GoodsModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }
    const sumFreight = async (where) => {
      const result = await GoodsModel.findOne({
        where,
        attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('freight')), 0), 'totalFreight']],
        raw: true,
      });
      const rawTotal = (result as any)?.totalFreight;
      if (rawTotal === null || rawTotal === undefined) return 0;
      const numeric = Number(rawTotal);
      if (Number.isNaN(numeric)) return 0;
      return Math.round(numeric);
    };

    const transportingWhere = { ...baseWhere, status: 'transporting' };

    const [
      lastYearGoodsCount,
      currentYearGoodsCount,
      lastMonthGoodsCount,
      currentMonthGoodsCount,
      lastYearFreightTotal,
      currentYearFreightTotal,
      lastMonthFreightTotal,
      currentMonthFreightTotal,
      transportingGoodsCount,
    ] = await Promise.all([
      GoodsModel.count({ where: rangeWhere(lastYearStart, currentYearStart) }),
      GoodsModel.count({ where: rangeWhere(currentYearStart, nextYearStart) }),
      GoodsModel.count({ where: rangeWhere(lastMonthStart, currentMonthStart) }),
      GoodsModel.count({ where: rangeWhere(currentMonthStart, nextMonthStart) }),
      sumFreight(rangeWhere(lastYearStart, currentYearStart)),
      sumFreight(rangeWhere(currentYearStart, nextYearStart)),
      sumFreight(rangeWhere(lastMonthStart, currentMonthStart)),
      sumFreight(rangeWhere(currentMonthStart, nextMonthStart)),
      GoodsModel.count({ where: transportingWhere }),
    ]);

    return {
      lastYearGoodsCount,
      currentYearGoodsCount,
      lastMonthGoodsCount,
      currentMonthGoodsCount,
      lastYearFreightTotal,
      currentYearFreightTotal,
      lastMonthFreightTotal,
      currentMonthFreightTotal,
      transportingGoodsCount,
    };
  }

  async getGoodsReconciliation(userId: number | undefined) {
    const { GoodsModel } = await this.loadModels();
    const baseWhere = userId ? { createdBy: userId } : {};
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

    const parseNumber = (value: unknown) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const monthLabel = (date: Date) => `${date.getMonth() + 1}月`;

    const makePeriod = async (baseTitle: string, start: Date, end: Date) => {
      const where = {
        ...baseWhere,
        createdAt: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
      };

      const rows = await GoodsModel.findAll({
        where,
        attributes: ['id', 'name', 'weight', 'volume', 'freight', 'waybillNo', 'status', 'createdAt'],
        order: [['id', 'DESC']],
        raw: true,
      });

      const records = rows.map((item: any) => ({
        id: item.id,
        goodsId: item.id,
        goodsName: item.name,
        name: item.name,
        weight: parseNumber(item.weight),
        volume: parseNumber(item.volume),
        freight: parseNumber(item.freight),
        waybillNo: item.waybillNo,
        status: item.status,
        createdAt: item.createdAt,
      }));

      const goodsTotal = records.length;
      const totalAmount = Number(records.reduce((sum, record) => sum + record.freight, 0).toFixed(2));

      return {
        title: `${baseTitle}[${monthLabel(start)}]`,
        goodsTotal,
        goodsCount: goodsTotal,
        totalAmount,
        amountTotal: totalAmount,
        records,
      };
    };

    const [currentMonth, lastMonth] = await Promise.all([
      makePeriod('本月账单', currentMonthStart, nextMonthStart),
      makePeriod('上月账单', lastMonthStart, currentMonthStart),
    ]);

    const totalAmount = Number((currentMonth.totalAmount + lastMonth.totalAmount).toFixed(2));
    const totalGoods = currentMonth.goodsTotal + lastMonth.goodsTotal;

    const summary = {
      totalAmount,
      totalGoods,
    };

    return {
      summary,
      currentMonth,
      lastMonth,
    };
  }
}
