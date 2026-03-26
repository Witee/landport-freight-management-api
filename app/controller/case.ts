import { Controller } from 'egg';

const normalizeTagsParam = (input: unknown): string[] => {
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
  return Array.from(new Set(collected));
};

export default class CaseController extends Controller {
  // 获取案例列表（支持 website-token 访问，所有认证用户可访问）
  async list() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    const rawTagsInput = typeof query.tags === 'string' ? query.tags : '';
    const tags = normalizeTagsParam(rawTagsInput);
    if (tags.length) {
      query.tags = tags;
    } else {
      delete query.tags;
    }
    (ctx.validate as any)(
      {
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        keyword: { type: 'string', required: false, allowEmpty: true },
        startDate: { type: 'string', required: false, allowEmpty: true },
        endDate: { type: 'string', required: false, allowEmpty: true },
        tags: { type: 'array', required: false, itemType: 'string' },
      },
      query
    );
    const result = await ctx.service.caseService.getCaseList(query);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  // 获取案例详情（支持 website-token 访问，所有认证用户可访问）
  async detail() {
    const { ctx } = this;
    const id = ctx.params && ctx.params.id;
    const numId = Number(id);
    if (!id || isNaN(numId)) {
      ctx.throw(400, '无效的案例 ID');
    }
    const caseItem = await ctx.service.caseService.getCaseDetail(numId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: caseItem,
    };
  }

  // 创建案例（仅 sysAdmin 或 admin）
  async create() {
    const { ctx } = this;
    // 检查管理员权限（通过 DC token 校验的都是 sysAdmin 或 admin）
    const dcUser = ctx.state && ctx.state.dcUser;
    const role = dcUser?.role;
    if (!dcUser || (role !== 'sysAdmin' && role !== 'admin')) {
      ctx.throw(403, '需要管理员权限');
    }
    const body = { ...ctx.request.body };
    const normalizedTags = normalizeTagsParam(body.tags);
    if (normalizedTags.length) {
      body.tags = normalizedTags;
    } else {
      delete body.tags;
    }
    // 清理内部字段的空值，避免验证错误
    if (!body.internalStatus || body.internalStatus === '') {
      delete body.internalStatus;
    }
    if (!body.internalWeight && body.internalWeight !== 0) {
      delete body.internalWeight;
    }
    if (!body.internalVehiclePlate) {
      delete body.internalVehiclePlate;
    }
    if (!body.internalImages || (Array.isArray(body.internalImages) && body.internalImages.length === 0)) {
      delete body.internalImages;
    }
    if (!body.internalRemark) {
      delete body.internalRemark;
    }
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: true, allowEmpty: false, max: 128 },
        date: { type: 'string', required: true, allowEmpty: false },
        images: { type: 'array', required: false },
        tags: { type: 'array', required: false, itemType: 'string' },
        // 内部字段验证
        internalWeight: { type: 'number', required: false, min: 0, max: 1000 },
        internalVehiclePlate: { type: 'string', required: false, max: 20 },
        internalImages: { type: 'array', required: false },
        internalStatus: { type: 'enum', required: false, values: ['pending', 'transporting', 'applying_license', 'arrived'] },
        internalRemark: { type: 'string', required: false, max: 500 },
      },
      body
    );
    const caseData = {
      projectName: body.projectName,
      date: body.date,
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      internalWeight: body.internalWeight !== undefined ? Number(body.internalWeight) : undefined,
      internalVehiclePlate: body.internalVehiclePlate,
      internalImages: Array.isArray(body.internalImages) ? body.internalImages : undefined,
      internalStatus: body.internalStatus,
      internalRemark: body.internalRemark,
    };
    const caseItem = await ctx.service.caseService.createCase(caseData);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data: caseItem,
    };
  }

  // 更新案例（仅 sysAdmin 或 admin）
  async update() {
    const { ctx } = this;
    // 检查管理员权限（通过 DC token 校验的都是 sysAdmin 或 admin）
    const dcUser = ctx.state && ctx.state.dcUser;
    const role = dcUser?.role;
    if (!dcUser || (role !== 'sysAdmin' && role !== 'admin')) {
      ctx.throw(403, '需要管理员权限');
    }
    const body = { ...ctx.request.body };
    const normalizedTags = normalizeTagsParam(body.tags);
    if (normalizedTags.length) {
      body.tags = normalizedTags;
    } else if (body.tags !== undefined) {
      body.tags = [];
    }
    // 清理内部字段的空值，避免验证错误
    if (!body.internalStatus || body.internalStatus === '') {
      delete body.internalStatus;
    }
    if (!body.internalWeight && body.internalWeight !== 0) {
      delete body.internalWeight;
    }
    if (!body.internalVehiclePlate) {
      delete body.internalVehiclePlate;
    }
    if (!body.internalImages || (Array.isArray(body.internalImages) && body.internalImages.length === 0)) {
      delete body.internalImages;
    }
    if (!body.internalRemark) {
      delete body.internalRemark;
    }
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: false, allowEmpty: false, max: 128 },
        date: { type: 'string', required: false, allowEmpty: false },
        images: { type: 'array', required: false },
        tags: { type: 'array', required: false, itemType: 'string' },
        // 内部字段验证
        internalWeight: { type: 'number', required: false, min: 0, max: 1000 },
        internalVehiclePlate: { type: 'string', required: false, max: 20 },
        internalImages: { type: 'array', required: false },
        internalStatus: { type: 'enum', required: false, values: ['pending', 'transporting', 'applying_license', 'arrived'] },
        internalRemark: { type: 'string', required: false, max: 500 },
      },
      body
    );
    const id = ctx.params && ctx.params.id;
    const numId = Number(id);
    if (!id || isNaN(numId)) {
      ctx.throw(400, '无效的案例 ID');
    }
    const caseData: any = {};
    if (body.projectName !== undefined) {
      caseData.projectName = body.projectName;
    }
    if (body.date !== undefined) {
      caseData.date = body.date;
    }
    if (body.images !== undefined) {
      caseData.images = Array.isArray(body.images) ? body.images : [];
    }
    if (body.tags !== undefined) {
      caseData.tags = Array.isArray(body.tags) ? body.tags : [];
    }
    // 内部字段
    if (body.internalWeight !== undefined) {
      caseData.internalWeight = Number(body.internalWeight);
    }
    if (body.internalVehiclePlate !== undefined) {
      caseData.internalVehiclePlate = body.internalVehiclePlate;
    }
    if (body.internalImages !== undefined) {
      caseData.internalImages = Array.isArray(body.internalImages) ? body.internalImages : [];
    }
    if (body.internalStatus !== undefined) {
      caseData.internalStatus = body.internalStatus;
    }
    if (body.internalRemark !== undefined) {
      caseData.internalRemark = body.internalRemark;
    }
    const caseItem = await ctx.service.caseService.updateCase(numId, caseData);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: caseItem,
    };
  }

  // 删除案例（仅 sysAdmin 或 admin）
  async delete() {
    const { ctx } = this;
    // 检查管理员权限（通过 DC token 校验的都是 sysAdmin 或 admin）
    const dcUser = ctx.state && ctx.state.dcUser;
    const role = dcUser?.role;
    if (!dcUser || (role !== 'sysAdmin' && role !== 'admin')) {
      ctx.throw(403, '需要管理员权限');
    }
    const id = ctx.params && ctx.params.id;
    const numId = Number(id);
    if (!id || isNaN(numId)) {
      ctx.throw(400, '无效的案例 ID');
    }
    await ctx.service.caseService.deleteCase(numId);
    ctx.body = {
      code: 200,
      message: '删除成功',
      data: null,
    };
  }
}

