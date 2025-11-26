import { Service } from 'egg';
import { Op, literal } from 'sequelize';
import VehicleFactory from '../model/Vehicle.js';
import TransportRecordFactory from '../model/TransportRecord.js';
import CertificateShareTokenFactory from '../model/CertificateShareToken.js';
import UserFactory from '../model/User.js';
import { randomUUID } from 'crypto';

// 本地进程内标记：避免重复 sync（仅用于 local 环境开发）
let __modelsSyncedFlag = false;

export default class FleetService extends Service {
  // 本地辅助：确保模型已加载、关联已建立，并在本地环境按需执行一次 sync
  private async loadModels() {
    const { ctx } = this;
    const appAny = this.app as any;
    const VehicleModel = (ctx.model as any)?.Vehicle || VehicleFactory(appAny);
    const TransportRecordModel = (ctx.model as any)?.TransportRecord || TransportRecordFactory(appAny);
    const CertificateShareTokenModel = (ctx.model as any)?.CertificateShareToken || CertificateShareTokenFactory(appAny);
    const UserModel = (ctx.model as any)?.User || UserFactory(appAny);

    // 建立关联
    if (TransportRecordModel && VehicleModel && !TransportRecordModel.associations?.vehicle) {
      TransportRecordModel.belongsTo(VehicleModel, { as: 'vehicle', foreignKey: 'vehicleId' });
    }
    if (CertificateShareTokenModel && VehicleModel && !CertificateShareTokenModel.associations?.vehicle) {
      CertificateShareTokenModel.belongsTo(VehicleModel, { as: 'vehicle', foreignKey: 'vehicleId' });
    }
    if (VehicleModel && UserModel && !VehicleModel.associations?.user) {
      VehicleModel.belongsTo(UserModel, { as: 'user', foreignKey: 'userId' });
    }

    const syncConfig = (this.app.config as any).sequelize?.sync;
    const shouldSync = this.app.config.env === 'local' && !!syncConfig;
    if (shouldSync && !__modelsSyncedFlag) {
      const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
      // 先同步用户表，再同步依赖其外键的表
      if (UserModel?.sync) await UserModel.sync(syncOptions);
      if (VehicleModel?.sync) await VehicleModel.sync(syncOptions);
      if (TransportRecordModel?.sync) await TransportRecordModel.sync(syncOptions);
      if (CertificateShareTokenModel?.sync) await CertificateShareTokenModel.sync(syncOptions);
      __modelsSyncedFlag = true;
    }
    return { VehicleModel, TransportRecordModel, CertificateShareTokenModel, UserModel } as const;
  }

  // ========== 车辆管理 ==========

  // 创建车辆
  async createVehicle(vehicleData: any, userId: number) {
    const { VehicleModel } = await this.loadModels();
    const payload: any = { ...vehicleData, userId };
    // 确保图片数组格式正确
    if (payload.certificateImages && !Array.isArray(payload.certificateImages)) {
      payload.certificateImages = null;
    }
    if (payload.otherImages && !Array.isArray(payload.otherImages)) {
      payload.otherImages = null;
    }
    return await VehicleModel.create(payload);
  }

  // 更新车辆
  async updateVehicle(id: number, vehicleData: any, userId: number) {
    const { ctx } = this;
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findOne({
      where: { id, userId },
    });
    if (!vehicle) {
      ctx.throw(403, '车辆不存在或无权操作');
    }
    // 处理图片数组
    const updateData: any = { ...vehicleData };
    if (updateData.certificateImages !== undefined) {
      updateData.certificateImages = Array.isArray(updateData.certificateImages) ? updateData.certificateImages : null;
    }
    if (updateData.otherImages !== undefined) {
      updateData.otherImages = Array.isArray(updateData.otherImages) ? updateData.otherImages : null;
    }
    return await vehicle.update(updateData);
  }

  // 删除车辆
  async deleteVehicle(id: number, userId: number) {
    const { ctx } = this;
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findOne({
      where: { id, userId },
    });
    if (vehicle) {
      await vehicle.destroy();
      return true;
    } else {
      ctx.throw(403, '车辆不存在或无权操作');
    }
  }

