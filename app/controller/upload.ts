import { Controller } from 'egg';
import fs from 'fs';
import path from 'path';

export default class UploadController extends Controller {
  /**
   * 上传货物图片
   */
  public async uploadGoodsImage() {
    const { ctx } = this;

    try {
      const file = ctx.request.files?.[0] as any;
      if (!file) {
        ctx.throw(400, '未选择文件');
        return;
      }

      // 验证文件类型（既校验 mime，又兜底校验扩展名）
      const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/gif']);
      const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.gif']);
      const mime: string = (file as any).mime || '';
      const ext = path.extname((file as any).filename || '').toLowerCase();
      if (!allowedMimes.has(mime) && !allowedExts.has(ext)) {
        ctx.throw(400, '只支持 jpg、png、gif 格式的图片');
      }

      // 验证文件大小 (最大 5MB)，优先使用 file.size，没有则使用 stat
      const maxSize = 5 * 1024 * 1024;
      const fileSize: number = (file as any).size ?? fs.statSync((file as any).filepath).size;
      if (fileSize > maxSize) {
        ctx.throw(400, '图片大小不能超过 5MB');
      }

      // 存储文件（本地示例：copyFile 更稳健）
      const result = await this.uploadToCloudStorage(file as any);

      ctx.body = {
        code: 200,
        message: '上传成功',
        data: {
          url: result.url,
          filename: result.filename,
        },
      };
    } catch (error: any) {
      ctx.logger.error('文件上传失败:', error);
      if (error && (error.status || error.statusCode)) {
        // 透传业务性错误（如 400），避免一律变成 500
        throw error;
      }
      ctx.throw(500, '文件上传失败');
    } finally {
      // 清理临时文件
      await ctx.cleanupRequestFiles();
    }
  }

  /**
   * 上传到云存储（示例方法，需要根据实际云存储实现）
   */
  private async uploadToCloudStorage(file: any) {
    // 本地存储（仅用于开发环境示例）
    const uploadDir = path.join(process.cwd(), 'app/public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${
      path.extname(file.filename || '') || '.png'
    }`;
    const targetPath = path.join(uploadDir, filename);

    // 直接拷贝临时文件到目标路径，避免流事件的不确定性
    await fs.promises.copyFile(file.filepath, targetPath);

    return { url: `/public/uploads/${filename}`, filename };
  }

  /**
   * 批量上传图片
   */
  public async uploadMultipleImages() {
    const { ctx } = this;

    try {
      const files = (ctx.request.files || []) as any[];
      const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/gif']);
      const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.gif']);
      const maxSize = 5 * 1024 * 1024;

      const tasks = (files as any[]).map(async (file: any) => {
        const mime: string = (file as any).mime || '';
        const ext = path.extname((file as any).filename || '').toLowerCase();
        const size = (file as any).size ?? fs.statSync((file as any).filepath).size;
        if (!(allowedMimes.has(mime) || allowedExts.has(ext))) return null;
        if (size > maxSize) return null;
        return await this.uploadToCloudStorage(file as any);
      });

      const raw = await Promise.all(tasks);
      const results = raw.filter(Boolean) as any[];

      ctx.body = {
        code: 200,
        message: '上传成功',
        data: results,
      };
    } catch (error: any) {
      ctx.logger.error('批量上传失败:', error);
      if (error && (error.status || error.statusCode)) {
        throw error;
      }
      ctx.throw(500, '文件上传失败');
    } finally {
      await ctx.cleanupRequestFiles();
    }
  }
}
