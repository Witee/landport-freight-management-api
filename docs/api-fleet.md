# 车队管理接口文档 (`/api/lpwx/fleet`)

## 接口概览

车队管理接口提供车辆管理、收支记录管理、统计对账功能。所有接口都需要微信小程序用户登录认证。

**基础路径：** `/api/lpwx/fleet`

**认证要求：**
- 所有接口都需要微信小程序用户 Token（通过 `X-Token: <token>` 请求头）
- 获取 Token：通过 `/api/lpwx/auth/wx-login` 接口登录获取

**数据隔离：**
- 所有接口自动根据当前登录用户的 `userId` 过滤数据
- 用户只能访问自己的车辆和收支记录
- 访问其他用户资源时返回 403 Forbidden

---

## 一、车辆管理接口

### 1.1 获取车辆列表

**接口：** `GET /api/lpwx/fleet/vehicles`

**权限：** 微信小程序用户（需登录）

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `page` | number | 否 | 页码，最小值为 1，默认 1 | `1` |
| `pageSize` | number | 否 | 每页数量，范围 1-100，默认 10 | `10` |
| `startDate` | string | 否 | 开始日期（格式：YYYY-MM-DD），用于计算收入和支出，未提供时默认最近30天 | `"2025-10-27"` |
| `endDate` | string | 否 | 结束日期（格式：YYYY-MM-DD），用于计算收入和支出，未提供时默认为今天 | `"2025-11-26"` |

**重要说明：**
1. **排序规则**：接口固定按利润（profit）降序排序，不支持排序参数。前端如需其他排序方式，请在本地进行排序。
2. **返回数据**：接口总是返回用户的所有车辆，即使指定日期范围内没有收支记录也会显示（统计字段为 0）。
3. **日期范围**：`startDate` 和 `endDate` 用于计算每辆车在指定日期范围内的收入和支出统计。如果未提供日期参数，默认使用最近30天。

**请求示例：**
```bash
# 使用日期范围查询
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100&startDate=2025-10-27&endDate=2025-11-26
X-Token: <微信小程序用户token>

# 不提供日期参数（使用默认最近30天）
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "userId": 123,
        "brand": "解放",
        "horsepower": "300",
        "loadCapacity": "10吨",
        "axleCount": 3,
        "tireCount": 12,
        "trailerLength": "13米",
        "certificateImages": ["/uploads/2025-01-15/123/cert1.jpg"],
        "otherImages": ["/uploads/2025-01-15/123/other1.jpg"],
        "income": "50000",
        "expense": "30000",
        "profit": "20000",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "pageSize": 100,
      "totalPages": 1
    }
  }
}
```

**响应字段说明：**
- `list`: 车辆列表数组（按利润降序排序）
  - `id`: 车辆ID
  - `userId`: 所属用户ID（后端自动关联）
  - `brand`: 品牌（必填，最大100字符）
  - `horsepower`: 马力（必填，最大50字符）
  - `loadCapacity`: 载重（必填，最大50字符）
  - `axleCount`: 轴数（必填，最小值为1）
  - `tireCount`: 轮胎数量（必填，最小值为1）
  - `trailerLength`: 挂车长度（必填，最大50字符）
  - `certificateImages`: 证件图片URL数组（如果为 null 会自动转为空数组 `[]`）
  - `otherImages`: 其它图片URL数组（如果为 null 会自动转为空数组 `[]`）
  - **`income`**: 该车辆在指定日期范围内的总收入（字符串格式，单位：元）。计算方式：`freight`（运费）+ `otherIncome`（其它收入）的总和。如果指定日期范围内没有记录，返回 `"0"`
  - **`expense`**: 该车辆在指定日期范围内的总支出（字符串格式，单位：元）。计算方式：`fuelCost`（油费）+ `repairCost`（维修费）+ `parkingCost`（停车费）+ `clearanceCost`（通关费）+ `otherExpense`（其它费用）的总和。如果指定日期范围内没有记录，返回 `"0"`
  - **`profit`**: 该车辆在指定日期范围内的利润（字符串格式，单位：元）。计算方式：`income - expense`。如果指定日期范围内没有记录，返回 `"0"`
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间
- `pagination`: 分页信息
  - `total`: 总车辆数（所有车辆，不根据日期范围过滤）
  - `page`: 当前页码
  - `pageSize`: 每页数量
  - `totalPages`: 总页数

