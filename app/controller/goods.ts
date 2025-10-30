import { Controller } from 'egg';

export default class GoodsController extends Controller {
  // 创建货物
  async create() {
    const { ctx } = this;
    ctx.validate({
      name: { type: 'string', required: false, allowEmpty: true, max: 128 },
      receiverName: { type: 'string', required: true, min: 1, max: 64 },
      receiverPhone: { type: 'string', required: true, format: /^1[3-9]\d{9}$/ },
      senderName: { type: 'string', required: true, min: 1, max: 64 },
      senderPhone: { type: 'string', required: true, format: /^1[3-9]\d{9}$/ },
      volume: { type: 'number', required: true, min: 0 },
      weight: { type: 'number', required: true, min: 0 },
      freight: { type: 'number', required: false, min: 0 },
      remark: { type: 'string', required: false, allowEmpty: true },
      images: { type: 'array', required: false },
    });
    const goodsData = ctx.request.body;
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
    ctx.validate({
      name: { type: 'string', required: false, allowEmpty: true, max: 128 },
      receiverName: { type: 'string', required: false, min: 1, max: 64 },
      receiverPhone: { type: 'string', required: false, format: /^1[3-9]\d{9}$/ },
      senderName: { type: 'string', required: false, min: 1, max: 64 },
      senderPhone: { type: 'string', required: false, format: /^1[3-9]\d{9}$/ },
      volume: { type: 'number', required: false, min: 0 },
      weight: { type: 'number', required: false, min: 0 },
      freight: { type: 'number', required: false, min: 0 },
      remark: { type: 'string', required: false, allowEmpty: true },
      images: { type: 'array', required: false },
      status: { type: 'string', required: false },
    });
    const id = ctx.params && ctx.params.id;
    const goodsData = ctx.request.body;
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
    ctx.validate({
      page: { type: 'number', required: false, min: 1 },
      pageSize: { type: 'number', required: false, min: 1, max: 100 },
      keyword: { type: 'string', required: false, allowEmpty: true },
      status: { type: 'string', required: false },
      receiverName: { type: 'string', required: false, allowEmpty: true },
      senderName: { type: 'string', required: false, allowEmpty: true },
    });
    const query = ctx.query;
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
    ctx.validate({
      page: { type: 'number', required: false, min: 1 },
      pageSize: { type: 'number', required: false, min: 1, max: 100 },
      keyword: { type: 'string', required: false, allowEmpty: true },
      status: { type: 'string', required: false },
      receiverName: { type: 'string', required: false, allowEmpty: true },
      senderName: { type: 'string', required: false, allowEmpty: true },
    });
    const query = ctx.query;
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
      status: { type: 'string', required: true },
    });
    const id = ctx.params && ctx.params.id;
    const status = ctx.request.body.status;
    const userId = ctx.state.user.userId;
    const goods = await ctx.service.goodsService.updateGoodsStatus(Number(id), status, userId);
    ctx.body = {
      code: 200,
      message: '状态更新成功',
      data: goods,
    };
  }
}