  // 获取车辆列表
  async getVehicleList(query: any, userId: number) {
    const { page = 1, pageSize = 10, startDate, endDate } = query;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const { VehicleModel, TransportRecordModel } = await this.loadModels();
    const sequelize = VehicleModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    // 获取用户的所有车辆（总是返回所有车辆）
    const vehicles = await VehicleModel.findAll({
      where: { userId },
      attributes: ['id', 'brand', 'horsepower', 'loadCapacity', 'axleCount', 'tireCount', 'trailerLength', 'certificateImages', 'otherImages', 'createdAt', 'updatedAt'],
    });

    if (vehicles.length === 0) {
      return {
        list: [],
        pagination: {
          total: 0,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: 0,
        },
      };
    }

    const vehicleIds = vehicles.map((v: any) => v.id);

    // 计算日期范围（如果未提供，默认最近30天）
    let dateStart: Date;
    let dateEnd: Date = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    if (startDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
    } else {
      // 默认最近30天
      dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - 30);
      dateStart.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // 构建日期过滤条件
    const dateWhere: any[] = [
      literal(`DATE(\`date\`) >= '${dateStart.toISOString().split('T')[0]}'`),
      literal(`DATE(\`date\`) <= '${dateEnd.toISOString().split('T')[0]}'`),
    ];

    // 构建查询条件（用于计算统计信息）
    const where: any = {
      vehicleId: { [Op.in]: vehicleIds },
      [Op.and]: dateWhere,
    };

    // 按车辆聚合计算收入和支出（在指定日期范围内）
    const vehicleStats = await TransportRecordModel.findAll({
      where,
      attributes: [
        'vehicleId',
        [sequelize.fn('SUM', sequelize.literal('freight + otherIncome')), 'income'],
        [sequelize.fn('SUM', sequelize.literal('fuelCost + repairCost + accommodationCost + mealCost + otherExpense')), 'expense'],
      ],
      group: ['vehicleId'],
      raw: true,
    });

    // 构建统计信息映射
    const statsMap = new Map(
      vehicleStats.map((stat: any) => {
        const income = Number(stat.income || 0);
        const expense = Number(stat.expense || 0);
        return [
          stat.vehicleId,
          {
            income,
            expense,
            profit: income - expense,
          },
        ];
      })
    );

    // 为每辆车添加统计信息（如果没有记录，显示0）
    const vehiclesWithStats = vehicles.map((v: any) => {
      const stats = statsMap.get(v.id) || { income: 0, expense: 0, profit: 0 };
      return {
        vehicle: v,
        ...stats,
      };
    });

    // 固定按利润降序排序
    vehiclesWithStats.sort((a, b) => b.profit - a.profit);

    // 应用分页
    const total = vehiclesWithStats.length;
    const paginated = vehiclesWithStats.slice(
      (pageNum - 1) * pageSizeNum,
      pageNum * pageSizeNum
    );

    // 格式化返回数据，包含统计信息
    const formattedList = paginated.map((item) => {
      const formatted = this.formatVehicleItem(item.vehicle);
      return {
        ...formatted,
        income: String(item.income),
        expense: String(item.expense),
        profit: String(item.profit),
      };
    });

    return {
      list: formattedList,
      pagination: {
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  // 获取车辆详情
  async getVehicleDetail(id: number, userId: number) {
    const { ctx } = this;
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findOne({
      where: { id, userId },
    });
    if (!vehicle) {
      ctx.throw(403, '车辆不存在或无权访问');
    }
    return this.formatVehicleItem(vehicle);
  }

  // 添加车辆图片
  async addVehicleImage(id: number, imageUrl: string, imageType: 'certificate' | 'other', userId: number) {
    const { ctx } = this;
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findOne({
      where: { id, userId },
    });
    if (!vehicle) {
      ctx.throw(403, '车辆不存在或无权操作');
    }

    const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
    const fieldName = imageType === 'certificate' ? 'certificateImages' : 'otherImages';
    const current = Array.isArray(vehicleData[fieldName]) ? vehicleData[fieldName] : [];
    const updated = [...current, imageUrl];

    await vehicle.update({ [fieldName]: updated });
    return this.formatVehicleItem(vehicle);
  }

  // 格式化车辆数据
  private formatVehicleItem(vehicle: any) {
    const raw = vehicle && typeof vehicle.toJSON === 'function' ? vehicle.toJSON() : vehicle;
    return {
      ...raw,
      certificateImages: Array.isArray(raw.certificateImages) ? raw.certificateImages : [],
      otherImages: Array.isArray(raw.otherImages) ? raw.otherImages : [],
    };
  }

  // ========== 货运记录管理 ==========

  // 创建货运记录
  async createTransportRecord(recordData: any, userId: number) {
    const { ctx } = this;
    const { TransportRecordModel, VehicleModel } = await this.loadModels();

    // 验证 vehicleId 属于当前用户
    const vehicle = await VehicleModel.findOne({
      where: { id: recordData.vehicleId, userId },
    });
    if (!vehicle) {
      ctx.throw(403, '车辆不存在或不属于当前用户');
    }

    // 转换金额字段为数字
    const payload: any = {
      ...recordData,
      freight: this.parseDecimal(recordData.freight),
      otherIncome: this.parseDecimal(recordData.otherIncome),
      fuelCost: this.parseDecimal(recordData.fuelCost),
      repairCost: this.parseDecimal(recordData.repairCost),
      accommodationCost: this.parseDecimal(recordData.accommodationCost),
      mealCost: this.parseDecimal(recordData.mealCost),
      otherExpense: this.parseDecimal(recordData.otherExpense),
    };

    // 处理图片数组
    if (payload.images && !Array.isArray(payload.images)) {
      payload.images = null;
    }

    return await TransportRecordModel.create(payload);
  }

  // 更新货运记录
  async updateTransportRecord(id: number, recordData: any, userId: number) {
    const { ctx } = this;
    const { TransportRecordModel, VehicleModel } = await this.loadModels();

    // 查找记录并验证车辆归属
    const record = await TransportRecordModel.findOne({
      where: { id },
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          where: { userId },
          required: true,
        },
      ],
    });

    if (!record) {
      ctx.throw(403, '记录不存在或无权操作');
    }

    // 如果更新了 vehicleId，需要验证新车辆属于当前用户
    if (recordData.vehicleId && recordData.vehicleId !== record.vehicleId) {
      const newVehicle = await VehicleModel.findOne({
        where: { id: recordData.vehicleId, userId },
      });
      if (!newVehicle) {
        ctx.throw(403, '车辆不存在或不属于当前用户');
      }
    }

    // 转换金额字段
    const updateData: any = { ...recordData };
    if (updateData.freight !== undefined) updateData.freight = this.parseDecimal(updateData.freight);
    if (updateData.otherIncome !== undefined) updateData.otherIncome = this.parseDecimal(updateData.otherIncome);
    if (updateData.fuelCost !== undefined) updateData.fuelCost = this.parseDecimal(updateData.fuelCost);
    if (updateData.repairCost !== undefined) updateData.repairCost = this.parseDecimal(updateData.repairCost);
    if (updateData.accommodationCost !== undefined) updateData.accommodationCost = this.parseDecimal(updateData.accommodationCost);
    if (updateData.mealCost !== undefined) updateData.mealCost = this.parseDecimal(updateData.mealCost);
    if (updateData.otherExpense !== undefined) updateData.otherExpense = this.parseDecimal(updateData.otherExpense);

    // 处理图片数组
    if (updateData.images !== undefined) {
      updateData.images = Array.isArray(updateData.images) ? updateData.images : null;
    }

    return await record.update(updateData);
  }

  // 删除货运记录
  async deleteTransportRecord(id: number, userId: number) {
    const { ctx } = this;
    const { TransportRecordModel, VehicleModel } = await this.loadModels();

    const record = await TransportRecordModel.findOne({
      where: { id },
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          where: { userId },
          required: true,
        },
      ],
    });