**收入和支出计算说明：**
- 收入和支出基于指定日期范围内的收支记录（`transport_records`）计算
- 如果车辆在指定日期范围内没有收支记录，`income`、`expense`、`profit` 字段均为 `"0"`
- 车辆基本信息（品牌、马力等）始终返回，不受日期范围影响

---

### 1.2 获取车辆详情

**接口：** `GET /api/lpwx/fleet/vehicles/:id`

**权限：** 微信小程序用户（需登录）

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 车辆ID |

**请求示例：**
```bash
GET /api/lpwx/fleet/vehicles/1
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "userId": 123,
    "brand": "解放",
    "horsepower": "300",
    "loadCapacity": "10吨",
    "axleCount": 3,
    "tireCount": 12,
    "trailerLength": "13米",
    "certificateImages": ["/uploads/2025-01-15/123/cert1.jpg"],
    "otherImages": ["/uploads/2025-01-15/123/other1.jpg"],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: 车辆不存在或无权访问
- `400`: 无效的车辆ID

---

### 1.3 创建车辆

**接口：** `POST /api/lpwx/fleet/vehicles`

**权限：** 微信小程序用户（需登录）

**请求体：**

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `brand` | string | 是 | 品牌，最大100字符 | `"解放"` |
| `horsepower` | string | 是 | 马力，最大50字符 | `"300"` |
| `loadCapacity` | string | 是 | 载重，最大50字符 | `"10吨"` |
| `axleCount` | number | 是 | 轴数，最小值为1 | `3` |
| `tireCount` | number | 是 | 轮胎数量，最小值为1 | `12` |
| `trailerLength` | string | 是 | 挂车长度，最大50字符 | `"13米"` |
| `certificateImages` | array | 否 | 证件图片URL数组 | `["/uploads/.../cert1.jpg"]` |
| `otherImages` | array | 否 | 其它图片URL数组 | `["/uploads/.../other1.jpg"]` |

**请求示例：**
```bash
POST /api/lpwx/fleet/vehicles
X-Token: <微信小程序用户token>
Content-Type: application/json

{
  "brand": "解放",
  "horsepower": "300",
  "loadCapacity": "10吨",
  "axleCount": 3,
  "tireCount": 12,
  "trailerLength": "13米",
  "certificateImages": [],
  "otherImages": []
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "userId": 123,
    "brand": "解放",
    "horsepower": "300",
    "loadCapacity": "10吨",
    "axleCount": 3,
    "tireCount": 12,
    "trailerLength": "13米",
    "certificateImages": [],
    "otherImages": [],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**错误响应：**
- `400`: 请求参数错误（必填字段缺失或格式错误）
- `401`: 未登录或 token 无效

---

### 1.4 更新车辆

**接口：** `PUT /api/lpwx/fleet/vehicles/:id`

**权限：** 微信小程序用户（需登录），只能更新自己的车辆

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 车辆ID |

**请求体：** 所有字段都是可选的，只更新提供的字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `brand` | string | 否 | 品牌，最大100字符 |
| `horsepower` | string | 否 | 马力，最大50字符 |
| `loadCapacity` | string | 否 | 载重，最大50字符 |
| `axleCount` | number | 否 | 轴数，最小值为1 |
| `tireCount` | number | 否 | 轮胎数量，最小值为1 |
| `trailerLength` | string | 否 | 挂车长度，最大50字符 |
| `certificateImages` | array | 否 | 证件图片URL数组 |
| `otherImages` | array | 否 | 其它图片URL数组 |

**请求示例：**
```bash
PUT /api/lpwx/fleet/vehicles/1
X-Token: <微信小程序用户token>
Content-Type: application/json

{
  "brand": "更新后的品牌"
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "brand": "更新后的品牌",
    ...
  }
}
```

**错误响应：**
- `403`: 无权更新该车辆
- `404`: 车辆不存在
- `400`: 请求参数错误

---

### 1.5 删除车辆

**接口：** `DELETE /api/lpwx/fleet/vehicles/:id`

**权限：** 微信小程序用户（需登录），只能删除自己的车辆

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 车辆ID |

**请求示例：**
```bash
DELETE /api/lpwx/fleet/vehicles/1
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "success": true
  }
}
```

**错误响应：**
- `403`: 无权删除该车辆
- `404`: 车辆不存在

---

### 1.6 上传车辆图片

**接口：** `POST /api/lpwx/fleet/vehicles/:id/images`

**权限：** 微信小程序用户（需登录），只能为自己的车辆上传图片

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 车辆ID |

**请求体（FormData）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 图片文件（支持 jpg、png、gif，最大 20MB） |
| `imageType` | enum | 是 | 图片类型，可选值：`certificate`（证件图片）、`other`（其它图片） |

**请求示例：**
```bash
POST /api/lpwx/fleet/vehicles/1/images
X-Token: <微信小程序用户token>
Content-Type: multipart/form-data

file: <图片文件>
imageType: certificate
```

**响应格式：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://dachengguoji.com.cn/landport/uploads/2025-01-15/123/image.jpg"
  }
}
```

**错误响应：**
- `403`: 无权为该车辆上传图片
- `404`: 车辆不存在
- `400`: 文件格式错误或 imageType 参数错误

---

## 二、收支记录管理接口

### 2.1 获取收支记录列表

**接口：** `GET /api/lpwx/fleet/income-expense-records`

**权限：** 微信小程序用户（需登录）

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `vehicleId` | number | 否 | 车辆ID（必须是当前用户的车辆） | `1` |
| `startDate` | string | 否 | 开始日期，格式：YYYY-MM-DD | `"2025-01-01"` |
| `endDate` | string | 否 | 结束日期，格式：YYYY-MM-DD | `"2025-01-31"` |
| `page` | number | 否 | 页码，最小值为 1，默认 1 | `1` |
| `pageSize` | number | 否 | 每页数量，范围 1-100，默认 10 | `10` |
| `isReconciled` | string | 否 | 对账状态筛选，可选值：`true`（已对账）、`false`（未对账），不传则返回全部 | `"true"` |

**⚠️ 重要：`isReconciled` 字段说明**

- `isReconciled=true`：只返回已对账的记录
- `isReconciled=false`：只返回未对账的记录
- `isReconciled` 不传或为空：返回全部记录（默认行为）

**请求示例：**
```bash
# 获取全部记录
GET /api/lpwx/fleet/income-expense-records?page=1&pageSize=10

