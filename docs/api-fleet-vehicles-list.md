# 车辆列表接口文档

## 接口信息

**接口路径：** `GET /api/lpwx/fleet/vehicles`

**认证要求：** 需要微信小程序用户登录认证（通过 `X-Token` 请求头）

**基础路径：** `/api/lpwx/fleet`

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `page` | number | 否 | 页码，最小值为 1，默认 1 | `1` |
| `pageSize` | number | 否 | 每页数量，范围 1-100，默认 10 | `100` |
| `startDate` | string | 否 | 开始日期（格式：YYYY-MM-DD），用于计算收入和支出统计。未提供时默认使用最近30天 | `"2025-10-27"` |
| `endDate` | string | 否 | 结束日期（格式：YYYY-MM-DD），用于计算收入和支出统计。未提供时默认为今天 | `"2025-11-26"` |

**重要说明：**
- ❌ **不支持排序参数**：接口不再接受 `sortBy` 和 `sortOrder` 参数
- ✅ **固定排序**：接口固定按利润（profit）降序排序
- ✅ **前端排序**：如需其他排序方式（如按收入、支出、创建时间等），请在前端本地进行排序
- ✅ **总是返回所有车辆**：接口总是返回用户的所有车辆，即使指定日期范围内没有收支记录也会显示（统计字段为 0）

---

## 请求示例

```bash
# 示例 1：使用日期范围查询
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100&startDate=2025-10-27&endDate=2025-11-26
X-Token: <微信小程序用户token>

# 示例 2：不提供日期参数（使用默认最近30天）
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100
X-Token: <微信小程序用户token>
```

---

## 响应格式

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
      },
      {
        "id": 2,
        "userId": 123,
        "brand": "HOWO",
        "horsepower": "400",
        "loadCapacity": "20吨",
        "axleCount": 4,
        "tireCount": 18,
        "trailerLength": "15米",
        "certificateImages": [],
        "otherImages": [],
        "income": "0",
        "expense": "0",
        "profit": "0",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "pageSize": 100,
      "totalPages": 1
    }
  }
}
```

---

## 响应字段说明

### 车辆对象字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | number | 车辆ID | `1` |
| `userId` | number | 所属用户ID（后端自动关联，前端无需处理） | `123` |
| `brand` | string | 品牌 | `"解放"` |
| `horsepower` | string | 马力 | `"300"` |
| `loadCapacity` | string | 载重 | `"10吨"` |
| `axleCount` | number | 轴数 | `3` |
| `tireCount` | number | 轮胎数量 | `12` |
| `trailerLength` | string | 挂车长度 | `"13米"` |
| `certificateImages` | string[] | 证件图片URL数组（如果为 null 会自动转为空数组 `[]`） | `["/uploads/.../cert1.jpg"]` |
| `otherImages` | string[] | 其它图片URL数组（如果为 null 会自动转为空数组 `[]`） | `["/uploads/.../other1.jpg"]` |
| **`income`** | **string** | **该车辆在指定日期范围内的总收入（单位：元）** | `"50000"` |
| **`expense`** | **string** | **该车辆在指定日期范围内的总支出（单位：元）** | `"30000"` |
| **`profit`** | **string** | **该车辆在指定日期范围内的利润（单位：元）** | `"20000"` |
| `createdAt` | string | 创建时间（ISO 8601 格式） | `"2025-01-15T10:00:00.000Z"` |
| `updatedAt` | string | 更新时间（ISO 8601 格式） | `"2025-01-15T10:00:00.000Z"` |

### 分页信息字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `total` | number | 总车辆数（所有车辆，不根据日期范围过滤） | `10` |
| `page` | number | 当前页码 | `1` |
| `pageSize` | number | 每页数量 | `100` |
| `totalPages` | number | 总页数 | `1` |

---

## 收入和支出计算说明

### 计算逻辑

- **收入 (income)** = 该车辆在指定日期范围内所有收支记录的 `freight`（运费）+ `otherIncome`（其它收入）的总和
- **支出 (expense)** = 该车辆在指定日期范围内所有收支记录的 `fuelCost`（油费）+ `repairCost`（维修费）+ `parkingCost`（停车费）+ `clearanceCost`（通关费）+ `otherExpense`（其它费用）的总和
- **利润 (profit)** = `income - expense`

### 特殊情况

- 如果车辆在指定日期范围内**没有收支记录**，`income`、`expense`、`profit` 字段均为 `"0"`
- 车辆基本信息（品牌、马力等）**始终返回**，不受日期范围影响
- 所有金额字段均为**字符串类型**，单位为**元**

---

## 排序规则

- **后端排序**：接口固定按利润（profit）降序排序，不支持排序参数
- **前端排序**：如需其他排序方式，请在前端本地进行排序
  - 可以按 `income`（收入）排序
  - 可以按 `expense`（支出）排序
  - 可以按 `createdAt`（创建时间）排序
  - 可以按其他字段排序

---

## 日期范围说明

### 默认行为

- 如果**未提供** `startDate` 和 `endDate` 参数，接口默认使用**最近30天**作为日期范围
- 如果**只提供** `startDate`，`endDate` 默认为**今天**
- 如果**只提供** `endDate`，`startDate` 默认为**30天前**

### 日期格式

- 日期格式必须为 `YYYY-MM-DD`（例如：`2025-10-27`）
- 日期范围包含开始日期和结束日期（inclusive）

### 示例

```bash
# 查询 2025年10月27日 到 2025年11月26日 的数据
GET /api/lpwx/fleet/vehicles?startDate=2025-10-27&endDate=2025-11-26

