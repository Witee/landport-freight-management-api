import { Controller } from 'egg';
import fs from 'fs';
import path from 'path';
import * as bcrypt from 'bcryptjs';
import UserFactory from '../model/User.js';

// 金额字段列表
const DECIMAL_FIELDS = [
  'freight',
  'otherIncome',
  'fuelCost',
  'repairCost',
  'accommodationCost',
  'mealCost',
  'otherExpense',
] as const;

// 准备金额字段（字符串转数字）
const prepareDecimalFields = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return data;
  const cloned = { ...data } as Record<string, unknown>;
  for (const field of DECIMAL_FIELDS) {
    const value = cloned[field];
    if (value === '' || value === undefined || value === null) {
      // 保持原值，让 Service 层处理默认值
      continue;
    } else if (typeof value === 'string') {
      const num = Number(value);
      cloned[field] = Number.isFinite(num) ? num : 0;
    }
  }
  return cloned;
};

// 构建验证载荷（移除 null 值）
const buildValidationPayload = (data: Record<string, unknown>) => {
  if (!data || typeof data !== 'object') return data;
  const cloned = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(cloned)) {
    if (cloned[key] === null) delete cloned[key];
  }
  return cloned;
};

export default class FleetController extends Controller {
  // ========== 车辆管理 ==========