# 获取已对账的记录
GET /api/lpwx/fleet/transport-records?isReconciled=true

# 获取未对账的记录
GET /api/lpwx/fleet/transport-records?isReconciled=false

# 按车辆和日期筛选
GET /api/lpwx/fleet/income-expense-records?vehicleId=1&startDate=2025-01-01&endDate=2025-01-31&isReconciled=true

X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "vehicleId": 1,
        "goodsName": "货物名称",
        "date": "2025-01-15",
        "freight": "1000",
        "otherIncome": "200",
        "fuelCost": "300",
        "repairCost": "100",
        "parkingCost": "150",
        "clearanceCost": "80",
        "otherExpense": "50",
        "remark": "备注信息",
        "images": ["/uploads/2025-01-15/123/image1.jpg"],
        "isReconciled": false,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10
    }
  }
}
```

**响应字段说明：**
- `list`: 收支记录列表数组
  - `id`: 记录ID
  - `vehicleId`: 车辆ID
  - `goodsName`: 货物名称（必填，最大200字符）
  - `date`: 日期（必填，格式：YYYY-MM-DD）
  - `freight`: 运费（字符串格式，必填）
  - `otherIncome`: 其它费用（字符串格式，必填）
  - `fuelCost`: 油费（字符串格式，必填）
  - `repairCost`: 维修费（字符串格式，必填）
  - `parkingCost`: 停车费（字符串格式，必填）
  - `clearanceCost`: 通关费（字符串格式，必填）
  - `otherExpense`: 其它费用（字符串格式，必填）
  - `remark`: 备注（可选）
  - `images`: 图片URL数组（如果为 null 会自动转为空数组 `[]`）
  - **`isReconciled`**: 是否已对账（boolean，`true` 表示已对账，`false` 表示未对账）
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间
- `pagination`: 分页信息

**排序规则：** 按日期降序，创建时间降序

---

### 2.2 获取收支记录详情

**接口：** `GET /api/lpwx/fleet/income-expense-records/:id`

**权限：** 微信小程序用户（需登录），只能获取自己车辆的记录

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 记录ID |

**请求示例：**
```bash
GET /api/lpwx/fleet/income-expense-records/1
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "vehicleId": 1,
    "goodsName": "货物名称",
    "date": "2025-01-15",
    "freight": "1000",
    "otherIncome": "200",
    "fuelCost": "300",
    "repairCost": "100",
    "accommodationCost": "150",
    "mealCost": "80",
    "otherExpense": "50",
    "remark": "备注信息",
    "images": ["/uploads/2025-01-15/123/image1.jpg"],
    "isReconciled": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: 记录不存在或无权访问
