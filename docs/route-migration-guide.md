# 路由地址变更对应关系文档

## 重要说明

由于系统架构调整，路由地址已进行重构。本文档列出所有路由的**旧地址**与**新地址**的对应关系，方便前端进行迁移。

**变更时间：** 2025年1月

**变更原因：** 系统拆分为两套独立系统，使用不同的路由前缀进行区分

---

## 一、认证相关接口

### 1. 微信小程序登录

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| `/api/auth/wx-login` | `/api/lpwx/auth/wx-login` | POST | 微信小程序用户登录 |

**迁移示例：**
```typescript
// 旧代码
POST /api/auth/wx-login

// 新代码
POST /api/lpwx/auth/wx-login
```

### 2. 管理员登录

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| `/api/admin/auth/login` | `/api/dc/auth/login` | POST | 达成官网管理员登录 |

**迁移示例：**
```typescript
// 旧代码
POST /api/admin/auth/login

// 新代码
POST /api/dc/auth/login
```

---

## 二、文件上传接口

### 1. 货物图片上传（微信小程序）

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| `/api/upload/goods-image` | `/api/lpwx/upload/goods-image` | POST | 微信小程序单张图片上传 |
| `/api/upload/multiple-images` | `/api/lpwx/upload/multiple-images` | POST | 微信小程序多张图片上传 |

**迁移示例：**
```typescript
// 旧代码
POST /api/upload/goods-image
POST /api/upload/multiple-images

// 新代码
POST /api/lpwx/upload/goods-image
POST /api/lpwx/upload/multiple-images
```

### 2. 货物图片上传（管理员）

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| 无（新增） | `/api/dc/upload/goods-image` | POST | 管理员单张图片上传 |
| 无（新增） | `/api/dc/upload/multiple-images` | POST | 管理员多张图片上传 |

**说明：** 这是新增的接口，用于管理员上传图片。

---

## 三、货物相关接口

### 货物管理接口（微信小程序）

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| `/api/goods/list` | `/api/lpwx/goods/list` | GET | 获取当前用户的货物列表 |
| `/api/goods/list-all` | `/api/lpwx/goods/list-all` | GET | 获取所有货物列表（管理员） |
| `/api/goods/stats` | `/api/lpwx/goods/stats` | GET | 获取货物统计信息 |
| `/api/goods/reconciliation` | `/api/lpwx/goods/reconciliation` | GET | 获取货物对账信息 |
| `/api/goods/:id` | `/api/lpwx/goods/:id` | GET | 获取货物详情 |
| `/api/goods` | `/api/lpwx/goods` | POST | 创建货物 |
| `/api/goods/:id` | `/api/lpwx/goods/:id` | PUT | 更新货物 |
| `/api/goods/:id/status` | `/api/lpwx/goods/:id/status` | PUT/PATCH | 更新货物状态 |
| `/api/goods/:id` | `/api/lpwx/goods/:id` | DELETE | 删除货物 |

**迁移示例：**
```typescript
// 旧代码
GET /api/goods/list
GET /api/goods/:id
POST /api/goods
PUT /api/goods/:id
DELETE /api/goods/:id

// 新代码
GET /api/lpwx/goods/list
GET /api/lpwx/goods/:id
POST /api/lpwx/goods
PUT /api/lpwx/goods/:id
DELETE /api/lpwx/goods/:id
```

---

## 四、案例相关接口

### 案例管理接口（达成官网）

| 旧地址 | 新地址 | HTTP方法 | 说明 |
|--------|--------|----------|------|
| `/api/cases` | `/api/dc/cases` | GET | 获取案例列表 |
| `/api/cases/:id` | `/api/dc/cases/:id` | GET | 获取案例详情 |
| `/api/cases` | `/api/dc/cases` | POST | 创建案例（管理员） |
| `/api/cases/:id` | `/api/dc/cases/:id` | PUT | 更新案例（管理员） |
| `/api/cases/:id` | `/api/dc/cases/:id` | DELETE | 删除案例（管理员） |

**迁移示例：**
```typescript
// 旧代码
GET /api/cases
GET /api/cases/:id
POST /api/cases
PUT /api/cases/:id
DELETE /api/cases/:id

// 新代码
GET /api/dc/cases
GET /api/dc/cases/:id
POST /api/dc/cases
PUT /api/dc/cases/:id
DELETE /api/dc/cases/:id
```

---

## 五、路由前缀说明

### 系统划分

路由已按系统进行划分，使用不同的前缀：

1. **`/api/lpwx/*`** - 陆港货运管理微信小程序相关接口
   - 使用微信登录 Token（通过 `/api/lpwx/auth/wx-login` 获取）
   - 主要用于微信小程序端

2. **`/api/dc/*`** - 达成货运代理官网相关接口
   - GET 请求支持 website-token（用于前端官网展示）
   - 写操作（POST、PUT、DELETE）需要管理员 Token（通过 `/api/dc/auth/login` 获取）
   - 主要用于官网前端和管理后台

### 完整地址示例

**开发环境：**
- 微信小程序接口：`https://dev.dachengguoji.com.cn/landport/api/lpwx/auth/wx-login`
- 官网接口：`https://dev.dachengguoji.com.cn/landport/api/dc/cases`

**生产环境：**
- 微信小程序接口：`https://dachengguoji.com.cn/landport/api/lpwx/auth/wx-login`
- 官网接口：`https://dachengguoji.com.cn/landport/api/dc/cases`

---

## 六、快速迁移检查清单

### 微信小程序端（使用 `/api/lpwx/*` 前缀）

