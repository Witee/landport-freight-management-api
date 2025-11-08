import { Service } from 'egg';
import { Op } from 'sequelize';
import CaseFactory from '../model/Case.js';

// 本地进程内标记：避免重复 sync（仅用于 local 环境开发）
let __modelSyncedFlag = false;

export default class CaseService extends Service {
  private getAssetHost(): string {
    const hostRaw = (this.app.config as any)?.assetHost;
    if (!hostRaw) return '';
    return String(hostRaw).trim().replace(/\/+$/, '');
  }

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

  private formatImages(images: any): string[] {
    if (!Array.isArray(images)) return [];
    return images.map((img) => this.toPublicImageUrl(img));
  }

  private formatCaseItem(caseItem: any) {
    const raw = caseItem && typeof caseItem.toJSON === 'function' ? caseItem.toJSON() : caseItem;
    return {
      ...raw,
      images: this.formatImages(raw?.images),
    };
  }

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

  // 清理图片路径，确保只存储相对路径（移除域名前缀）
  private normalizeImagePaths(images: any[]): string[] {
    if (!Array.isArray(images)) return [];
    return images.map((img: any) => {
      if (typeof img !== 'string') return img;
      let normalized = img.trim();

      normalized = normalized.replace(/^https?:\/\/[^/]+/i, '');

      normalized = normalized.replace(/^\/landport/, '');

      if (normalized.startsWith('/uploads/')) {
        return normalized;
      }

      if (normalized.startsWith('/public/uploads/')) {
        return normalized.replace(/^\/public\/uploads\//, '/uploads/');
      }

      if (normalized.startsWith('/public/')) {
        return normalized.replace(/^\/public\//, '/uploads/');
      }

      return img;
    });
  }

  // 创建案例
  async createCase(caseData: any) {
    const CaseModel = await this.loadModel();
    const payload: any = {
      projectName: caseData.projectName,
      date: caseData.date,
      images: this.normalizeImagePaths(Array.isArray(caseData.images) ? caseData.images : []),
    };
    const created = await CaseModel.create(payload);
    return this.formatCaseItem(created);
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
      updateData.images = this.normalizeImagePaths(Array.isArray(caseData.images) ? caseData.images : []);
    }
    const updated = await caseItem.update(updateData);
    return this.formatCaseItem(updated);
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
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    const where: any = {};

    if (keyword) {
      where.projectName = { [Op.like]: `%${keyword}%` };
    }

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

    const formatted = rows.map((row) => this.formatCaseItem(row));

    return {
      list: formatted,
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
    return this.formatCaseItem(caseItem);
  }
}

