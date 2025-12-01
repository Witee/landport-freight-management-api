import { Service } from 'egg';
import { Op, literal } from 'sequelize';
import VehicleFactory from '../model/Vehicle.js';
import TransportRecordFactory from '../model/TransportRecord.js';
import UserFactory from '../model/User.js';
import FleetFactory from '../model/Fleet.js';
import FleetMemberFactory from '../model/FleetMember.js';

// 本地进程内标记：避免重复 sync（仅用于 local 环境开发）
let __modelsSyncedFlag = false;

export default class FleetService extends Service {
  // 获取资源主机地址
  private getAssetHost(): string {
    const hostRaw = (this.app.config as any)?.assetHost;
    if (!hostRaw) return '';
    return String(hostRaw).trim().replace(/\/+$/, '');
  }

  // 将图片路径转换为公开访问的完整URL
  private toPublicImageUrl(pathValue: any): any {
    if (typeof pathValue !== 'string') return pathValue;
    const original = pathValue.trim();
    if (!original) return original;
    if (/^https?:\/\//i.test(original)) {
      return original;
    }
    const normalized = original.replace(/\\/g, '/');
    const assetHost = this.getAssetHost();

    const withLandport = normalized.startsWith('/landport/')
      ? normalized
      : normalized.startsWith('/uploads/')
        ? `/landport${normalized}`
        : normalized.startsWith('/public/uploads/')
          ? `/landport${normalized.replace(/^\/public\//, '/')}`
          : normalized.startsWith('/public/')
            ? `/landport/uploads${normalized.replace(/^\/public/, '')}`
            : normalized;

    return assetHost ? `${assetHost}${withLandport}` : withLandport;
  }

  // 本地辅助：确保模型已加载、关联已建立，并在本地环境按需执行一次 sync
  private async loadModels() {
    const { ctx } = this;
    const appAny = this.app as any;
    const VehicleModel = (ctx.model as any)?.Vehicle || VehicleFactory(appAny);
    const TransportRecordModel = (ctx.model as any)?.TransportRecord || TransportRecordFactory(appAny);
    const UserModel = (ctx.model as any)?.User || UserFactory(appAny);
    const FleetModel = (ctx.model as any)?.Fleet || FleetFactory(appAny);
    const FleetMemberModel = (ctx.model as any)?.FleetMember || FleetMemberFactory(appAny);

    // 建立关联
    if (TransportRecordModel && VehicleModel && !TransportRecordModel.associations?.vehicle) {
      TransportRecordModel.belongsTo(VehicleModel, { as: 'vehicle', foreignKey: 'vehicleId' });
    }
    if (TransportRecordModel && FleetModel && !TransportRecordModel.associations?.fleet) {
      TransportRecordModel.belongsTo(FleetModel, { as: 'fleet', foreignKey: 'fleetId' });
    }
    if (VehicleModel && UserModel && !VehicleModel.associations?.user) {
      VehicleModel.belongsTo(UserModel, { as: 'user', foreignKey: 'userId' });
    }
    if (VehicleModel && FleetModel && !VehicleModel.associations?.fleet) {
      VehicleModel.belongsTo(FleetModel, { as: 'fleet', foreignKey: 'fleetId' });
    }
    if (FleetMemberModel && FleetModel && !FleetMemberModel.associations?.fleet) {
      FleetMemberModel.belongsTo(FleetModel, { as: 'fleet', foreignKey: 'fleetId' });
    }
    if (FleetMemberModel && UserModel && !FleetMemberModel.associations?.user) {
      FleetMemberModel.belongsTo(UserModel, { as: 'user', foreignKey: 'userId' });
    }

    const syncConfig = (this.app.config as any).sequelize?.sync;
    const shouldSync = this.app.config.env === 'local' && !!syncConfig;
    if (shouldSync && !__modelsSyncedFlag) {
      const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
      // 先同步用户表，再同步依赖其外键的表
      if (UserModel?.sync) await UserModel.sync(syncOptions);
      if (FleetModel?.sync) await FleetModel.sync(syncOptions);
      if (FleetMemberModel?.sync) await FleetMemberModel.sync(syncOptions);
      if (VehicleModel?.sync) await VehicleModel.sync(syncOptions);
      if (TransportRecordModel?.sync) await TransportRecordModel.sync(syncOptions);
      __modelsSyncedFlag = true;
    }
    return { VehicleModel, TransportRecordModel, UserModel, FleetModel, FleetMemberModel } as const;
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
    const vehicle = await this.checkVehicleEditPermission(id, userId);
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
    const vehicle = await this.checkVehicleEditPermission(id, userId);
    await vehicle.destroy();
    return true;
  }

