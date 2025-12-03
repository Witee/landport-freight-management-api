# 前端迁移指南：货运记录重命名为收支记录

## 一、变更概述

本次更新将"货运记录"重命名为"收支记录"，并修改了部分费用字段名称。前端需要进行以下修改：

### 1.1 术语变更
- **"货运记录" → "收支记录"**：所有界面显示文本需要更新
- **"住宿费" → "停车费"**：字段名和显示文本都需要更新
- **"饭费" → "通关费"**：字段名和显示文本都需要更新

### 1.2 API 路径变更
所有收支记录相关的 API 路径已更新。

### 1.3 字段名变更
请求和响应中的字段名已更新。

---

## 二、API 路径变更

### 2.1 路径映射表

| 旧路径 | 新路径 |
|-------|-------|
| `GET /api/lpwx/fleet/transport-records` | `GET /api/lpwx/fleet/income-expense-records` |
| `GET /api/lpwx/fleet/transport-records/:id` | `GET /api/lpwx/fleet/income-expense-records/:id` |
| `POST /api/lpwx/fleet/transport-records` | `POST /api/lpwx/fleet/income-expense-records` |
| `PUT /api/lpwx/fleet/transport-records/:id` | `PUT /api/lpwx/fleet/income-expense-records/:id` |
| `DELETE /api/lpwx/fleet/transport-records/:id` | `DELETE /api/lpwx/fleet/income-expense-records/:id` |

### 2.2 修改示例

**修改前：**
```javascript
// 获取收支记录列表
GET /api/lpwx/fleet/transport-records?page=1&pageSize=10

// 获取收支记录详情
GET /api/lpwx/fleet/transport-records/1

// 创建收支记录
POST /api/lpwx/fleet/transport-records

// 更新收支记录
PUT /api/lpwx/fleet/transport-records/1

// 删除收支记录
DELETE /api/lpwx/fleet/transport-records/1
```

**修改后：**
```javascript
// 获取收支记录列表
GET /api/lpwx/fleet/income-expense-records?page=1&pageSize=10

// 获取收支记录详情
GET /api/lpwx/fleet/income-expense-records/1

// 创建收支记录
POST /api/lpwx/fleet/income-expense-records

// 更新收支记录
PUT /api/lpwx/fleet/income-expense-records/1

// 删除收支记录
DELETE /api/lpwx/fleet/income-expense-records/1
```

---

## 三、字段名变更

### 3.1 字段映射表

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `accommodationCost` | `parkingCost` | 住宿费 → 停车费 |
| `mealCost` | `clearanceCost` | 饭费 → 通关费 |

### 3.2 请求体字段变更

**创建/更新收支记录时的请求体：**

**修改前：**
```json
{
  "vehicleId": 1,
  "goodsName": "货物名称",
  "date": "2025-01-01",
  "freight": "1000",
  "otherIncome": "0",
  "fuelCost": "200",
  "repairCost": "100",
  "accommodationCost": "150",
  "mealCost": "80",
  "otherExpense": "50",
  "remark": "备注"
}
```

**修改后：**
```json
{
  "vehicleId": 1,
  "goodsName": "货物名称",
  "date": "2025-01-01",
  "freight": "1000",
  "otherIncome": "0",
  "fuelCost": "200",
  "repairCost": "100",
  "parkingCost": "150",
  "clearanceCost": "80",
  "otherExpense": "50",
  "remark": "备注"
}
```

### 3.3 响应体字段变更

**收支记录列表/详情的响应体：**

**修改前：**
```json
{
  "id": 1,
  "vehicleId": 1,
  "goodsName": "货物名称",
  "date": "2025-01-01",
  "freight": "1000",
  "otherIncome": "0",
  "fuelCost": "200",
  "repairCost": "100",
  "accommodationCost": "150",
  "mealCost": "80",
  "otherExpense": "50",
  "remark": "备注",
  "isReconciled": false
}
```

**修改后：**
```json
{
  "id": 1,
  "vehicleId": 1,
  "goodsName": "货物名称",
  "date": "2025-01-01",
  "freight": "1000",
  "otherIncome": "0",
  "fuelCost": "200",
  "repairCost": "100",
  "parkingCost": "150",
  "clearanceCost": "80",
  "otherExpense": "50",
  "remark": "备注",
  "isReconciled": false
}
```