    if (record) {
      await record.destroy();
      return true;
    } else {
      ctx.throw(403, '记录不存在或无权操作');
    }
  }

  // 获取货运记录列表
  async getTransportRecordList(query: any, userId: number) {
    const { page = 1, pageSize = 10, vehicleId, startDate, endDate, isReconciled } = query;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const { TransportRecordModel, VehicleModel } = await this.loadModels();

    // 构建查询条件
    const where: any = {};
    if (vehicleId) {
      // 验证 vehicleId 属于当前用户
      const vehicle = await VehicleModel.findOne({
        where: { id: vehicleId, userId },
      });
      if (!vehicle) {
        const { ctx } = this;
        ctx.throw(403, '车辆不存在或不属于当前用户');
      }
      where.vehicleId = vehicleId;
    } else {
      // 如果没有指定 vehicleId，需要关联查询确保只返回当前用户的车辆记录
      // 这里使用子查询方式
      const userVehicles = await VehicleModel.findAll({
        where: { userId },
        attributes: ['id'],
        raw: true,
      });
      const vehicleIds = userVehicles.map((v: any) => v.id);
      if (vehicleIds.length === 0) {
        return {
          list: [],
          pagination: {
            total: 0,
            page: pageNum,
            pageSize: pageSizeNum,
            totalPages: 0,
          },
        };
      }
      where.vehicleId = { [Op.in]: vehicleIds };
    }

    if (startDate || endDate) {
      // 使用 MySQL 的 DATE() 函数来比较日期部分，避免时间部分的影响
      // 因为数据库中 date 字段可能存储为 DATETIME 类型（如 2025-11-26 08:00:00）
      const dateConditions: any[] = [];
      if (startDate) {
        // DATE(date) >= '2025-10-27'
        dateConditions.push(
          literal(`DATE(\`date\`) >= '${String(startDate).trim()}'`)
        );
      }
      if (endDate) {
        // DATE(date) <= '2025-11-26'
        dateConditions.push(
          literal(`DATE(\`date\`) <= '${String(endDate).trim()}'`)
        );
      }
      if (dateConditions.length > 0) {
        where[Op.and] = [...(where[Op.and] || []), ...dateConditions];
      }
    }

    // 对账状态筛选
    if (isReconciled !== undefined && isReconciled !== null && isReconciled !== '') {
      const reconciledValue = isReconciled === 'true' || isReconciled === true || isReconciled === 1;
      where.isReconciled = reconciledValue;
    }

    const { count, rows } = await TransportRecordModel.findAndCountAll({
      where,
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          attributes: ['id', 'brand'],
        },
      ],
    });

    const formattedList = rows.map((row) => this.formatTransportRecordItem(row));

    return {
      list: formattedList,
      pagination: {
        total: count,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(count / pageSizeNum),
      },
    };
  }

  // 获取货运记录详情
  async getTransportRecordDetail(id: number, userId: number) {
    const { ctx } = this;
    const { TransportRecordModel, VehicleModel } = await this.loadModels();

    const record = await TransportRecordModel.findOne({
      where: { id },
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          where: { userId },
          required: true,
        },
      ],
    });

    if (!record) {
      ctx.throw(403, '记录不存在或无权访问');
    }

    return this.formatTransportRecordItem(record);
  }

  // 格式化货运记录数据
  private formatTransportRecordItem(record: any) {
    const raw = record && typeof record.toJSON === 'function' ? record.toJSON() : record;
    return {
      ...raw,
      images: Array.isArray(raw.images) ? raw.images : [],
      // 确保金额字段为字符串（前端要求）
      freight: String(raw.freight || '0'),
      otherIncome: String(raw.otherIncome || '0'),
      fuelCost: String(raw.fuelCost || '0'),
      repairCost: String(raw.repairCost || '0'),
      accommodationCost: String(raw.accommodationCost || '0'),
      mealCost: String(raw.mealCost || '0'),
      otherExpense: String(raw.otherExpense || '0'),
    };
  }

  // 解析金额字段
  private parseDecimal(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  // ========== 统计接口 ==========

  // 获取总览统计数据
  async getOverviewStats(userId: number, query: { startDate: string; endDate: string }) {
    const { TransportRecordModel, VehicleModel } = await this.loadModels();
    const sequelize = TransportRecordModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const { startDate, endDate } = query;

    // 获取用户的所有车辆
    const vehicles = await VehicleModel.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true,
    });
    const vehicleIds = vehicles.map((v: any) => v.id);

    if (vehicleIds.length === 0) {
      return {
        totalProfit: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // 构建日期过滤条件（使用 DATE() 函数避免时间部分的影响）
    const dateWhere: any[] = [];
    if (startDate) {
      dateWhere.push(literal(`DATE(\`date\`) >= '${String(startDate).trim()}'`));
    }
    if (endDate) {
      dateWhere.push(literal(`DATE(\`date\`) <= '${String(endDate).trim()}'`));
    }

    // 构建完整的 where 条件
    const where: any = {
      vehicleId: { [Op.in]: vehicleIds },
    };
    if (dateWhere.length > 0) {
      where[Op.and] = [...(where[Op.and] || []), ...dateWhere];
    }

    // 计算总收入和总支出
    const incomeResult = await TransportRecordModel.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('freight + otherIncome')), 'totalIncome'],
        [sequelize.fn('SUM', sequelize.literal('fuelCost + repairCost + accommodationCost + mealCost + otherExpense')), 'totalExpense'],
      ],
      raw: true,
    });

    const totalIncome = Number((incomeResult as any)?.totalIncome || 0);
    const totalExpense = Number((incomeResult as any)?.totalExpense || 0);
    const totalProfit = totalIncome - totalExpense;

    return {
      totalProfit,
      totalIncome,
      totalExpense,
    };
  }

  // 获取对账统计数据
  async getReconciliationStats(query: any, userId: number) {
    const { TransportRecordModel, VehicleModel } = await this.loadModels();
    const sequelize = TransportRecordModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const { startDate, endDate, vehicleId, period = 'custom', isReconciled } = query;

    // 获取用户的所有车辆
    let vehicleIds: number[] = [];
    if (vehicleId) {
      // 验证 vehicleId 属于当前用户
      const vehicle = await VehicleModel.findOne({
        where: { id: vehicleId, userId },
      });
      if (!vehicle) {
        const { ctx } = this;
        ctx.throw(403, '车辆不存在或不属于当前用户');
      }
      vehicleIds = [vehicleId];
    } else {
      const vehicles = await VehicleModel.findAll({
        where: { userId },
        attributes: ['id'],
        raw: true,
      });
      vehicleIds = vehicles.map((v: any) => v.id);
    }

    if (vehicleIds.length === 0) {
      return {
        profit: 0,
        totalIncome: 0,
        totalExpense: 0,
        transportCount: 0,
        expenseBreakdown: [],
        dailyTrend: [],
      };
    }

    // 计算日期范围
    let dateStart: Date;
    let dateEnd: Date = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    if (period === 'last30days') {
      dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - 30);
      dateStart.setHours(0, 0, 0, 0);
    } else if (period === 'thisMonth') {
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateStart.setHours(0, 0, 0, 0);
    } else if (period === 'thisYear') {
      dateStart = new Date(now.getFullYear(), 0, 1);
      dateStart.setHours(0, 0, 0, 0);
    } else if (period === 'lastYear') {
      dateStart = new Date(now.getFullYear() - 1, 0, 1);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), 0, 1);
      dateEnd.setHours(0, 0, 0, 0);
      dateEnd.setTime(dateEnd.getTime() - 1);
    } else {
      // custom
      if (!startDate || !endDate) {
        const { ctx } = this;
        ctx.throw(400, '自定义时间段需要提供 startDate 和 endDate');
      }
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // 查询记录
    const where: any = {
      vehicleId: { [Op.in]: vehicleIds },
      date: {
        [Op.gte]: dateStart,
        [Op.lte]: dateEnd,
      },
    };

    // 对账状态筛选
    if (isReconciled !== undefined && isReconciled !== null && isReconciled !== '') {
      const reconciledValue = isReconciled === 'true' || isReconciled === true || isReconciled === 1;
      where.isReconciled = reconciledValue;
    }

    // 计算总收入和总支出
    const summaryResult = await TransportRecordModel.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'transportCount'],
        [sequelize.fn('SUM', sequelize.literal('freight + otherIncome')), 'totalIncome'],
        [sequelize.fn('SUM', sequelize.literal('fuelCost + repairCost + accommodationCost + mealCost + otherExpense')), 'totalExpense'],
        [sequelize.fn('SUM', sequelize.col('fuelCost')), 'fuelTotal'],
        [sequelize.fn('SUM', sequelize.col('repairCost')), 'repairTotal'],
        [sequelize.fn('SUM', sequelize.col('accommodationCost')), 'accommodationTotal'],
        [sequelize.fn('SUM', sequelize.col('mealCost')), 'mealTotal'],
        [sequelize.fn('SUM', sequelize.col('otherExpense')), 'otherTotal'],
      ],
      raw: true,
    });

    const transportCount = Number((summaryResult as any)?.transportCount || 0);
    const totalIncome = Number((summaryResult as any)?.totalIncome || 0);
    const totalExpense = Number((summaryResult as any)?.totalExpense || 0);
    const profit = totalIncome - totalExpense;

    // 支出分类
    const expenseBreakdown = [
      {
        category: 'fuel',
        categoryLabel: '油费',
        amount: Number((summaryResult as any)?.fuelTotal || 0),
      },
      {
        category: 'repair',
        categoryLabel: '维修费',
        amount: Number((summaryResult as any)?.repairTotal || 0),
      },
      {
        category: 'accommodation',
        categoryLabel: '住宿费',
        amount: Number((summaryResult as any)?.accommodationTotal || 0),
      },
      {
        category: 'meal',
        categoryLabel: '饭费',
        amount: Number((summaryResult as any)?.mealTotal || 0),
      },
      {
        category: 'other',
        categoryLabel: '其它费用',
        amount: Number((summaryResult as any)?.otherTotal || 0),
      },
    ];

    // 每日趋势
    const dailyTrendRecords = await TransportRecordModel.findAll({
      where,
      attributes: [
        'date',
        [sequelize.fn('SUM', sequelize.literal('freight + otherIncome')), 'income'],
        [sequelize.fn('SUM', sequelize.literal('fuelCost + repairCost + accommodationCost + mealCost + otherExpense')), 'expense'],
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true,
    });

    const dailyTrend = dailyTrendRecords.map((record: any) => {
      const date = record.date instanceof Date ? record.date : new Date(record.date);
      return {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        income: Number(record.income || 0),
        expense: Number(record.expense || 0),
      };
    });

    return {
      profit,
      totalIncome,
      totalExpense,
      transportCount,
      expenseBreakdown,
      dailyTrend,
    };
  }

  // ========== 证件分享 ==========

  // 生成分享 token（固定7天有效期，无使用次数限制）
  async generateShareToken(vehicleId: number, userId: number) {
    const { ctx } = this;
    const { CertificateShareTokenModel, VehicleModel } = await this.loadModels();

    // 验证车辆属于当前用户
    const vehicle = await VehicleModel.findOne({
      where: { id: vehicleId, userId },
    });
    if (!vehicle) {
      ctx.throw(403, '车辆不存在或无权操作');
    }

    // 生成 token，固定7天有效期
    const token = randomUUID();
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7); // 7天后过期

    // 创建 token 记录（不使用次数限制）
    await CertificateShareTokenModel.create({
      token,
      vehicleId,
      expireAt,
    });

    // 构建分享链接
    const shareUrl = `/pages/certificate-share/certificate-share?token=${token}`;

    return {
      token,
      expireAt: expireAt.toISOString(),
      shareUrl,
    };
  }

  // 通过 token 获取证件信息（公开接口）
  async getCertificatesByToken(token: string) {
    const { ctx } = this;
    const { CertificateShareTokenModel, VehicleModel } = await this.loadModels();

    // 查找 token
    const tokenRecord = await CertificateShareTokenModel.findOne({
      where: { token },
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          attributes: ['id', 'brand', 'certificateImages'],
        },
      ],
    });

    if (!tokenRecord) {
      ctx.throw(404, 'Token 不存在');
    }

    const tokenData = tokenRecord.toJSON ? tokenRecord.toJSON() : tokenRecord;
    const vehicle = (tokenData as any).vehicle;

    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }

    // 检查过期时间（固定7天，一周后不可访问）
    const expireAt = new Date(tokenData.expireAt);
    if (expireAt < new Date()) {
      ctx.throw(401, 'Token 已过期');
    }

    // 格式化证件图片
    const certificates = Array.isArray(vehicle.certificateImages)
      ? vehicle.certificateImages.map((url: string, index: number) => ({
          id: String(index + 1),
          url,
          type: undefined,
        }))
      : [];

    return {
      vehicleId: vehicle.id,
      vehicleBrand: vehicle.brand,
      certificates,
      expireAt: expireAt.toISOString(),
    };
  }
}

