# API 接口路径调整说明

## 背景

为了统一前后端的接口地址配置，我们将原本带有 `landport` 前缀的接口路径去掉，所有 API 入口从 `/landport/api/*` 调整为 `/api/*`。本说明用于通知前端团队在 Cursor 项目中同步更新配置。

## 主要变化

- **旧路径**：`/landport/api/...`
- **新路径**：`/api/...`
- 静态资源路径保持为 `/uploads/...`，不受影响。

## 影响范围

| 功能模块 | 旧地址示例 | 新地址示例 |
| --- | --- | --- |
| 微信小程序接口 | `/landport/api/lpwx/auth/login` | `/api/lpwx/auth/login` |
| 官网后台接口 | `/landport/api/dc/cases` | `/api/dc/cases` |
| 上传接口 | `/landport/api/upload/goods` | `/api/upload/goods` |

> **说明**：接口功能与返回内容保持不变，仅路径前缀发生变化。

## 前端项目需要的操作

1. **更新代理/请求基地址**
   - 将原先指向 `/landport/api` 的代理或 `baseURL` 修改为 `/api`
   - 示例（UmiJS `config.ts`）：
     ```ts
     proxy: {
       '/api': {
         target: 'http://localhost:7001',
         changeOrigin: true,
         pathRewrite: { '^/api': '/api' },
       },
     }
     ```

2. **环境变量检查**
   - 若项目使用 `API_PREFIX` 等变量，确保默认值改为 `/api`
   - 清理本地缓存环境变量，避免残留旧配置

3. **公共请求封装**
   - 若在封装的请求工具中写死了 `/landport/api`，请统一替换为 `/api`
   - 如使用 Axios：
     ```ts
     const instance = axios.create({
       baseURL: '/api',
     });
     ```

4. **测试验证**
   - 本地启动前端后，验证以下接口：
     - `/api/dc/cases`
     - `/api/lpwx/auth/login`
     - `/api/upload/goods`
   - 确认返回正常且鉴权逻辑没有受影响

5. **鉴权 Header 调整**
   - `/api/lpwx/*` 系列接口：使用 `X-Token: <小程序用户 token>`
   - `/api/dc/*` 系列接口：写操作使用 `X-Token: <后台管理员 token>`；`GET /api/dc/cases` 用 `Authorization: Bearer <website-token>` 支持官网展示。

## 额外提示

- 若部署有 Nginx 或其他反向代理，请检查相关转发规则中是否引用了旧前缀，并同步更新。
- 文档、脚本和测试用例中若写死了接口地址，也需要一并调整。
- 如需回溯历史记录，可参考 Git 提交中关于 “移除 landport 前缀” 的变更。

---

如有问题，请联系后端负责人或通过项目 issue 反馈。