- `400`: 无效的记录ID

---

### 2.3 创建收支记录

**接口：** `POST /api/lpwx/fleet/income-expense-records`

**权限：** 微信小程序用户（需登录）

**请求体：**

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `vehicleId` | number | 是 | 车辆ID（必须是当前用户的车辆） | `1` |
| `goodsName` | string | 是 | 货物名称，最大200字符 | `"货物A"` |
| `date` | string | 是 | 日期，格式：YYYY-MM-DD | `"2025-01-15"` |
| `freight` | string | 是 | 运费 | `"1000"` |
| `otherIncome` | string | 是 | 其它费用 | `"200"` |
| `fuelCost` | string | 是 | 油费 | `"300"` |
| `repairCost` | string | 是 | 维修费 | `"100"` |
| `parkingCost` | string | 是 | 停车费 | `"150"` |
| `clearanceCost` | string | 是 | 通关费 | `"80"` |
| `otherExpense` | string | 是 | 其它费用 | `"50"` |
| `remark` | string | 否 | 备注 | `"备注信息"` |
| `images` | array | 否 | 图片URL数组 | `["/uploads/.../image1.jpg"]` |

**注意：** 新创建的记录默认 `isReconciled` 为 `false`（未对账）

**请求示例：**
```bash
POST /api/lpwx/fleet/income-expense-records
X-Token: <微信小程序用户token>
Content-Type: application/json

{
  "vehicleId": 1,
  "goodsName": "货物A",
  "date": "2025-01-15",
  "freight": "1000",
  "otherIncome": "200",
  "fuelCost": "300",
  "repairCost": "100",
  "accommodationCost": "150",
  "mealCost": "80",
  "otherExpense": "50",
  "remark": "备注信息",
  "images": []
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "vehicleId": 1,
    "goodsName": "货物A",
    "date": "2025-01-15",
    "freight": "1000",
    "otherIncome": "200",
    "fuelCost": "300",
    "repairCost": "100",
    "accommodationCost": "150",
    "mealCost": "80",
    "otherExpense": "50",
    "remark": "备注信息",
    "images": [],
    "isReconciled": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: vehicleId 不属于当前用户
- `400`: 请求参数错误

---

### 2.4 更新收支记录

**接口：** `PUT /api/lpwx/fleet/income-expense-records/:id`

**权限：** 微信小程序用户（需登录），只能更新自己车辆的记录

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 记录ID |

**请求体：** 所有字段都是可选的，只更新提供的字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vehicleId` | number | 否 | 车辆ID（必须是当前用户的车辆） |
| `goodsName` | string | 否 | 货物名称，最大200字符 |
| `date` | string | 否 | 日期，格式：YYYY-MM-DD |
| `freight` | string | 否 | 运费 |
| `otherIncome` | string | 否 | 其它费用 |
| `fuelCost` | string | 否 | 油费 |
| `repairCost` | string | 否 | 维修费 |
| `parkingCost` | string | 否 | 停车费 |
| `clearanceCost` | string | 否 | 通关费 |
| `otherExpense` | string | 否 | 其它费用 |
| `remark` | string | 否 | 备注 |
| `images` | array | 否 | 图片URL数组 |
| **`isReconciled`** | **boolean** | **否** | **是否已对账（`true` 表示已对账，`false` 表示未对账）** |

**⚠️ 重要：`isReconciled` 字段使用说明**

- 可以通过更新接口设置记录的对账状态
- `isReconciled: true` - 标记为已对账
- `isReconciled: false` - 标记为未对账
- 对账状态可以随时修改（已对账可以改回未对账）

