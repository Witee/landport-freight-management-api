import { Controller } from 'egg';

const NUMERIC_FIELDS = ['volume', 'weight', 'freight'] as const;

const buildValidationPayload = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return data;
  const cloned = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(cloned)) {
    if (cloned[key] === null) delete cloned[key];
  }
  for (const field of NUMERIC_FIELDS) {
    if (cloned[field] === '') delete cloned[field];
  }
  return cloned;
};

const prepareGoodsPayload = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return data;
  const cloned = { ...data } as Record<string, unknown>;
  for (const field of NUMERIC_FIELDS) {
    const value = cloned[field];
    if (value === '' || value === undefined) {
      cloned[field] = null;
    } else if (typeof value === 'string') {
      const num = Number(value);
      cloned[field] = Number.isFinite(num) ? num : null;
    }
  }
  return cloned;
};

export default class GoodsController extends Controller {
  // 创建货物
  async create() {
    const { ctx } = this;
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        name: { type: 'string', required: false, allowEmpty: true, max: 128 },
        waybillNo: { type: 'string', required: false, allowEmpty: true, max: 64 },
        receiverName: { type: 'string', required: false, min: 1, max: 64 },
        receiverPhone: { type: 'string', required: false, allowEmpty: true },
        senderName: { type: 'string', required: false, min: 1, max: 64 },
        senderPhone: { type: 'string', required: false, allowEmpty: true },
        volume: { type: 'number', required: false, min: 0 },
        weight: { type: 'number', required: false, min: 0 },
        freight: { type: 'number', required: false, min: 0 },
        remark: { type: 'string', required: false, allowEmpty: true },
        images: { type: 'array', required: false },
        status: {
          type: 'enum',
          required: false,
          values: ['collected', 'transporting', 'delivered', 'cancelled', 'exception'],
        },
      },
      validationPayload
    );
    const goodsData = prepareGoodsPayload(body) as any;
    const userId = ctx.state.user.userId;
    const goods = await ctx.service.goodsService.createGoods(goodsData, userId);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data: goods,
    };
  }

  // 更新货物
  async update() {
    const { ctx } = this;
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        name: { type: 'string', required: false, allowEmpty: true, max: 128 },
        waybillNo: { type: 'string', required: false, allowEmpty: true, max: 64 },
        receiverName: { type: 'string', required: false, min: 1, max: 64 },
        receiverPhone: { type: 'string', required: false, allowEmpty: true },
        senderName: { type: 'string', required: false, min: 1, max: 64 },
        senderPhone: { type: 'string', required: false, allowEmpty: true },
        volume: { type: 'number', required: false, min: 0 },
        weight: { type: 'number', required: false, min: 0 },
        freight: { type: 'number', required: false, min: 0 },
        remark: { type: 'string', required: false, allowEmpty: true },
        images: { type: 'array', required: false },
        status: {
          type: 'enum',
          required: false,
          values: ['collected', 'transporting', 'delivered', 'cancelled', 'exception'],
        },
      },
      validationPayload
    );
    const id = ctx.params && ctx.params.id;
    const goodsData = prepareGoodsPayload(body) as any;
    const userId = ctx.state.user.userId;
    const goods = await ctx.service.goodsService.updateGoods(Number(id), goodsData, userId);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: goods,
    };
  }

  // 删除货物
  async delete() {
    const { ctx } = this;
    const id = ctx.params && ctx.params.id;
    const userId = ctx.state.user.userId;
    await ctx.service.goodsService.deleteGoods(Number(id), userId);
    ctx.body = {
      code: 200,
      message: '删除成功',
      data: null,
    };
  }

  // 获取货物列表（用户自己的）
  async list() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    if (Array.isArray(query.status)) {
      query.status = query.status.join(',');
    }
    (ctx.validate as any)(
      {
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        keyword: { type: 'string', required: false, allowEmpty: true },
        status: { type: 'string', required: false },
        receiverName: { type: 'string', required: false, allowEmpty: true },
        senderName: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    const userId = ctx.state.user.userId;
    const result = await ctx.service.goodsService.getGoodsList(query, userId);
    // 兜底：images 字段为 null 时转为空数组，避免前端判空麻烦
    const normalized = {
      ...result,
      list: (result.list || []).map((item: any) => {
        const j = item && item.toJSON ? item.toJSON() : item;
        j.images = Array.isArray(j.images) ? j.images : [];
        return j;
      }),
    };
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: normalized,
    };
  }

  // 获取所有货物列表（管理员）
  async listAll() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    if (Array.isArray(query.status)) {
      query.status = query.status.join(',');
    }
    (ctx.validate as any)(
      {
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        keyword: { type: 'string', required: false, allowEmpty: true },
        status: { type: 'string', required: false },
        receiverName: { type: 'string', required: false, allowEmpty: true },
        senderName: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    // 检查管理员权限
    const hasPermission = await ctx.service.userService.checkPermission(ctx.state.user.userId, 'admin');
    if (!hasPermission) {
      ctx.throw(403, '无权查看所有货物');
    }
    const result = await ctx.service.goodsService.getGoodsList(query, undefined);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  // 统计数据
  async stats() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const data = await ctx.service.goodsService.getGoodsStats(userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 对账信息
  async reconciliation() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const data = await ctx.service.goodsService.getGoodsReconciliation(userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 获取货物详情
  async detail() {
    const { ctx } = this;
    const id = ctx.params && ctx.params.id;
    const userId = ctx.state.user.userId;
    const goods = await ctx.service.goodsService.getGoodsDetail(Number(id), userId);
    const j = goods && (goods as any).toJSON ? (goods as any).toJSON() : goods;
    j.images = Array.isArray(j.images) ? j.images : [];
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: j,
    };
  }

  // 更新货物状态
  async updateStatus() {
    const { ctx } = this;
    ctx.validate({
      status: {
        type: 'enum',
        required: true,
        values: ['collected', 'transporting', 'delivered', 'cancelled', 'exception'],
      },
    });
    const id = ctx.params && ctx.params.id;
    const status = ctx.request.body.status;
    const userId = ctx.state.user.userId;
    const goods = await ctx.service.goodsService.updateGoodsStatus(Number(id), status, userId);
    ctx.body = {
      code: 200,
      message: '状态更新成功',
      data: goods && typeof goods.toJSON === 'function' ? goods.toJSON() : goods,
    };
  }
}