### 3.4 对账统计响应变更

**对账统计接口的支出分类：**

**修改前：**
```json
{
  "expenseBreakdown": [
    {
      "category": "accommodation",
      "categoryLabel": "住宿费",
      "amount": 1500
    },
    {
      "category": "meal",
      "categoryLabel": "饭费",
      "amount": 800
    }
  ]
}
```

**修改后：**
```json
{
  "expenseBreakdown": [
    {
      "category": "parking",
      "categoryLabel": "停车费",
      "amount": 1500
    },
    {
      "category": "clearance",
      "categoryLabel": "通关费",
      "amount": 800
    }
  ]
}
```

---

## 四、界面显示文本变更

### 4.1 需要更新的文本

| 旧文本 | 新文本 |
|-------|-------|
| 货运记录 | 收支记录 |
| 住宿费 | 停车费 |
| 饭费 | 通关费 |

### 4.2 修改建议

1. **页面标题**：所有"货运记录"相关的页面标题改为"收支记录"
2. **表单标签**：
   - "住宿费" 输入框标签改为 "停车费"
   - "饭费" 输入框标签改为 "通关费"
3. **列表/详情页**：显示字段时使用新的标签文本
4. **统计图表**：对账统计中的分类标签需要更新

---

## 五、代码修改清单

### 5.1 API 调用修改

- [ ] 更新所有收支记录相关的 API 路径（`transport-records` → `income-expense-records`）
- [ ] 更新请求体中的字段名（`accommodationCost` → `parkingCost`，`mealCost` → `clearanceCost`）
- [ ] 更新响应体字段的解析（使用新的字段名）

### 5.2 界面文本修改

- [ ] 更新所有"货运记录"为"收支记录"
- [ ] 更新所有"住宿费"为"停车费"
- [ ] 更新所有"饭费"为"通关费"

### 5.3 表单字段修改

- [ ] 更新创建/编辑表单中的字段名绑定
- [ ] 更新表单验证规则中的字段名
- [ ] 更新表单标签文本

### 5.4 数据展示修改

- [ ] 更新列表页面的字段显示
- [ ] 更新详情页面的字段显示
- [ ] 更新统计图表的分类标签

---

## 六、兼容性说明

⚠️ **重要提示**：本次更新**不提供向后兼容**，前端必须同步更新，否则会出现以下问题：

1. API 调用失败（路径不存在）
2. 字段解析错误（字段名不匹配）
3. 数据提交失败（字段验证失败）

**建议**：在更新后端后，立即更新前端代码并部署。

---

## 七、测试检查清单

更新完成后，请检查以下功能：

- [ ] 收支记录列表正常显示
- [ ] 收支记录详情正常显示
- [ ] 创建收支记录功能正常（字段提交正确）
- [ ] 更新收支记录功能正常（字段更新正确）
- [ ] 删除收支记录功能正常
- [ ] 对账统计中的支出分类显示正确
- [ ] 所有界面文本显示正确

---

## 八、示例代码

### 8.1 TypeScript 接口定义

```typescript
// 修改前
interface TransportRecord {
  id: number;
  vehicleId: number;
  goodsName: string;
  date: string;
  freight: string;
  otherIncome: string;
  fuelCost: string;
  repairCost: string;
  accommodationCost: string;  // 旧字段
  mealCost: string;            // 旧字段
  otherExpense: string;
  remark?: string;
  isReconciled: boolean;
}

// 修改后
interface IncomeExpenseRecord {
  id: number;
  vehicleId: number;
  goodsName: string;
  date: string;
  freight: string;
  otherIncome: string;
  fuelCost: string;
  repairCost: string;
  parkingCost: string;         // 新字段
  clearanceCost: string;       // 新字段
  otherExpense: string;
  remark?: string;
  isReconciled: boolean;
}
```

### 8.2 API 服务修改示例

```typescript
// 修改前
const getTransportRecords = (params) => {
  return request.get('/api/lpwx/fleet/transport-records', { params });
};

// 修改后
const getIncomeExpenseRecords = (params) => {
  return request.get('/api/lpwx/fleet/income-expense-records', { params });
};
```

---

## 九、联系支持

如有任何问题，请联系后端开发团队。

