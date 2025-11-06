import { Service } from 'egg';
import { Op } from 'sequelize';
import CaseFactory from '../model/Case.js';

// 本地进程内标记：避免重复 sync（仅用于 local 环境开发）
let __modelSyncedFlag = false;

export default class CaseService extends Service {
  // 本地辅助：确保模型已加载，并在本地环境按需执行一次 sync
  private async loadModel() {
    const { ctx } = this;
    const appAny = this.app as any;
    const CaseModel = (ctx.model as any)?.Case || CaseFactory(appAny);
    const syncConfig = (this.app.config as any).sequelize?.sync;
    const shouldSync = this.app.config.env === 'local' && !!syncConfig;
    if (shouldSync && !__modelSyncedFlag) {
      // 解析 sync 选项，支持 alter: true 以变更已有表结构
      const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
      if (CaseModel?.sync) await CaseModel.sync(syncOptions);
      __modelSyncedFlag = true;
    }
    return CaseModel;
  }

  // 创建案例
  async createCase(caseData: any) {
    const CaseModel = await this.loadModel();
    const payload: any = {
      projectName: caseData.projectName,
      date: caseData.date,
      images: Array.isArray(caseData.images) ? caseData.images : [],
    };
    return await CaseModel.create(payload);
  }

  // 更新案例
  async updateCase(id: number, caseData: any) {
    const { ctx } = this;
    const CaseModel = await this.loadModel();
    const caseItem = await CaseModel.findOne({
      where: { id },
    });
    if (!caseItem) {
      ctx.throw(404, '案例不存在');
    }
    const updateData: any = {};
    if (caseData.projectName !== undefined) {
      updateData.projectName = caseData.projectName;
    }
    if (caseData.date !== undefined) {
      updateData.date = caseData.date;
    }
    if (caseData.images !== undefined) {
      updateData.images = Array.isArray(caseData.images) ? caseData.images : [];
    }
    return await caseItem.update(updateData);
  }

  // 删除案例
  async deleteCase(id: number) {
    const { ctx } = this;
    const CaseModel = await this.loadModel();
    const caseItem = await CaseModel.findOne({
      where: { id },
    });
    if (caseItem) {
      await caseItem.destroy();
      return true;
    } else {
      ctx.throw(404, '案例不存在');
    }
  }

  // 获取案例列表
  async getCaseList(query: any) {
    const { page = 1, pageSize = 10, keyword, startDate, endDate } = query;
    // 强制转换分页参数为数字，避免 SQL 语法错误
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    const where: any = {};

    // 关键词搜索（项目名称）
    if (keyword) {
      where.projectName = { [Op.like]: `%${keyword}%` };
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = startDate;
      }
      if (endDate) {
        where.date[Op.lte] = endDate;
      }
    }

    const CaseModel = await this.loadModel();
    const { count, rows } = await CaseModel.findAndCountAll({
      where,
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
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

  // 获取案例详情
  async getCaseDetail(id: number) {
    const { ctx } = this;
    const CaseModel = await this.loadModel();
    const caseItem = await CaseModel.findOne({
      where: { id },
    });
    if (!caseItem) {
      ctx.throw(404, '案例不存在');
    }
    return caseItem;
  }
}

