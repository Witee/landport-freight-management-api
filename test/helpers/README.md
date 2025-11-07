# 测试辅助工具

## 数据库清理

### clearTestDatabase

在每次测试运行前清空测试数据库的工具函数。

**使用方法：**

```typescript
import { test, expect, describe, beforeAll } from 'vitest';
import { app } from '@eggjs/mock/bootstrap';
import { clearTestDatabase } from '../../setup.js';

describe('测试套件', () => {
  beforeAll(async () => {
    // 在测试开始前清空数据库
    await clearTestDatabase(app);
    
    // ... 其他初始化代码
  });
  
  // ... 测试用例
});
```

**功能：**
- 清空所有表的数据（users, goods, cases）
- 重置自增 ID
- 确保表结构已创建

**注意事项：**
- 必须在 `beforeAll` 中调用
- 应该在创建测试数据之前调用
- 使用 `truncate` 方式清空，比 `delete` 更快