**请求示例：**
```bash
# 标记记录为已对账
PUT /api/lpwx/fleet/income-expense-records/1
X-Token: <微信小程序用户token>
Content-Type: application/json

{
  "isReconciled": true
}

# 同时更新多个字段
PUT /api/lpwx/fleet/income-expense-records/1
X-Token: <微信小程序用户token>
Content-Type: application/json

{
  "goodsName": "更新后的货物名称",
  "isReconciled": true
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "vehicleId": 1,
    "goodsName": "更新后的货物名称",
    "date": "2025-01-15",
    "freight": "1000",
    "otherIncome": "200",
    "fuelCost": "300",
    "repairCost": "100",
    "accommodationCost": "150",
    "mealCost": "80",
    "otherExpense": "50",
    "remark": "备注信息",
    "images": [],
    "isReconciled": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**错误响应：**
- `403`: 无权更新该记录
- `404`: 记录不存在
- `400`: 请求参数错误

---

### 2.5 删除收支记录

**接口：** `DELETE /api/lpwx/fleet/income-expense-records/:id`

**权限：** 微信小程序用户（需登录），只能删除自己车辆的记录

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 记录ID |

**请求示例：**
```bash
DELETE /api/lpwx/fleet/income-expense-records/1
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "success": true
  }
}
```

**错误响应：**
- `403`: 无权删除该记录
- `404`: 记录不存在

---

## 三、统计接口

### 3.1 获取车队总览统计数据

**接口：** `GET /api/lpwx/fleet/stats/overview`

**权限：** 微信小程序用户（需登录）

**请求参数：** 无

**请求示例：**
```bash
GET /api/lpwx/fleet/stats/overview
X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalProfit": 50000,
    "totalIncome": 200000,
    "totalExpense": 150000
  }
}
```

**响应字段说明：**
- `totalProfit` - 车队总利润（用于显示利润卡片）
- `totalIncome` - 车队总收入（用于显示收入卡片）
- `totalExpense` - 车队总支出（用于显示支出卡片）

---

### 3.2 获取对账统计数据

**接口：** `GET /api/lpwx/fleet/stats/reconciliation`

**权限：** 微信小程序用户（需登录）

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `period` | enum | 否 | 时间段类型，可选值：`last30days`、`thisMonth`、`thisYear`、`lastYear`、`custom`，默认 `custom` | `"thisMonth"` |
| `startDate` | string | 条件必填 | 开始日期（YYYY-MM-DD），`period=custom` 时必填 | `"2025-01-01"` |
| `endDate` | string | 条件必填 | 结束日期（YYYY-MM-DD），`period=custom` 时必填 | `"2025-01-31"` |
| `vehicleId` | number | 否 | 车辆ID（必须是当前用户的车辆） | `1` |
| **`isReconciled`** | **string** | **否** | **对账状态筛选，可选值：`true`（已对账）、`false`（未对账），不传则统计全部** | `"true"` |

**⚠️ 重要：`isReconciled` 字段说明**

- `isReconciled=true`：只统计已对账的记录
- `isReconciled=false`：只统计未对账的记录
- `isReconciled` 不传或为空：统计全部记录（默认行为）

**时间段说明：**
- `last30days`：最近30天（从今天往前推30天）
- `thisMonth`：本月（从本月1日到今天）
- `thisYear`：本年（从今年1月1日到今天）
- `lastYear`：去年（从去年1月1日到去年12月31日）
- `custom`：自定义时间段，必须提供 `startDate` 和 `endDate`

**请求示例：**
```bash
# 统计本月的全部记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth

# 统计本月的已对账记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=true

# 统计本月的未对账记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=false

# 统计指定车辆的自定义时间段（已对账）
GET /api/lpwx/fleet/stats/reconciliation?period=custom&startDate=2025-01-01&endDate=2025-01-31&vehicleId=1&isReconciled=true

X-Token: <微信小程序用户token>
```

**响应格式：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "profit": 50000,
    "totalIncome": 200000,
    "totalExpense": 150000,
    "transportCount": 50,
    "expenseBreakdown": [
      {
        "category": "fuel",
        "categoryLabel": "油费",
        "amount": 80000
      },
      {
        "category": "repair",
        "categoryLabel": "维修费",
        "amount": 30000
      },
      {
        "category": "accommodation",
        "categoryLabel": "停车费",
        "amount": 20000
      },
      {
        "category": "meal",
        "categoryLabel": "通关费",
        "amount": 15000
      },
      {
        "category": "other",
        "categoryLabel": "其它费用",
        "amount": 5000
      }
    ],
    "dailyTrend": [
      {
        "date": "2025-01-15",
        "income": 10000,
        "expense": 5000
      }
    ]
  }
}
```

**响应字段说明：**
- `profit`: 利润（总收入 - 总支出）
- `totalIncome`: 总收入
- `totalExpense`: 总支出
- `transportCount`: 运输次数
- `expenseBreakdown`: 支出分类（用于饼图）
  - `category`: 支出类别（`fuel`、`repair`、`accommodation`、`meal`、`other`）
  - `categoryLabel`: 类别标签（中文）
  - `amount`: 金额