  // 获取车辆列表
  async listVehicles() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    (ctx.validate as any)(
      {
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        startDate: { type: 'string', required: false, allowEmpty: true },
        endDate: { type: 'string', required: false, allowEmpty: true },
        fleetId: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    const userId = ctx.state.user.userId;
    const result = await ctx.service.fleetService.getVehicleList(query, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  // 获取车辆详情
  async getVehicle() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车辆ID');
    }
    const userId = ctx.state.user.userId;
    const vehicle = await ctx.service.fleetService.getVehicleDetail(id, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: vehicle,
    };
  }

  // 创建车辆
  async createVehicle() {
    const { ctx } = this;
    const body = ctx.request.body;
    // 处理字段名映射：contactPhone -> phone
    if (body.contactPhone !== undefined && body.phone === undefined) {
      body.phone = body.contactPhone;
      delete body.contactPhone;
    }
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        brand: { type: 'string', required: true, allowEmpty: false, max: 100 },
        horsepower: { type: 'string', required: true, allowEmpty: false, max: 50 },
        loadCapacity: { type: 'string', required: true, allowEmpty: false, max: 50 },
        axleCount: { type: 'number', required: true, min: 1 },
        tireCount: { type: 'number', required: true, min: 1 },
        trailerLength: { type: 'string', required: true, allowEmpty: false, max: 50 },
        licensePlate: { type: 'string', required: false, allowEmpty: true, max: 20 },
        name: { type: 'string', required: false, allowEmpty: true, max: 100 },
        phone: { type: 'string', required: false, allowEmpty: true, max: 50 },
        certificateImages: { type: 'array', required: false },
        otherImages: { type: 'array', required: false },
      },
      validationPayload
    );
    const userId = ctx.state.user.userId;
    const vehicle = await ctx.service.fleetService.createVehicle(body, userId);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data: vehicle,
    };
  }

  // 更新车辆
  async updateVehicle() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车辆ID');
    }
    const body = ctx.request.body;
    // 处理字段名映射：contactPhone -> phone
    if (body.contactPhone !== undefined && body.phone === undefined) {
      body.phone = body.contactPhone;
      delete body.contactPhone;
    }
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        brand: { type: 'string', required: false, allowEmpty: false, max: 100 },
        horsepower: { type: 'string', required: false, allowEmpty: false, max: 50 },
        loadCapacity: { type: 'string', required: false, allowEmpty: false, max: 50 },
        axleCount: { type: 'number', required: false, min: 1 },
        tireCount: { type: 'number', required: false, min: 1 },
        trailerLength: { type: 'string', required: false, allowEmpty: false, max: 50 },
        licensePlate: { type: 'string', required: false, allowEmpty: true, max: 20 },
        name: { type: 'string', required: false, allowEmpty: true, max: 100 },
        phone: { type: 'string', required: false, allowEmpty: true, max: 50 },
        certificateImages: { type: 'array', required: false },
        otherImages: { type: 'array', required: false },
      },
      validationPayload
    );
    const userId = ctx.state.user.userId;
    const vehicle = await ctx.service.fleetService.updateVehicle(id, body, userId);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: vehicle,
    };
  }

  // 删除车辆
  async deleteVehicle() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车辆ID');
    }
    const userId = ctx.state.user.userId;
    await ctx.service.fleetService.deleteVehicle(id, userId);
    ctx.body = {
      code: 200,
      message: '删除成功',
      data: { success: true },
    };
  }

  // 上传车辆图片
  async uploadVehicleImage() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车辆ID');
    }

    try {
      const file = ctx.request.files?.[0] as any;
      if (!file) {
        ctx.throw(400, '未选择文件');
        return;
      }

      // 验证文件类型
      const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/gif']);
      const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.gif']);
      const mime: string = (file as any).mime || '';
      const ext = path.extname((file as any).filename || '').toLowerCase();
      if (!allowedMimes.has(mime) && !allowedExts.has(ext)) {
        ctx.throw(400, '只支持 jpg、png、gif 格式的图片');
      }

      // 验证文件大小
      const maxSize = 20 * 1024 * 1024;
      const fileSize: number = (file as any).size ?? fs.statSync((file as any).filepath).size;
      if (fileSize > maxSize) {
        ctx.throw(400, '图片大小不能超过 20MB');
      }

      // 获取图片类型
      const imageType = ctx.request.body?.imageType || ctx.query?.imageType;
      if (imageType !== 'certificate' && imageType !== 'other') {
        ctx.throw(400, 'imageType 必须是 certificate 或 other');
      }

      // 上传文件
      const userId = ctx.state.user.userId;
      const uploadResult = await this.uploadToCloudStorage(file, String(userId));

      // 添加到车辆
      await ctx.service.fleetService.addVehicleImage(id, uploadResult.relativeUrl, imageType, userId);

      ctx.body = {
        code: 200,
        message: '上传成功',
        data: {
          url: uploadResult.url,
        },
      };
    } catch (error: any) {
      ctx.logger.error('车辆图片上传失败:', error);
      if (error && (error.status || error.statusCode)) {
        throw error;
      }
      ctx.throw(500, '文件上传失败');
    } finally {
      await ctx.cleanupRequestFiles();
    }
  }

  // ========== 货运记录管理 ==========

  // 获取货运记录列表
  async listTransportRecords() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    (ctx.validate as any)(
      {
        vehicleId: { type: 'number', required: false, min: 1 },
        startDate: { type: 'string', required: false, allowEmpty: true },
        endDate: { type: 'string', required: false, allowEmpty: true },
        page: { type: 'number', required: false, min: 1 },
        pageSize: { type: 'number', required: false, min: 1, max: 100 },
        isReconciled: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    const userId = ctx.state.user.userId;
    const result = await ctx.service.fleetService.getTransportRecordList(query, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  // 获取货运记录详情
  async getTransportRecord() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的记录ID');
    }
    const userId = ctx.state.user.userId;
    const record = await ctx.service.fleetService.getTransportRecordDetail(id, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: record,
    };
  }

  // 创建货运记录
  async createTransportRecord() {
    const { ctx } = this;
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        vehicleId: { type: 'number', required: true, min: 1 },
        goodsName: { type: 'string', required: true, allowEmpty: false, max: 200 },
        date: { type: 'string', required: true, allowEmpty: false },
        freight: { type: 'string', required: true, allowEmpty: false },
        otherIncome: { type: 'string', required: true, allowEmpty: false },
        fuelCost: { type: 'string', required: true, allowEmpty: false },
        repairCost: { type: 'string', required: true, allowEmpty: false },
        accommodationCost: { type: 'string', required: true, allowEmpty: false },
        mealCost: { type: 'string', required: true, allowEmpty: false },
        otherExpense: { type: 'string', required: true, allowEmpty: false },
        remark: { type: 'string', required: false, allowEmpty: true },
        images: { type: 'array', required: false },
      },
      validationPayload
    );
    const recordData = prepareDecimalFields(body);
    const userId = ctx.state.user.userId;
    const record = await ctx.service.fleetService.createTransportRecord(recordData, userId);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data: record,
    };
  }

  // 更新货运记录
  async updateTransportRecord() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的记录ID');
    }
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        vehicleId: { type: 'number', required: false, min: 1 },
        goodsName: { type: 'string', required: false, allowEmpty: false, max: 200 },
        date: { type: 'string', required: false, allowEmpty: false },
        freight: { type: 'string', required: false, allowEmpty: false },
        otherIncome: { type: 'string', required: false, allowEmpty: false },
        fuelCost: { type: 'string', required: false, allowEmpty: false },
        repairCost: { type: 'string', required: false, allowEmpty: false },
        accommodationCost: { type: 'string', required: false, allowEmpty: false },
        mealCost: { type: 'string', required: false, allowEmpty: false },
        otherExpense: { type: 'string', required: false, allowEmpty: false },
        remark: { type: 'string', required: false, allowEmpty: true },
        images: { type: 'array', required: false },
        isReconciled: { type: 'boolean', required: false },
      },
      validationPayload
    );
    const recordData = prepareDecimalFields(body);
    const userId = ctx.state.user.userId;
    const record = await ctx.service.fleetService.updateTransportRecord(id, recordData, userId);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: record,
    };
  }

  // 删除货运记录
  async deleteTransportRecord() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的记录ID');
    }
    const userId = ctx.state.user.userId;
    await ctx.service.fleetService.deleteTransportRecord(id, userId);
    ctx.body = {
      code: 200,
      message: '删除成功',
      data: { success: true },
    };
  }

  // ========== 统计接口 ==========

  // 获取总览统计
  async getOverviewStats() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    
    // 参数验证
    (ctx.validate as any)(
      {
        startDate: { type: 'string', required: true, allowEmpty: false },
        endDate: { type: 'string', required: true, allowEmpty: false },
        fleetId: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );

    const { startDate, endDate } = query;

    // 日期格式验证
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      ctx.throw(400, '日期格式错误，必须为 YYYY-MM-DD 格式');
    }

    // 日期有效性验证
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      ctx.throw(400, '无效的日期值');
    }

    // 日期范围验证
    if (start > end) {
      ctx.throw(400, 'startDate 不能大于 endDate');
    }

    // 日期范围限制（不超过1年）
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      ctx.throw(400, '日期范围不能超过1年');
    }

    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getOverviewStats(userId, { startDate, endDate, fleetId: query.fleetId });
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 获取对账统计
  async getReconciliationStats() {
    const { ctx } = this;
    const query = { ...ctx.query } as any;
    (ctx.validate as any)(
      {
        startDate: { type: 'string', required: false, allowEmpty: true },
        endDate: { type: 'string', required: false, allowEmpty: true },
        vehicleId: { type: 'number', required: false, min: 1 },
        period: {
          type: 'enum',
          required: false,
          values: ['last30days', 'thisMonth', 'thisYear', 'lastYear', 'custom'],
        },
        isReconciled: { type: 'string', required: false, allowEmpty: true },
      },
      query
    );
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getReconciliationStats(query, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // ========== 车队管理 ==========

  // 账号密码登录（车队管理）
  async login() {
    const { ctx, app } = this;
    ctx.validate({
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, allowEmpty: false },
    });

    const { username, password } = ctx.request.body;

    // 获取或加载 User 模型
    const UserModel = (ctx.model as any)?.User || UserFactory(app as any);
    // 本地环境按需同步，确保新增列（如 username、password）存在
    try {
      const syncConfig = (app.config as any).sequelize?.sync;
      const shouldSync = app.config.env === 'local' && !!syncConfig;
      if (shouldSync && UserModel?.sync) {
        const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
        await UserModel.sync(syncOptions);
      }
    } catch {}

    // 查找用户
    const user: any = await UserModel.findOne({
      where: { username },
    });

    if (!user) {
      ctx.throw(401, '用户名或密码错误');
    }

    // 验证密码
    if (!user.password) {
      ctx.throw(401, '该用户未设置密码');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ctx.throw(401, '用户名或密码错误');
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 颁发 JWT token（使用 lpwx 系统的 jwt 配置，与微信小程序登录保持一致）
    const token = (app as any).jwt.sign(
      { userId: user.id, role: user.role },
      (app.config as any).jwt.secret,
      {
        expiresIn: (app.config as any).jwt.expiresIn,
      }
    );

    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
    };
  }

  // 获取车队列表
  async listFleets() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getFleetList(userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 创建车队
  async createFleet() {
    const { ctx } = this;
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        name: { type: 'string', required: true, allowEmpty: false, max: 100 },
        description: { type: 'string', required: false, allowEmpty: true },
      },
      validationPayload
    );
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.createFleet(body, userId);
    ctx.body = {
      code: 200,
      message: '创建成功',
      data,
    };
  }

  // 获取车队详情
  async getFleet() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getFleetDetail(id, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 更新车队信息
  async updateFleet() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const body = ctx.request.body;
    const validationPayload = buildValidationPayload(body);
    (ctx.validate as any)(
      {
        name: { type: 'string', required: false, allowEmpty: false, max: 100 },
        description: { type: 'string', required: false, allowEmpty: true },
      },
      validationPayload
    );
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.updateFleet(id, body, userId);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data,
    };
  }

  // 删除车队
  async deleteFleet() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const userId = ctx.state.user.userId;
    await ctx.service.fleetService.deleteFleet(id, userId);
    ctx.body = {
      code: 200,
      message: '删除成功',
    };
  }

  // 获取车队成员列表
  async listFleetMembers() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getFleetMembers(id, userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 添加车队成员
  async addFleetMember() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const body = ctx.request.body;
    (ctx.validate as any)(
      {
        userId: { type: 'number', required: true, min: 1 },
      },
      body
    );
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.addFleetMember(id, body.userId, userId);
    ctx.body = {
      code: 200,
      message: '添加成功',
      data,
    };
  }

  // 移除车队成员
  async removeFleetMember() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    const memberId = Number(ctx.params && (ctx.params as any).memberId);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    if (!Number.isFinite(memberId) || memberId <= 0) {
      ctx.throw(400, '无效的成员ID');
    }
    const userId = ctx.state.user.userId;
    await ctx.service.fleetService.removeFleetMember(id, memberId, userId);
    ctx.body = {
      code: 200,
      message: '移除成功',
    };
  }

  // 更新车队成员角色
  async updateFleetMemberRole() {
    const { ctx } = this;
    const id = Number(ctx.params && ctx.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      ctx.throw(400, '无效的车队ID');
    }
    const body = ctx.request.body;
    (ctx.validate as any)(
      {
        memberId: { type: 'number', required: true, min: 1 },
        role: { type: 'enum', required: true, values: ['admin', 'member'] },
      },
      body
    );
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.updateFleetMemberRole(id, body.memberId, body.role, userId);
    ctx.body = {
      code: 200,
      message: '更新成功',
      data,
    };
  }

  // 搜索用户
  async searchUsers() {
    const { ctx } = this;
    const keyword = ctx.query.keyword as string;
    const data = await ctx.service.fleetService.searchUsers(keyword);
    ctx.body = {
      code: 200,
      message: '搜索成功',
      data,
    };
  }

  // 获取我的车队列表（用于下拉菜单）
  async getMyFleets() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const data = await ctx.service.fleetService.getFleetList(userId);
    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  // 上传到云存储（复用 upload controller 的逻辑）
  private async uploadToCloudStorage(file: any, userId: string) {
    // 本地存储（仅用于开发环境示例）- 分目录：uploads/YYYY-MM-DD/{userId}/
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const dateDir = `${yyyy}-${mm}-${dd}`;
    const subDir = path.join(dateDir, safeUserId);
    // 支持通过环境变量配置线上统一的上传目录（优先）
    // 若未设置，则沿用默认逻辑：使用项目内 app/uploads
    const appCfg: any = (this.app && (this.app.config as any)) || {};
    const resolvedUploadRoot =
      (appCfg.uploadRootDir && String(appCfg.uploadRootDir).trim()) ||
      (appCfg.uploadPublicDir && String(appCfg.uploadPublicDir).trim()) ||
      path.join(process.cwd(), 'app/uploads');
    const uploadDir = path.join(resolvedUploadRoot, subDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${
      path.extname(file.filename || '') || '.png'
    }`;
    const targetPath = path.join(uploadDir, filename);

    // 直接拷贝临时文件到目标路径，避免流事件的不确定性
    await fs.promises.copyFile(file.filepath, targetPath);

    const assetHostRaw = (appCfg.assetHost && String(appCfg.assetHost).trim()) || '';
    const assetHost = assetHostRaw.replace(/\/+$/, '');

    const relativeUrl = `/uploads/${subDir.replace(/\\/g, '/')}/${filename}`;
    const publicPath = `/landport${relativeUrl}`;
    const fullUrl = assetHost ? `${assetHost}${publicPath}` : publicPath;
    return { url: fullUrl, relativeUrl, publicPath, filename };
  }
}

