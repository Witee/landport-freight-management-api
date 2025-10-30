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

      // 计算用户ID（未登录则归档到 anonymous）并按日期(YYYY-MM-DD)/用户ID分目录存储
      const userId = (ctx.state && ctx.state.user && ctx.state.user.userId) || 'anonymous';
      // 存储文件（本地示例：copyFile 更稳健）
      const result = await this.uploadToCloudStorage(file as any, String(userId));

      // 可选：绑定到货物（若请求中带 goodsId）
      const goodsIdRaw = (ctx.request.body && ctx.request.body.goodsId) || (ctx.query && ctx.query.goodsId);
      if (goodsIdRaw) {
        const goodsId = Number(goodsIdRaw);
        if (Number.isFinite(goodsId) && goodsId > 0 && ctx.state?.user?.userId) {
          try {
            await ctx.service.goodsService.addGoodsImages(goodsId, [result.url], ctx.state.user.userId);
          } catch (e: any) {
            // 不影响上传主流程，失败仅记录日志
            ctx.logger.warn('绑定货物图片失败 goodsId=%s error=%s', goodsId, (e && e.message) || e);
          }
        }
      }

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
  private async uploadToCloudStorage(file: any, userId: string) {
    // 本地存储（仅用于开发环境示例）- 分目录：uploads/YYYY-MM-DD/{userId}/
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const dateDir = `${yyyy}-${mm}-${dd}`;
    const subDir = path.join('uploads', dateDir, safeUserId);
    const uploadDir = path.join(process.cwd(), 'app/public', subDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${
      path.extname(file.filename || '') || '.png'
    }`;
    const targetPath = path.join(uploadDir, filename);

    // 直接拷贝临时文件到目标路径，避免流事件的不确定性
    await fs.promises.copyFile(file.filepath, targetPath);

    // 统一使用以 /public 为前缀的对外可访问 URL
    const urlPath = `/public/${subDir.replace(/\\/g, '/')}/${filename}`;
    return { url: urlPath, filename };
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

      const userId = (ctx.state && ctx.state.user && ctx.state.user.userId) || 'anonymous';
      const goodsIdRaw = (ctx.request.body && ctx.request.body.goodsId) || (ctx.query && ctx.query.goodsId);
      const goodsId = goodsIdRaw ? Number(goodsIdRaw) : undefined;
      const tasks = (files as any[]).map(async (file: any) => {
        const mime: string = (file as any).mime || '';
        const ext = path.extname((file as any).filename || '').toLowerCase();
        const size = (file as any).size ?? fs.statSync((file as any).filepath).size;
        if (!(allowedMimes.has(mime) || allowedExts.has(ext))) return null;
        if (size > maxSize) return null;
        const res = await this.uploadToCloudStorage(file as any, String(userId));
        // 批量情况下也尝试绑定
        if (goodsId && Number.isFinite(goodsId) && goodsId > 0 && ctx.state?.user?.userId) {
          try {
            await ctx.service.goodsService.addGoodsImages(goodsId, [res.url], ctx.state.user.userId);
          } catch (e: any) {
            ctx.logger.warn('批量绑定货物图片失败 goodsId=%s error=%s', goodsId, (e && e.message) || e);
          }
        }
        return res;
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
