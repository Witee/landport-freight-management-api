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

  private normalizeTags(input: any): string[] {
    if (!input) return [];
    const collected: string[] = [];
    const collect = (value: any) => {
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
  }

  private formatTags(tags: any): string[] {
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
        }
      } catch {}
    } else if (Array.isArray(tags)) {
      return tags
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }
    return [];
  }

  private formatCaseItem(caseItem: any) {
    const raw = caseItem && typeof caseItem.toJSON === 'function' ? caseItem.toJSON() : caseItem;
    return {
      ...raw,
      images: this.formatImages(raw?.images),
      tags: this.formatTags(raw?.tags),
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
      tags: (() => {
        const normalized = this.normalizeTags(caseData.tags);
        return normalized.length ? normalized : null;
      })(),
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
    if (caseData.tags !== undefined) {
      const normalizedTags = this.normalizeTags(caseData.tags);
      updateData.tags = normalizedTags.length ? normalizedTags : null;
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
    const tagsFilter = this.normalizeTags(query?.tags);
    if (tagsFilter.length) {
      const rows = await CaseModel.findAll({
        where,
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
      });
      const formattedAll = rows.map((row) => this.formatCaseItem(row));
      const filtered = formattedAll.filter((item) => {
        if (!Array.isArray(item.tags) || item.tags.length === 0) return false;
        return item.tags.some((tag) => tagsFilter.includes(tag));
      });
      const total = filtered.length;
      const start = (pageNum - 1) * pageSizeNum;
      const paged = filtered.slice(start, start + pageSizeNum);
      return {
        list: paged,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      };
    }

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

