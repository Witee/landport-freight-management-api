# 案例管理内部字段扩展 - 后端接口文档

## 概述

在现有案例管理基础上新增内部管理字段和统计查询功能，仅管理员可访问内部数据。

---

## 数据模型

### Case 实体（扩展后）

```javascript
{
  id: number,
  projectName: string,           // 项目名称（对外展示）
  date: string,                  // 日期（对外展示）
  tags: string[],                // 标签数组（对外展示）
  images: string[],              // 图片数组（对外展示）
  
  // 新增内部字段（仅管理员可见）
  internalWeight: number,        // 货物重量（吨）
  internalVehiclePlate: string,  // 蒙古货车车牌号
  internalImages: string[],      // 对内留存图片
  internalStatus: string,        // 运输状态：pending/transporting/arrived
  internalRemark: string,        // 内部备注
  
  createdAt: string,
  updatedAt: string
}
```

### 运输状态枚举

```javascript
const InternalStatus = {
  PENDING: 'pending',        // 待运输
  TRANSPORTING: 'transporting', // 运输中
  ARRIVED: 'arrived'         // 已到达
};
```

---

## 接口列表

### 1. 创建案例（扩展）

**POST** `/api/dc/cases`

**请求体**：
```json
{
  "projectName": "钢板运输项目",
  "date": "2026-03-26",
  "tags": ["二连浩特", "钢板"],
  "images": ["https://example.com/image1.jpg"],
  
  "internalWeight": 20.5,
  "internalVehiclePlate": "蒙A12345",
  "internalImages": ["https://example.com/internal1.jpg"],
  "internalStatus": "pending",
  "internalRemark": "急件，优先处理"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 123,
    "projectName": "钢板运输项目",
    "date": "2026-03-26",
    "tags": ["二连浩特", "钢板"],
    "images": ["https://example.com/image1.jpg"],
    "internalWeight": 20.5,
    "internalVehiclePlate": "蒙A12345",
    "internalImages": ["https://example.com/internal1.jpg"],
    "internalStatus": "pending",
    "internalRemark": "急件，优先处理",
    "createdAt": "2026-03-26T10:00:00Z",
    "updatedAt": "2026-03-26T10:00:00Z"
  }
}
```

---

### 2. 更新案例（扩展）

**PUT** `/api/dc/cases/:id`

**请求体**：同创建接口

**响应**：同创建接口

---

### 3. 查询案例列表（扩展）

**GET** `/api/dc/cases`

**查询参数**：
```
?page=1
&limit=20
&search=钢板           // 可选，搜索项目名称
&vehiclePlate=蒙A12345 // 可选，按车牌号筛选
&status=transporting   // 可选，按运输状态筛选
&year=2026            // 可选，按年份筛选
```

**响应**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 123,
        "projectName": "钢板运输项目",
        "date": "2026-03-26",
        "tags": ["二连浩特", "钢板"],
        "images": ["https://example.com/image1.jpg"],
        "internalWeight": 20.5,
        "internalVehiclePlate": "蒙A12345",
        "internalImages": ["https://example.com/internal1.jpg"],
        "internalStatus": "transporting",
        "internalRemark": "急件，优先处理",
        "createdAt": "2026-03-26T10:00:00Z",
        "updatedAt": "2026-03-26T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 56,
      "totalPages": 3
    }
  }
}
```

---

### 4. 获取案例详情（扩展）

**GET** `/api/dc/cases/:id`

**响应**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 123,
    "projectName": "钢板运输项目",
    "date": "2026-03-26",
    "tags": ["二连浩特", "钢板"],
    "images": ["https://example.com/image1.jpg"],
    "internalWeight": 20.5,
    "internalVehiclePlate": "蒙A12345",
    "internalImages": ["https://example.com/internal1.jpg"],
    "internalStatus": "arrived",
    "internalRemark": "急件，优先处理",
    "createdAt": "2026-03-26T10:00:00Z",
    "updatedAt": "2026-03-26T15:00:00Z"
  }
}
```

---

## 数据验证规则

### 内部字段验证

```javascript
// 货物重量
internalWeight: {
  type: 'number',
  required: false,  // 选填
  min: 0,
  max: 1000,
  message: '货物重量必须在 0-1000 吨之间'
}

// 蒙古车牌号
internalVehiclePlate: {
  type: 'string',
  required: false,  // 选填
  max: 20,
  message: '车牌号不能超过20字符'
}

// 运输状态
internalStatus: {
  type: 'enum',
  required: false,
  values: ['pending', 'transporting', 'arrived'],
  defaultValue: 'pending',
  message: '运输状态无效'
}

// 内部备注
internalRemark: {
  type: 'string',
  required: false,
  max: 500,
  message: '内部备注不能超过 500 字符'
}

// 内部图片
internalImages: {
  type: 'array',
  required: false,
  itemType: 'string',
  message: '内部图片必须为数组'
}
```

---

## 注意事项

1. **权限控制**：所有内部字段仅对 DC 管理员可见
2. **数据兼容**：旧案例数据的内部字段为 NULL，不影响展示
3. **状态流转**：建议实现状态流转记录（可选）

---

## 后端实现建议

### Egg.js Model 扩展

```javascript
// app/model/Case.ts
export default (app) => {
  const { STRING, INTEGER, DATE, JSON, DECIMAL } = app.Sequelize;
  
  const Case = app.model.define('Case', {
    // ... 现有字段
    
    internalWeight: {
      type: DECIMAL(10, 2),
      allowNull: true,
      comment: '货物重量（吨）',
    },
    internalVehiclePlate: {
      type: STRING(20),
      allowNull: true,
      comment: '蒙古货车车牌号',
    },
    internalImages: {
      type: JSON,
      allowNull: true,
      comment: '对内留存图片数组',
    },
    internalStatus: {
      type: STRING(20),
      allowNull: true,
      defaultValue: 'pending',
      comment: '运输状态',
    },
    internalRemark: {
      type: STRING(500),
      allowNull: true,
      comment: '内部备注',
    },
  }, {
    tableName: 'cases',
    timestamps: true,
  });
  
  return Case;
};