- `dailyTrend`: 每日趋势（用于折线图）
  - `date`: 日期（YYYY-MM-DD）
  - `income`: 收入
  - `expense`: 支出

**错误响应：**
- `403`: vehicleId 不属于当前用户
- `400`: 参数错误（如 period=custom 但未提供 startDate 和 endDate）

---

## 四、错误码说明

| 错误码 | 说明 | 可能原因 |
|--------|------|----------|
| `200` | 成功 | 请求成功 |
| `400` | 请求参数错误 | 必填字段缺失、格式错误、参数值无效 |
| `401` | 未登录或 token 无效 | 未提供 token、token 已过期、token 无效 |
| `403` | 无权访问 | 访问其他用户的资源、权限不足 |
| `404` | 资源不存在 | 请求的资源不存在 |
| `500` | 服务器错误 | 服务器内部错误 |

---

## 六、`isReconciled` 字段使用总结

### 6.1 字段说明

- **字段名：** `isReconciled`
- **类型：** `boolean`
- **默认值：** `false`（未对账）
- **说明：** 
  - `true` 表示已对账
  - `false` 表示未对账
  - 新创建的记录默认为 `false`

### 6.2 在列表接口中使用

```javascript
// 获取全部记录（默认）
GET /api/lpwx/fleet/transport-records

// 获取已对账的记录
GET /api/lpwx/fleet/transport-records?isReconciled=true

// 获取未对账的记录
GET /api/lpwx/fleet/transport-records?isReconciled=false
```

### 6.3 在更新接口中使用

```javascript
// 标记记录为已对账
PUT /api/lpwx/fleet/income-expense-records/:id
{
  "isReconciled": true
}

// 标记记录为未对账
PUT /api/lpwx/fleet/income-expense-records/:id
{
  "isReconciled": false
}
```

### 6.4 在统计接口中使用

```javascript
// 统计全部记录（默认）
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth

// 只统计已对账的记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=true

// 只统计未对账的记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=false
```

### 6.5 前端使用建议

1. **列表页面：** 提供筛选选项（全部/已对账/未对账）
2. **详情页面：** 显示对账状态，提供切换按钮
3. **对账页面：** 使用 `isReconciled=false` 筛选未对账记录
4. **统计页面：** 支持按对账状态筛选统计数据

---

## 七、注意事项

1. **数据隔离：** 所有接口自动根据当前登录用户的 `userId` 过滤数据
2. **权限验证：** 操作前会验证资源归属，访问其他用户资源返回 403
3. **金额字段：** 所有金额字段在请求和响应中都是字符串格式（避免精度问题）
4. **图片字段：** `certificateImages`、`otherImages`、`images` 如果为 null 会自动转为空数组 `[]`
5. **对账状态：** `isReconciled` 字段可以随时修改，已对账可以改回未对账
6. **分享 Token：** 固定7天有效期，无使用次数限制

---

## 八、完整示例

### 8.1 创建车辆并添加记录

```javascript
// 1. 创建车辆
POST /api/lpwx/fleet/vehicles
{
  "brand": "解放",
  "horsepower": "300",
  "loadCapacity": "10吨",
  "axleCount": 3,
  "tireCount": 12,
  "trailerLength": "13米"
}

// 2. 创建收支记录（默认未对账）
POST /api/lpwx/fleet/income-expense-records
{
  "vehicleId": 1,
  "goodsName": "货物A",
  "date": "2025-01-15",
  "freight": "1000",
  "otherIncome": "200",
  "fuelCost": "300",
  "repairCost": "100",
  "accommodationCost": "150",
  "mealCost": "80",
  "otherExpense": "50"
}

// 3. 标记为已对账
PUT /api/lpwx/fleet/income-expense-records/1
{
  "isReconciled": true
}

// 4. 查询已对账的记录
GET /api/lpwx/fleet/transport-records?isReconciled=true

// 5. 统计已对账的记录
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=true
```

### 8.2 对账工作流

```javascript
// 1. 获取未对账的记录列表
GET /api/lpwx/fleet/transport-records?isReconciled=false

// 2. 用户选择记录进行对账
// 3. 批量标记为已对账
PUT /api/lpwx/fleet/income-expense-records/1
{
  "isReconciled": true
}

PUT /api/lpwx/fleet/transport-records/2
{
  "isReconciled": true
}

// 4. 查看对账统计
GET /api/lpwx/fleet/stats/reconciliation?period=thisMonth&isReconciled=true
```

---

**文档版本：** 1.0  
**最后更新：** 2025-01-15