  // 获取车辆列表
  async getVehicleList(query: any, userId: number) {
    const { page = 1, pageSize = 10, startDate, endDate, fleetId } = query;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const { VehicleModel, TransportRecordModel, FleetMemberModel } = await this.loadModels();
    const sequelize = VehicleModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    // 构建车辆查询条件
    let vehicleWhere: any;
    
    // 如果提供了 fleetId，需要检查用户是否在该车队中
    if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
      const fleetIdNum = Number(fleetId);
      if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
        // 检查用户是否在该车队中
        const member = await FleetMemberModel.findOne({
          where: { fleetId: fleetIdNum, userId },
        });
        if (!member) {
          const { ctx } = this;
          ctx.throw(403, '无权访问该车队的车辆');
        }
        // 返回该车队的所有车辆（不限制 userId）
        vehicleWhere = { fleetId: fleetIdNum };
      } else {
        // fleetId 为 null 或空字符串，表示查询个人车辆
        vehicleWhere = { userId, fleetId: null };
      }
    } else {
      // 未提供 fleetId，只返回个人车辆
      vehicleWhere = { userId, fleetId: null };
    }

    // 获取车辆
    const vehicles = await VehicleModel.findAll({
      where: vehicleWhere,
      attributes: ['id', 'brand', 'horsepower', 'loadCapacity', 'axleCount', 'tireCount', 'trailerLength', 'licensePlate', 'name', 'phone', 'certificateImages', 'otherImages', 'fleetId', 'createdAt', 'updatedAt'],
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
    await this.checkVehicleAccess(id, userId);
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findByPk(id);
    if (!vehicle) {
      const { ctx } = this;
      ctx.throw(404, '车辆不存在');
    }
    return this.formatVehicleItem(vehicle);
  }

  // 添加车辆图片
  async addVehicleImage(id: number, imageUrl: string, imageType: 'certificate' | 'other', userId: number) {
    const vehicle = await this.checkVehicleEditPermission(id, userId);

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
    // 转换图片URL为公开访问的完整URL
    const formatImageArray = (images: any): string[] => {
      if (!Array.isArray(images)) return [];
      return images.map((img: string) => this.toPublicImageUrl(img));
    };
    return {
      ...raw,
      certificateImages: formatImageArray(raw.certificateImages),
      otherImages: formatImageArray(raw.otherImages),
    };
  }

  // ========== 货运记录管理 ==========

  // 创建货运记录
  async createTransportRecord(recordData: any, userId: number) {
    const { ctx } = this;
    const { TransportRecordModel, VehicleModel, FleetMemberModel } = await this.loadModels();

    // 验证车辆存在
    const vehicle = await VehicleModel.findByPk(recordData.vehicleId);
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
    const vehicleFleetId = (vehicleData as any).fleetId;
    const vehicleUserId = (vehicleData as any).userId;

    // 处理 fleetId 参数
    const requestFleetId = recordData.fleetId !== undefined && recordData.fleetId !== null && recordData.fleetId !== '' 
      ? Number(recordData.fleetId) 
      : null;

    if (requestFleetId !== null && Number.isFinite(requestFleetId) && requestFleetId > 0) {
      // 如果提供了 fleetId，验证用户是车队管理员（只有管理员可以创建记录）
      await this.checkFleetAdmin(requestFleetId, userId);
      // 验证车辆属于该车队
      if (vehicleFleetId !== requestFleetId) {
        ctx.throw(400, '车辆不属于指定的车队');
      }
    } else {
      // 如果没有提供 fleetId，验证车辆属于当前用户或用户是车队管理员
      if (!vehicleFleetId || vehicleFleetId === null) {
        // 个人车辆，检查车辆属于当前用户
        if (vehicleUserId !== userId) {
          ctx.throw(403, '车辆不存在或不属于当前用户');
        }
      } else {
        // 如果是车队车辆但没有提供 fleetId，检查用户是否是车队管理员
        await this.checkFleetAdmin(vehicleFleetId, userId);
      }
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

    // 设置 fleetId（如果提供了则使用，否则使用车辆所属的车队ID，如果车辆是个人车辆则为 null）
    if (requestFleetId !== null && Number.isFinite(requestFleetId) && requestFleetId > 0) {
      payload.fleetId = requestFleetId;
    } else {
      payload.fleetId = vehicleFleetId || null;
    }

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

    // 查找记录
    const record = await TransportRecordModel.findOne({
      where: { id },
      include: [
        {
          model: VehicleModel,
          as: 'vehicle',
          required: true,
        },
      ],
    });

    if (!record) {
      ctx.throw(404, '记录不存在');
    }

    // 验证车辆权限：车辆所有者或车队管理员可以更新记录
    const recordData_json = record.toJSON ? record.toJSON() : record;
    const vehicle = (recordData_json as any).vehicle;
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const fleetId = vehicle.fleetId;
    const vehicleUserId = vehicle.userId;

    // 如果是个人车辆，检查 userId 是否匹配
    if (!fleetId || fleetId === null) {
      if (vehicleUserId !== userId) {
        ctx.throw(403, '记录不存在或无权操作');
      }
    } else {
      // 如果是车队车辆，检查用户是否是车队管理员
      await this.checkFleetAdmin(fleetId, userId);
    }

    // 如果更新了 vehicleId，需要验证新车辆权限
    if (recordData.vehicleId && recordData.vehicleId !== vehicle.id) {
      const newVehicle = await VehicleModel.findByPk(recordData.vehicleId);
      if (!newVehicle) {
        ctx.throw(404, '车辆不存在');
      }
      const newVehicleData = newVehicle.toJSON ? newVehicle.toJSON() : newVehicle;
      const newFleetId = (newVehicleData as any).fleetId;
      const newVehicleUserId = (newVehicleData as any).userId;

      // 如果是个人车辆，检查 userId 是否匹配
      if (!newFleetId || newFleetId === null) {
        if (newVehicleUserId !== userId) {
          ctx.throw(403, '车辆不存在或不属于当前用户');
        }
      } else {
        // 如果是车队车辆，检查用户是否是车队管理员
        await this.checkFleetAdmin(newFleetId, userId);
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
          required: true,
        },
      ],
    });

    if (!record) {
      ctx.throw(404, '记录不存在');
    }

    // 验证车辆权限：车辆所有者或车队管理员可以删除记录
    const recordData = record.toJSON ? record.toJSON() : record;
    const vehicle = (recordData as any).vehicle;
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const fleetId = vehicle.fleetId;
    const vehicleUserId = vehicle.userId;

    // 如果是个人车辆，检查 userId 是否匹配
    if (!fleetId || fleetId === null) {
      if (vehicleUserId !== userId) {
        ctx.throw(403, '记录不存在或无权操作');
      }
    } else {
      // 如果是车队车辆，检查用户是否是车队管理员
      await this.checkFleetAdmin(fleetId, userId);
    }

    await record.destroy();
    return true;
  }

  // 获取货运记录列表
  async getTransportRecordList(query: any, userId: number) {
    const { page = 1, pageSize = 10, vehicleId, startDate, endDate, isReconciled, fleetId } = query;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const { TransportRecordModel, VehicleModel, FleetMemberModel } = await this.loadModels();

    // 构建查询条件
    const where: any = {};
    if (vehicleId) {
      // 验证车辆权限：车辆所有者或车队管理员可以查看记录
      const vehicle = await VehicleModel.findByPk(vehicleId);
      if (!vehicle) {
        const { ctx } = this;
        ctx.throw(404, '车辆不存在');
      }
      const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
      const vehicleFleetId = (vehicleData as any).fleetId;
      const vehicleUserId = (vehicleData as any).userId;

      // 如果提供了 fleetId，验证车辆属于该车队
      if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
        const fleetIdNum = Number(fleetId);
        if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
          // 检查用户是否在该车队中
          const member = await FleetMemberModel.findOne({
            where: { fleetId: fleetIdNum, userId },
          });
          if (!member) {
            const { ctx } = this;
            ctx.throw(403, '无权访问该车队的记录');
          }
          // 验证车辆属于该车队
          if (vehicleFleetId !== fleetIdNum) {
            const { ctx } = this;
            ctx.throw(400, '车辆不属于指定的车队');
          }
        }
      } else {
        // 如果没有提供 fleetId，检查个人车辆权限
        if (!vehicleFleetId || vehicleFleetId === null) {
          if (vehicleUserId !== userId) {
            const { ctx } = this;
            ctx.throw(403, '车辆不存在或不属于当前用户');
          }
        } else {
          // 如果是车队车辆，检查用户是否是车队成员（所有成员都可以查看记录列表）
          await this.checkFleetMember(vehicleFleetId, userId);
        }
      }
      where.vehicleId = vehicleId;
    } else {
      // 如果没有指定 vehicleId，根据 fleetId 决定查询范围
      if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
        const fleetIdNum = Number(fleetId);
        if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
          // 检查用户是否在该车队中
          const member = await FleetMemberModel.findOne({
            where: { fleetId: fleetIdNum, userId },
          });
          if (!member) {
            const { ctx } = this;
            ctx.throw(403, '无权访问该车队的记录');
          }
          // 获取该车队的所有车辆
          const fleetVehicles = await VehicleModel.findAll({
            where: { fleetId: fleetIdNum },
            attributes: ['id'],
            raw: true,
          });
          const fleetVehicleIds = fleetVehicles.map((v: any) => v.id);
          if (fleetVehicleIds.length === 0) {
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
          where.vehicleId = { [Op.in]: fleetVehicleIds };
        } else {
          // fleetId 为 null 或空字符串，查询个人车辆
          const personalVehicles = await VehicleModel.findAll({
            where: { userId, fleetId: null },
            attributes: ['id'],
            raw: true,
          });
          const personalVehicleIds = personalVehicles.map((v: any) => v.id);
          if (personalVehicleIds.length === 0) {
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
          where.vehicleId = { [Op.in]: personalVehicleIds };
        }
      } else {
        // 未提供 fleetId，只查询个人车辆
        const personalVehicles = await VehicleModel.findAll({
          where: { userId, fleetId: null },
          attributes: ['id'],
          raw: true,
        });
        const personalVehicleIds = personalVehicles.map((v: any) => v.id);
        if (personalVehicleIds.length === 0) {
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
        where.vehicleId = { [Op.in]: personalVehicleIds };
      }
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
          required: true,
        },
      ],
    });

    if (!record) {
      ctx.throw(404, '记录不存在');
    }

    // 验证车辆权限：车辆所有者或车队成员可以查看记录
    const recordData = record.toJSON ? record.toJSON() : record;
    const vehicle = (recordData as any).vehicle;
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const fleetId = vehicle.fleetId;
    const vehicleUserId = vehicle.userId;

    // 如果是个人车辆，检查 userId 是否匹配
    if (!fleetId || fleetId === null) {
      if (vehicleUserId !== userId) {
        ctx.throw(403, '记录不存在或无权访问');
      }
    } else {
      // 如果是车队车辆，检查用户是否是车队成员（所有成员都可以查看）
      await this.checkFleetMember(fleetId, userId);
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
  async getOverviewStats(userId: number, query: { startDate: string; endDate: string; fleetId?: string | number | null }) {
    const { TransportRecordModel, VehicleModel, FleetMemberModel } = await this.loadModels();
    const sequelize = TransportRecordModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const { startDate, endDate, fleetId } = query;

    // 构建车辆查询条件
    let vehicleWhere: any;
    
    // 如果提供了 fleetId，需要检查用户是否在该车队中
    if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
      const fleetIdNum = Number(fleetId);
      if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
        // 检查用户是否在该车队中
        const member = await FleetMemberModel.findOne({
          where: { fleetId: fleetIdNum, userId },
        });
        if (!member) {
          const { ctx } = this;
          ctx.throw(403, '无权访问该车队的统计数据');
        }
        // 返回该车队的所有车辆（不限制 userId）
        vehicleWhere = { fleetId: fleetIdNum };
      } else {
        // fleetId 为 null 或空字符串，表示查询个人车辆
        vehicleWhere = { userId, fleetId: null };
      }
    } else {
      // 未提供 fleetId，只返回个人车辆
      vehicleWhere = { userId, fleetId: null };
    }

    // 获取车辆
    const vehicles = await VehicleModel.findAll({
      where: vehicleWhere,
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
    const { TransportRecordModel, VehicleModel, FleetMemberModel } = await this.loadModels();
    const sequelize = TransportRecordModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const { startDate, endDate, vehicleId, period = 'custom', isReconciled, fleetId } = query;

    // 获取用户的所有车辆
    let vehicleIds: number[] = [];
    if (vehicleId) {
      // 验证车辆权限：车辆所有者或车队管理员可以查看统计
      const vehicle = await VehicleModel.findByPk(vehicleId);
      if (!vehicle) {
        const { ctx } = this;
        ctx.throw(404, '车辆不存在');
      }
      const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
      const vehicleFleetId = (vehicleData as any).fleetId;
      const vehicleUserId = (vehicleData as any).userId;

      // 如果提供了 fleetId，验证车辆属于该车队
      if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
        const fleetIdNum = Number(fleetId);
        if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
          // 检查用户是否在该车队中
          const member = await FleetMemberModel.findOne({
            where: { fleetId: fleetIdNum, userId },
          });
          if (!member) {
            const { ctx } = this;
            ctx.throw(403, '无权访问该车队的统计数据');
          }
          // 验证车辆属于该车队
          if (vehicleFleetId !== fleetIdNum) {
            const { ctx } = this;
            ctx.throw(400, '车辆不属于指定的车队');
          }
        }
      } else {
        // 如果没有提供 fleetId，检查个人车辆权限
        if (!vehicleFleetId || vehicleFleetId === null) {
          if (vehicleUserId !== userId) {
            const { ctx } = this;
            ctx.throw(403, '车辆不存在或不属于当前用户');
          }
        } else {
          // 如果是车队车辆，检查用户是否是车队成员（所有成员都可以查看统计）
          await this.checkFleetMember(vehicleFleetId, userId);
        }
      }
      vehicleIds = [vehicleId];
    } else {
      // 如果没有指定 vehicleId，根据 fleetId 决定查询范围
      if (fleetId !== undefined && fleetId !== null && fleetId !== '') {
        const fleetIdNum = Number(fleetId);
        if (Number.isFinite(fleetIdNum) && fleetIdNum > 0) {
          // 检查用户是否在该车队中
          const member = await FleetMemberModel.findOne({
            where: { fleetId: fleetIdNum, userId },
          });
          if (!member) {
            const { ctx } = this;
            ctx.throw(403, '无权访问该车队的统计数据');
          }
          // 获取该车队的所有车辆
          const fleetVehicles = await VehicleModel.findAll({
            where: { fleetId: fleetIdNum },
            attributes: ['id'],
            raw: true,
          });
          vehicleIds = fleetVehicles.map((v: any) => v.id);
        } else {
          // fleetId 为 null 或空字符串，查询个人车辆
          const personalVehicles = await VehicleModel.findAll({
            where: { userId, fleetId: null },
            attributes: ['id'],
            raw: true,
          });
          vehicleIds = personalVehicles.map((v: any) => v.id);
        }
      } else {
        // 未提供 fleetId，只查询个人车辆
        const personalVehicles = await VehicleModel.findAll({
          where: { userId, fleetId: null },
          attributes: ['id'],
          raw: true,
        });
        vehicleIds = personalVehicles.map((v: any) => v.id);
      }
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

  // ========== 车队管理 ==========

  // 检查用户是否为车队管理员（admin 或 creator）
  private async checkFleetAdmin(fleetId: number, userId: number) {
    const { FleetMemberModel } = await this.loadModels();
    const member = await FleetMemberModel.findOne({
      where: { fleetId, userId },
    });
    if (!member) {
      const { ctx } = this;
      ctx.throw(403, '您不是该车队的成员');
    }
    const memberData = member.toJSON ? member.toJSON() : member;
    const role = (memberData as any).role;
    if (role !== 'admin' && role !== 'creator') {
      const { ctx } = this;
      ctx.throw(403, '只有管理员可以执行此操作');
    }
    return member;
  }

  // 检查用户是否为车队成员
  private async checkFleetMember(fleetId: number, userId: number) {
    const { FleetMemberModel } = await this.loadModels();
    const member = await FleetMemberModel.findOne({
      where: { fleetId, userId },
    });
    if (!member) {
      const { ctx } = this;
      ctx.throw(403, '您不是该车队的成员');
    }
    return member;
  }

  // 检查用户是否有权限访问车辆（查看权限）
  private async checkVehicleAccess(vehicleId: number, userId: number) {
    const { ctx } = this;
    const { VehicleModel, FleetMemberModel } = await this.loadModels();
    const vehicle = await VehicleModel.findByPk(vehicleId);
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
    const fleetId = (vehicleData as any).fleetId;
    const vehicleUserId = (vehicleData as any).userId;

    // 如果是个人车辆，检查 userId 是否匹配
    if (!fleetId || fleetId === null) {
      if (vehicleUserId !== userId) {
        ctx.throw(403, '无权访问该车辆');
      }
      return vehicle;
    }

    // 如果是车队车辆，检查用户是否在车队中
    const member = await FleetMemberModel.findOne({
      where: { fleetId, userId },
    });
    if (!member) {
      ctx.throw(403, '您不是该车队的成员，无权访问该车辆');
    }
    return vehicle;
  }

  // 检查用户是否有权限编辑车辆（编辑权限）
  private async checkVehicleEditPermission(vehicleId: number, userId: number) {
    const { ctx } = this;
    const { VehicleModel } = await this.loadModels();
    const vehicle = await VehicleModel.findByPk(vehicleId);
    if (!vehicle) {
      ctx.throw(404, '车辆不存在');
    }
    const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
    const fleetId = (vehicleData as any).fleetId;
    const vehicleUserId = (vehicleData as any).userId;

    // 如果是个人车辆，检查 userId 是否匹配
    if (!fleetId || fleetId === null) {
      if (vehicleUserId !== userId) {
        ctx.throw(403, '无权操作该车辆');
      }
      return vehicle;
    }

    // 如果是车队车辆，检查用户是否是车队管理员
    await this.checkFleetAdmin(fleetId, userId);
    return vehicle;
  }

  // 获取车队列表
  async getFleetList(userId: number) {
    const { FleetModel, FleetMemberModel } = await this.loadModels();
    const sequelize = FleetMemberModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }
    
    // 先查询用户所在的所有车队成员记录
    const members = await FleetMemberModel.findAll({
      where: { userId },
    });

    // 如果没有成员记录，直接返回空数组
    if (members.length === 0) {
      return [];
    }

    // 获取所有车队ID
    const fleetIds = members.map((m: any) => {
      const memberData = m.toJSON ? m.toJSON() : m;
      return (memberData as any).fleetId;
    });

    // 查询所有车队信息
    const fleets = await FleetModel.findAll({
      where: { id: { [Op.in]: fleetIds } },
      attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
    });

    // 构建车队ID到车队信息的映射
    const fleetMap = new Map();
    fleets.forEach((f: any) => {
      const fleetData = f.toJSON ? f.toJSON() : f;
      fleetMap.set(fleetData.id, fleetData);
    });

    // 统计每个车队的成员数量
    const memberCounts = await FleetMemberModel.findAll({
      where: { fleetId: { [Op.in]: fleetIds } },
      attributes: [
        'fleetId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['fleetId'],
      raw: true,
    });

    const countMap = new Map();
    memberCounts.forEach((item: any) => {
      countMap.set(item.fleetId, Number(item.count || 0));
    });

    // 格式化返回数据，包含用户在每个车队中的角色
    const resultMap = new Map();
    members.forEach((m: any) => {
      const memberData = m.toJSON ? m.toJSON() : m;
      const fleetId = (memberData as any).fleetId;
      const role = (memberData as any).role;
      const fleet = fleetMap.get(fleetId);
      if (fleet && !resultMap.has(fleetId)) {
        resultMap.set(fleetId, {
          id: fleet.id,
          name: fleet.name,
          description: fleet.description || null,
          memberCount: countMap.get(fleet.id) || 0,
          myRole: role, // 当前用户在该车队中的角色
          createdAt: fleet.createdAt,
          updatedAt: fleet.updatedAt,
        });
      }
    });

    return Array.from(resultMap.values());
  }

  // 创建车队
  async createFleet(fleetData: { name: string; description?: string }, userId: number) {
    const { FleetModel, FleetMemberModel } = await this.loadModels();
    
    // 创建车队
    const fleet = await FleetModel.create({
      name: fleetData.name,
      description: fleetData.description || null,
    });

    // 创建者自动成为 creator
    await FleetMemberModel.create({
      fleetId: fleet.id,
      userId,
      role: 'creator',
    });

    const fleetData_result = fleet.toJSON ? fleet.toJSON() : fleet;
    return {
      id: fleetData_result.id,
      name: fleetData_result.name,
      description: fleetData_result.description || null,
      createdAt: fleetData_result.createdAt,
      updatedAt: fleetData_result.updatedAt,
    };
  }

  // 获取车队详情
  async getFleetDetail(fleetId: number, userId: number) {
    const { FleetModel, FleetMemberModel, UserModel } = await this.loadModels();
    
    // 检查用户是否为车队成员
    await this.checkFleetMember(fleetId, userId);

    // 获取车队信息
    const fleet = await FleetModel.findByPk(fleetId);
    if (!fleet) {
      const { ctx } = this;
      ctx.throw(404, '车队不存在');
    }

    // 获取成员列表
    const members = await FleetMemberModel.findAll({
      where: { fleetId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
      order: [['joinedAt', 'DESC']],
    });

    // 统计成员数量
    const memberCount = await FleetMemberModel.count({
      where: { fleetId },
    });

    // 获取当前用户在该车队中的角色
    const currentUserMember = await FleetMemberModel.findOne({
      where: { fleetId, userId },
    });
    const currentUserMemberData = currentUserMember?.toJSON ? currentUserMember.toJSON() : currentUserMember;
    const myRole = (currentUserMemberData as any)?.role || null;

    // 格式化成员数据
    const membersList = members.map((m: any) => {
      const memberData = m.toJSON ? m.toJSON() : m;
      const user = (memberData as any).user;
      return {
        id: memberData.id,
        fleetId: memberData.fleetId,
        userId: memberData.userId,
        role: memberData.role,
        nickname: user?.nickname || null,
        avatar: user?.avatar || null,
        joinedAt: memberData.joinedAt,
      };
    });

    const fleetData_result = fleet.toJSON ? fleet.toJSON() : fleet;
    return {
      id: fleetData_result.id,
      name: fleetData_result.name,
      description: fleetData_result.description || null,
      memberCount,
      myRole, // 当前用户在该车队中的角色
      members: membersList,
      createdAt: fleetData_result.createdAt,
      updatedAt: fleetData_result.updatedAt,
    };
  }

  // 更新车队信息
  async updateFleet(fleetId: number, fleetData: { name?: string; description?: string }, userId: number) {
    const { FleetModel } = await this.loadModels();
    
    // 检查用户是否为管理员
    await this.checkFleetAdmin(fleetId, userId);

    // 更新车队信息
    const fleet = await FleetModel.findByPk(fleetId);
    if (!fleet) {
      const { ctx } = this;
      ctx.throw(404, '车队不存在');
    }

    const updateData: any = {};
    if (fleetData.name !== undefined) {
      updateData.name = fleetData.name;
    }
    if (fleetData.description !== undefined) {
      updateData.description = fleetData.description || null;
    }

    await fleet.update(updateData);

    const fleetData_result = fleet.toJSON ? fleet.toJSON() : fleet;
    return {
      id: fleetData_result.id,
      name: fleetData_result.name,
      description: fleetData_result.description || null,
      updatedAt: fleetData_result.updatedAt,
    };
  }

  // 删除车队
  async deleteFleet(fleetId: number, userId: number) {
    const { FleetModel } = await this.loadModels();
    
    // 检查用户是否为管理员
    await this.checkFleetAdmin(fleetId, userId);

    // 删除车队（级联删除成员）
    const fleet = await FleetModel.findByPk(fleetId);
    if (!fleet) {
      const { ctx } = this;
      ctx.throw(404, '车队不存在');
    }

    await fleet.destroy();
    return true;
  }

  // 获取车队成员列表
  async getFleetMembers(fleetId: number, userId: number) {
    const { FleetMemberModel, UserModel } = await this.loadModels();
    
    // 检查用户是否为车队成员
    await this.checkFleetMember(fleetId, userId);

    // 获取成员列表
    const members = await FleetMemberModel.findAll({
      where: { fleetId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
      order: [['joinedAt', 'DESC']],
    });

    // 格式化成员数据
    const result = members.map((m: any) => {
      const memberData = m.toJSON ? m.toJSON() : m;
      const user = (memberData as any).user;
      return {
        id: memberData.id,
        fleetId: memberData.fleetId,
        userId: memberData.userId,
        role: memberData.role,
        nickname: user?.nickname || null,
        avatar: user?.avatar || null,
        joinedAt: memberData.joinedAt,
      };
    });

    return result;
  }

  // 添加车队成员
  async addFleetMember(fleetId: number, targetUserId: number, userId: number) {
    const { FleetMemberModel } = await this.loadModels();
    
    // 检查用户是否为管理员
    await this.checkFleetAdmin(fleetId, userId);

    // 检查目标用户是否已经是成员
    const existingMember = await FleetMemberModel.findOne({
      where: { fleetId, userId: targetUserId },
    });
    if (existingMember) {
      const { ctx } = this;
      ctx.throw(400, '该用户已经是车队成员');
    }

    // 添加成员
    const member = await FleetMemberModel.create({
      fleetId,
      userId: targetUserId,
      role: 'member',
    });

    const memberData = member.toJSON ? member.toJSON() : member;
    return {
      id: memberData.id,
      fleetId: memberData.fleetId,
      userId: memberData.userId,
      role: memberData.role,
      joinedAt: memberData.joinedAt,
    };
  }

  // 移除车队成员
  async removeFleetMember(fleetId: number, memberId: number, userId: number) {
    const { FleetMemberModel } = await this.loadModels();
    
    // 检查用户是否为管理员
    await this.checkFleetAdmin(fleetId, userId);

    // 查找成员
    const member = await FleetMemberModel.findOne({
      where: { id: memberId, fleetId },
    });
    if (!member) {
      const { ctx } = this;
      ctx.throw(404, '成员不存在');
    }

    const memberData = member.toJSON ? member.toJSON() : member;
    // 不能移除管理员和创建者
    const role = (memberData as any).role;
    if (role === 'admin' || role === 'creator') {
      const { ctx } = this;
      ctx.throw(400, '不能移除管理员或创建者');
    }

    await member.destroy();
    return true;
  }

  // 更新车队成员角色
  async updateFleetMemberRole(fleetId: number, memberId: number, newRole: 'admin' | 'member', userId: number) {
    const { ctx } = this;
    const { FleetMemberModel } = await this.loadModels();
    
    // 检查用户是否为管理员
    await this.checkFleetAdmin(fleetId, userId);

    // 查找成员
    const member = await FleetMemberModel.findOne({
      where: { id: memberId, fleetId },
    });
    if (!member) {
      ctx.throw(404, '成员不存在');
    }

    const memberData = member.toJSON ? member.toJSON() : member;
    const currentRole = (memberData as any).role;

    // 不能修改创建者的角色
    if (currentRole === 'creator') {
      ctx.throw(400, '不能修改创建者的角色');
    }

    // 更新角色（newRole 类型已限制为 'admin' | 'member'，不可能是 'creator'）
    await member.update({ role: newRole });

    const updatedMemberData = member.toJSON ? member.toJSON() : member;
    return {
      id: updatedMemberData.id,
      fleetId: updatedMemberData.fleetId,
      userId: updatedMemberData.userId,
      role: updatedMemberData.role,
      joinedAt: updatedMemberData.joinedAt,
    };
  }

  // 搜索用户
  async searchUsers(keyword?: string) {
    const { UserModel } = await this.loadModels();
    
    let whereCondition: any = {};
    
    // 如果提供了关键词，进行模糊搜索
    if (keyword && keyword.trim() !== '') {
      const searchKeyword = `%${keyword.trim()}%`;
      whereCondition = {
        [Op.or]: [
          { nickname: { [Op.like]: searchKeyword } },
          { phone: { [Op.like]: searchKeyword } },
        ],
      };
    }

    const users = await UserModel.findAll({
      where: whereCondition,
      attributes: ['id', 'nickname', 'avatar', 'phone', 'role'],
      order: [['id', 'DESC']],
      limit: 20,
    });

    const result = users.map((u: any) => {
      const userData = u.toJSON ? u.toJSON() : u;
      return {
        id: userData.id,
        nickname: userData.nickname || null,
        avatar: userData.avatar || null,
        phone: userData.phone || null,
        role: userData.role || null,
      };
    });

    return result;
  }

}

