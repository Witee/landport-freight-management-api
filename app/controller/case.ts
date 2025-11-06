import { Controller } from 'egg';

export default class CaseController extends Controller {
  // 获取案例列表（所有认证用户可访问）
  async list() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    (ctx.validate as any)(
      {
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        keyword: { type: 'string', required: false, allowEmpty: true },
        startDate: { type: 'string', required: false, allowEmpty: true },
        endDate: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    const result = await ctx.service.caseService.getCaseList(query);
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

  // 获取案例详情（所有认证用户可访问）
  async detail() {
    const { ctx } = this;
    const id = ctx.params && ctx.params.id;
    const caseItem = await ctx.service.caseService.getCaseDetail(Number(id));
    const j = caseItem && (caseItem as any).toJSON ? (caseItem as any).toJSON() : caseItem;
    j.images = Array.isArray(j.images) ? j.images : [];
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: j,
    };
  }

  // 创建案例（仅 admin）
  async create() {
    const { ctx } = this;
    // 检查管理员权限（通过adminAuth的都是admin）
    const adminUser = ctx.state && ctx.state.adminUser;
    const role = adminUser?.role;
    if (!adminUser || role !== 'admin') {
      ctx.throw(403, '需要管理员权限');
    }
    const body = ctx.request.body;
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: true, allowEmpty: false, max: 128 },
        date: { type: 'string', required: true, allowEmpty: false },
        images: { type: 'array', required: false },
      },
      body
    );
    const caseData = {
      projectName: body.projectName,
      date: body.date,
      images: Array.isArray(body.images) ? body.images : [],
    };
    const caseItem = await ctx.service.caseService.createCase(caseData);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data: caseItem && typeof caseItem.toJSON === 'function' ? caseItem.toJSON() : caseItem,
    };
  }

  // 更新案例（仅 admin）
  async update() {
    const { ctx } = this;
    // 检查管理员权限（通过adminAuth的都是admin）
    const adminUser = ctx.state && ctx.state.adminUser;
    const role = adminUser?.role;
    if (!adminUser || role !== 'admin') {
      ctx.throw(403, '需要管理员权限');
    }
    const body = ctx.request.body;
    (ctx.validate as any)(
      {
        projectName: { type: 'string', required: false, allowEmpty: false, max: 128 },
        date: { type: 'string', required: false, allowEmpty: false },
        images: { type: 'array', required: false },
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
    const caseItem = await ctx.service.caseService.updateCase(Number(id), caseData);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: caseItem && typeof caseItem.toJSON === 'function' ? caseItem.toJSON() : caseItem,
    };
  }

  // 删除案例（仅 admin）
  async delete() {
    const { ctx } = this;
    // 检查管理员权限（通过adminAuth的都是admin）
    const adminUser = ctx.state && ctx.state.adminUser;
    const role = adminUser?.role;
    if (!adminUser || role !== 'admin') {
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

