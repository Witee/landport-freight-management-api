/* Simple end-to-end smoke test for all routes */
import { spawn } from 'node:child_process';
console.log('[smoke] starting...');
const baseCandidates = ['http://127.0.0.1:7001', 'http://127.0.0.1:7002'];

async function pickBase() {
  for (const b of baseCandidates) {
    try {
      const res = await fetch(b + '/api/lpwx/goods/list');
      if (res.ok || res.status === 403 || res.status === 400 || res.status === 404) return b;
    } catch {}
  }
  return baseCandidates[0];
}

async function waitForServer(base, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(base + '/api/lpwx/goods/list');
      if (res.ok || [400, 401, 403, 404, 405].includes(res.status)) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function ensureServer() {
  let base = await pickBase();
  let ok = await waitForServer(base, 3000);
  if (ok) return { base, proc: null };

  // try to start dev server
  // 确保启动被测服务时开启 mock（仅对新启动的进程生效；若已有服务在跑，请先停止再跑 smoke）
  const env = { ...process.env, WX_USE_MOCK: process.env.WX_USE_MOCK || '1' };
  const proc = spawn('npm', ['run', 'dev'], { stdio: 'ignore', env });
  // wait until ready
  ok = await waitForServer(base, 25000);
  if (!ok) {
    try {
      proc.kill('SIGTERM');
    } catch {}
    throw new Error('dev server not ready in time');
  }
  return { base, proc };
}

async function jsonReq(base, method, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (method !== 'GET' && body) opts.body = JSON.stringify(body);
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function uploadSingle(base, token, goodsId) {
  const fd = new FormData();
  const blob = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  fd.append('file', blob, 'test.png');
  if (goodsId) fd.append('goodsId', String(goodsId));
  const headers = {};
  if (token) headers['authorization'] = 'Bearer ' + token;
  const res = await fetch(base + '/api/lpwx/upload/goods-image', { method: 'POST', headers, body: fd });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function uploadMultiple(base, token, goodsId) {
  const fd = new FormData();
  const blob1 = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  const blob2 = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  fd.append('file', blob1, 'test1.png');
  fd.append('file', blob2, 'test2.png');
  if (goodsId) fd.append('goodsId', String(goodsId));
  const headers = {};
  if (token) headers['authorization'] = 'Bearer ' + token;
  const res = await fetch(base + '/api/lpwx/upload/multiple-images', { method: 'POST', headers, body: fd });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

const main = async () => {
  const { base, proc } = await ensureServer();
  console.log('[smoke] base =', base);
  const results = {};
  try {
    // login user (微信小程序登录)
    const loginUser = await jsonReq(base, 'POST', '/api/lpwx/auth/wx-login', {
      code: 'test_code',
      nickname: 'User',
      avatar: 'https://example.com/avatar.jpg',
    });
    if (loginUser.status !== 200) throw new Error('login user failed ' + JSON.stringify(loginUser));
    const userToken = loginUser.data?.data?.token;
    const userId = loginUser.data?.data?.user?.id;

    // login admin (达成官网登录)
    const loginAdmin = await jsonReq(base, 'POST', '/api/dc/auth/login', {
      username: 'admin',
      password: 'admin123',
    });
    // admin login may fail if user doesn't exist, that's ok for smoke test
    const adminToken = loginAdmin.data?.data?.token;

    // user list
    results.list = await jsonReq(base, 'GET', '/api/lpwx/goods/list', null, userToken);

    // user create goods
    const createBody = {
      name: '测试货物',
      waybillNo: 'SF1234567890',
      receiverName: '张三',
      receiverPhone: '13800138000',
      senderName: '李四',
      senderPhone: '13900139000',
      volume: 1.23,
      weight: 12.3,
      freight: 88.88,
      remark: '首单',
      images: [],
    };
    const create = await jsonReq(base, 'POST', '/api/lpwx/goods', createBody, userToken);
    if (create.status !== 200) throw new Error('create goods failed ' + JSON.stringify(create));
    const goodsId = create.data?.data?.id;

    // user detail
    results.detail = await jsonReq(base, 'GET', `/api/lpwx/goods/${goodsId}`, null, userToken);
    // quick check for new fields
    const d = results.detail?.data?.data || {};
    results.detail._fields = { name: d.name, waybillNo: d.waybillNo, freight: d.freight };

    // user update
    results.update = await jsonReq(base, 'PUT', `/api/lpwx/goods/${goodsId}`, { remark: '已更新' }, userToken);

    // user update status
    results.status = await jsonReq(
      base,
      'PATCH',
      `/api/lpwx/goods/${goodsId}/status`,
      { status: 'collected' },
      userToken
    );

    // admin list-all
    if (adminToken) {
      results.listAll = await jsonReq(base, 'GET', '/api/lpwx/goods/list-all', null, adminToken);
    }

    // upload single (bind to goods)
    results.uploadSingle = await uploadSingle(base, userToken, goodsId);

    // upload multiple (bind to goods)
    results.uploadMultiple = await uploadMultiple(base, userToken, goodsId);

    // re-fetch detail to verify images bound
    results.detailAfterUpload = await jsonReq(base, 'GET', `/api/lpwx/goods/${goodsId}`, null, userToken);

    // search by keyword (should match waybillNo or names/phones)
    results.searchKeyword = await jsonReq(base, 'GET', `/api/lpwx/goods/list?keyword=SF123456`, null, userToken);

    // user delete
    results.delete = await jsonReq(base, 'DELETE', `/api/lpwx/goods/${goodsId}`, null, userToken);

    // print concise summary
    // check upload URL structure contains /public/uploads/YYYY-MM-DD/{userId}/
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateDir = `${yyyy}-${mm}-${dd}`;

    const up1url = results.uploadSingle?.data?.data?.url;
    const upMulUrls = Array.isArray(results.uploadMultiple?.data?.data)
      ? results.uploadMultiple.data.data.map((x) => x.url)
      : [];

    const expectedPart = `/public/uploads/${dateDir}/${userId}/`;

    const summary = Object.fromEntries(
      Object.entries(results).map(([k, v]) => [
        k,
        {
          status: v.status,
          code: v.data?.code,
          message: v.data?.message,
          fields: v._fields,
        },
      ])
    );

    summary.uploadSingle.url = up1url;
    summary.uploadSingle.expectContains = expectedPart;
    summary.uploadSingle.urlOk = typeof up1url === 'string' && up1url.includes(expectedPart);
    summary.uploadMultiple.urls = upMulUrls;
    summary.uploadMultiple.expectContains = expectedPart;
    summary.uploadMultiple.urlsOk = upMulUrls.every((u) => typeof u === 'string' && u.includes(expectedPart));
    // images length check after upload binding
    const detailAfter = results.detailAfterUpload?.data?.data || {};
    summary.detailAfterUpload.images = Array.isArray(detailAfter.images) ? detailAfter.images : [];
    summary.detailAfterUpload.imagesCount = (summary.detailAfterUpload.images || []).length;

    // search count
    const searchData = results.searchKeyword?.data?.data || {};
    const listArr = Array.isArray(searchData.list) ? searchData.list : [];
    summary.searchKeyword.count = listArr.length;

    console.log(JSON.stringify({ base, summary }, null, 2));
    if (proc) {
      try {
        proc.kill('SIGTERM');
      } catch {}
    }
    process.exit(0);
  } catch (e) {
    console.error('SMOKE ERROR:', (e && e.stack) || e);
    console.error('Partial results:', results);
    if (proc) {
      try {
        proc.kill('SIGTERM');
      } catch {}
    }
    process.exit(1);
  }
};

await main().catch((e) => {
  console.error('SMOKE ERROR (tla):', (e && e.stack) || e);
  process.exit(1);
});
