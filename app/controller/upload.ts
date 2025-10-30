import { Controller } from 'egg';

export default class UploadController extends Controller {
  /**
   * 上传货物图片
   */
  public async uploadGoodsImage() {
    const { ctx } = this;

    try {
      const file = (ctx.request.files && ctx.request.files[0]) as any;
      if (!file) {
        ctx.throw(400, '未选择文件');
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes((file as any).mimeType)) {
        ctx.throw(400, '只支持 jpg、png、gif 格式的图片');
      }

      // 验证文件大小 (最大 5MB)
      const maxSize = 5 * 1024 * 1024;
      if ((file as any).size > maxSize) {
        ctx.throw(400, '图片大小不能超过 5MB');
      }

      // 这里需要根据你的存储方案实现文件上传
      // 以下是一个示例，你需要替换为实际的存储逻辑
      const result = await this.uploadToCloudStorage(file as any);

      ctx.body = {
        code: 200,
        message: '上传成功',
        data: {
          url: result.url,
          filename: result.filename,
        },
      };
    } catch (error) {
      ctx.logger.error('文件上传失败:', error);
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
    // 这里应该实现你的文件上传逻辑
    // 例如上传到阿里云OSS、腾讯云COS、七牛云等
    // 返回文件的访问URL

    // 示例：本地存储（仅用于开发环境）
    const fs = require('fs');
    const path = require('path');

    const uploadDir = path.join(process.cwd(), 'app/public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substr(2)}${path.extname(file.filename)}`;
    const filepath = path.join(uploadDir, filename);

    const fileStream = fs.createReadStream(file.filepath);
    const writeStream = fs.createWriteStream(filepath);

    await new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return {
      url: `/public/uploads/${filename}`,
      filename,
    };
  }

  /**
   * 批量上传图片
   */
  public async uploadMultipleImages() {
    const { ctx } = this;

    try {
      const files = (ctx.request.files || []) as any[];
      const results: any[] = [];

      for (const file of files as any[]) {
        // 验证文件类型和大小
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes((file as any).mimeType)) {
          continue; // 跳过不支持的格式
        }

        const maxSize = 5 * 1024 * 1024;
        if ((file as any).size > maxSize) {
          continue; // 跳过过大的文件
        }

        const result = await this.uploadToCloudStorage(file as any);
        results.push(result);
      }

      ctx.body = {
        code: 200,
        message: '上传成功',
        data: results,
      };
    } catch (error) {
      ctx.logger.error('批量上传失败:', error);
      ctx.throw(500, '文件上传失败');
    } finally {
      await ctx.cleanupRequestFiles();
    }
  }
}