# 不提供日期参数，使用默认最近30天
GET /api/lpwx/fleet/vehicles
```

---

## 错误响应

| HTTP 状态码 | 说明 | 响应示例 |
|------------|------|----------|
| `401` | 未登录或 token 无效 | `{ "code": 401, "message": "未登录或令牌无效" }` |
| `400` | 请求参数错误（如日期格式错误） | `{ "code": 400, "message": "日期格式错误，必须为 YYYY-MM-DD 格式" }` |
| `500` | 服务器错误 | `{ "code": 500, "message": "服务器错误" }` |

---

## 前端集成建议

### 1. 日期范围选择

前端应该提供日期选择器，允许用户选择 `startDate` 和 `endDate`，然后传递给接口。

### 2. 本地排序

由于接口固定按利润降序排序，如果前端需要其他排序方式，可以在获取数据后进行本地排序：

```typescript
// 示例：按收入降序排序
const sortedList = data.list.sort((a, b) => {
  return Number(b.income) - Number(a.income);
});
```

### 3. 金额字段处理

所有金额字段（`income`、`expense`、`profit`）都是字符串类型，前端需要转换为数字进行计算或显示：

```typescript
const income = Number(vehicle.income); // "50000" -> 50000
const expense = Number(vehicle.expense); // "30000" -> 30000
const profit = Number(vehicle.profit); // "20000" -> 20000
```

### 4. 空数据处理

如果车辆在指定日期范围内没有记录，统计字段为 `"0"`，前端应该正常显示车辆信息，统计字段显示为 0。

---

## 测试用例

### 测试 1：基本查询

```bash
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100
X-Token: <token>
```

**预期结果：**
- 返回所有车辆
- 按利润降序排序
- 包含 `income`、`expense`、`profit` 字段
- 如果最近30天内没有记录，统计字段为 `"0"`

### 测试 2：指定日期范围

```bash
GET /api/lpwx/fleet/vehicles?page=1&pageSize=100&startDate=2025-10-27&endDate=2025-11-26
X-Token: <token>
```

**预期结果：**
- 返回所有车辆
- 按利润降序排序
- `income`、`expense`、`profit` 字段基于指定日期范围计算
- 如果指定日期范围内没有记录，统计字段为 `"0"`

### 测试 3：空数据情况

如果用户有车辆但指定日期范围内没有任何收支记录：

**预期结果：**
- 仍然返回所有车辆
- 所有车辆的 `income`、`expense`、`profit` 字段均为 `"0"`
- 车辆基本信息正常返回

---

## 变更记录

**最新更新：** 2025-11-26

**主要变更：**
1. ✅ 移除了 `sortBy` 和 `sortOrder` 参数支持
2. ✅ 接口固定按利润降序排序
3. ✅ 添加了 `startDate` 和 `endDate` 日期范围参数
4. ✅ 响应中新增 `income`、`expense`、`profit` 字段
5. ✅ 总是返回所有车辆，没有记录的车辆统计字段为 `"0"`

---

**文档版本：** v2.0  
**最后更新：** 2025-11-26

