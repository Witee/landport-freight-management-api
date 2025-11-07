import { beforeAll, afterAll } from 'vitest';

// https://vitest.dev/config/#setupfiles
// export beforeAll and afterAll to globalThis, let @eggjs/mock/bootstrap use it
Object.assign(globalThis, { beforeAll, afterAll });

// 导出清理函数供测试文件使用
export { clearTestDatabase } from './helpers/db-cleanup.js';
