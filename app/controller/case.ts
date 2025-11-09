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
    const rawTagsInput = (ctx.queries as any)?.tags ?? query.tags;
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
    const caseItem = await ctx.service.caseService.getCaseDetail(Number(id));
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
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: true, allowEmpty: false, max: 128 },
        date: { type: 'string', required: true, allowEmpty: false },
        images: { type: 'array', required: false },
        tags: { type: 'array', required: false, itemType: 'string' },
      },
      body
    );
    const caseData = {
      projectName: body.projectName,
      date: body.date,
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : undefined,
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
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: false, allowEmpty: false, max: 128 },
        date: { type: 'string', required: false, allowEmpty: false },
        images: { type: 'array', required: false },
        tags: { type: 'array', required: false, itemType: 'string' },
      },
      body
    );
    const id = ctx.params && ctx.params.id;
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
    const caseItem = await ctx.service.caseService.updateCase(Number(id), caseData);
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
    await ctx.service.caseService.deleteCase(Number(id));
    ctx.body = {
      code: 200,
      message: '删除成功',
      data: null,
    };
  }
}