- [ ] `/api/auth/wx-login` → `/api/lpwx/auth/wx-login`
- [ ] `/api/upload/*` → `/api/lpwx/upload/*`
- [ ] `/api/goods/*` → `/api/lpwx/goods/*`

### 官网前端（使用 `/api/dc/*` 前缀）

- [ ] `/api/admin/auth/login` → `/api/dc/auth/login`
- [ ] `/api/cases` → `/api/dc/cases`
- [ ] `/api/cases/:id` → `/api/dc/cases/:id`
- [ ] 如需上传功能，使用 `/api/dc/upload/*`

---

## 七、完整路由对照表

### 认证接口

| 功能 | 旧路由 | 新路由 | 系统 |
|------|--------|--------|------|
| 微信登录 | `POST /api/auth/wx-login` | `POST /api/lpwx/auth/wx-login` | 微信小程序 |
| 管理员登录 | `POST /api/admin/auth/login` | `POST /api/dc/auth/login` | 官网管理 |

### 上传接口

| 功能 | 旧路由 | 新路由 | 系统 |
|------|--------|--------|------|
| 单图上传（小程序） | `POST /api/upload/goods-image` | `POST /api/lpwx/upload/goods-image` | 微信小程序 |
| 多图上传（小程序） | `POST /api/upload/multiple-images` | `POST /api/lpwx/upload/multiple-images` | 微信小程序 |
| 单图上传（管理） | - | `POST /api/dc/upload/goods-image` | 官网管理 |
| 多图上传（管理） | - | `POST /api/dc/upload/multiple-images` | 官网管理 |

### 货物接口

| 功能 | 旧路由 | 新路由 | 系统 |
|------|--------|--------|------|
| 货物列表 | `GET /api/goods/list` | `GET /api/lpwx/goods/list` | 微信小程序 |
| 全部货物 | `GET /api/goods/list-all` | `GET /api/lpwx/goods/list-all` | 微信小程序 |
| 货物统计 | `GET /api/goods/stats` | `GET /api/lpwx/goods/stats` | 微信小程序 |
| 货物对账 | `GET /api/goods/reconciliation` | `GET /api/lpwx/goods/reconciliation` | 微信小程序 |
| 货物详情 | `GET /api/goods/:id` | `GET /api/lpwx/goods/:id` | 微信小程序 |
| 创建货物 | `POST /api/goods` | `POST /api/lpwx/goods` | 微信小程序 |
| 更新货物 | `PUT /api/goods/:id` | `PUT /api/lpwx/goods/:id` | 微信小程序 |
| 更新状态 | `PUT/PATCH /api/goods/:id/status` | `PUT/PATCH /api/lpwx/goods/:id/status` | 微信小程序 |
| 删除货物 | `DELETE /api/goods/:id` | `DELETE /api/lpwx/goods/:id` | 微信小程序 |

### 案例接口

| 功能 | 旧路由 | 新路由 | 系统 |
|------|--------|--------|------|
| 案例列表 | `GET /api/cases` | `GET /api/dc/cases` | 官网 |
| 案例详情 | `GET /api/cases/:id` | `GET /api/dc/cases/:id` | 官网 |
| 创建案例 | `POST /api/cases` | `POST /api/dc/cases` | 官网管理 |
| 更新案例 | `PUT /api/cases/:id` | `PUT /api/dc/cases/:id` | 官网管理 |
| 删除案例 | `DELETE /api/cases/:id` | `DELETE /api/dc/cases/:id` | 官网管理 |

---

## 八、注意事项

1. **基础路径不变：** 所有接口仍然使用 `/api` 作为基础路径，只是增加了系统前缀（`lpwx` 或 `dc`）

2. **认证方式不变：** 
   - 微信小程序仍使用微信登录 Token
   - 官网管理仍使用管理员 Token
   - 官网前端展示使用 website-token

3. **请求参数不变：** 所有接口的请求参数、响应格式均保持不变

4. **向后兼容：** 旧路由已废弃，请尽快迁移到新路由

5. **环境变量更新：** 如果前端使用了环境变量配置 API 地址，需要更新相应的配置

---

## 九、迁移示例代码

### 示例 1：微信小程序端

```typescript
// 旧代码
const API_BASE = '/api';

// 登录
await request.post(`${API_BASE}/auth/wx-login`, data);

// 获取货物列表
await request.get(`${API_BASE}/goods/list`);

// 上传图片
await request.post(`${API_BASE}/upload/goods-image`, formData);

// 新代码
const API_BASE = '/api/lpwx';

// 登录
await request.post(`${API_BASE}/auth/wx-login`, data);

// 获取货物列表
await request.get(`${API_BASE}/goods/list`);

// 上传图片
await request.post(`${API_BASE}/upload/goods-image`, formData);
```

### 示例 2：官网前端

```typescript
// 旧代码
const API_BASE = '/api';

// 管理员登录
await request.post(`${API_BASE}/admin/auth/login`, data);

// 获取案例列表
await request.get(`${API_BASE}/cases`);

// 创建案例
await request.post(`${API_BASE}/cases`, data);

// 新代码
const API_BASE = '/api/dc';

// 管理员登录
await request.post(`${API_BASE}/auth/login`, data);

// 获取案例列表
await request.get(`${API_BASE}/cases`);

// 创建案例
await request.post(`${API_BASE}/cases`, data);
```

---

## 十、联系支持

如有疑问，请联系后端开发团队。

**文档版本：** v1.0  
**最后更新：** 2025年1月

