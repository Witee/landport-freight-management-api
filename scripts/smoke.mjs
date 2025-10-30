/* Simple end-to-end smoke test for all routes */
const baseCandidates = ['http://127.0.0.1:7001', 'http://127.0.0.1:7002'];

async function pickBase() {
  for (const b of baseCandidates) {
    try {
      const res = await fetch(b + '/api/goods/list');
      if (res.ok || res.status === 403 || res.status === 400 || res.status === 404) return b;
    } catch {}
  }
  return baseCandidates[0];
}

async function jsonReq(base, method, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = 'Bearer ' + token;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function uploadSingle(base) {
  const fd = new FormData();
  const blob = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  fd.append('file', blob, 'test.png');
  const res = await fetch(base + '/api/upload/goods-image', { method: 'POST', body: fd });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function uploadMultiple(base) {
  const fd = new FormData();
  const blob1 = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  const blob2 = new Blob([Buffer.from('89504E470D0A1A0A', 'hex')], { type: 'image/png' });
  fd.append('file', blob1, 'test1.png');
  fd.append('file', blob2, 'test2.png');
  const res = await fetch(base + '/api/upload/multiple-images', { method: 'POST', body: fd });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

(async () => {
  const base = await pickBase();
  const results = {};
  try {
    // login admin
    const loginAdmin = await jsonReq(base, 'POST', '/api/auth/wx-login', {
      openid: 'admin-1',
      nickname: 'Admin',
      role: 'admin',
    });
    if (loginAdmin.status !== 200) throw new Error('login admin failed ' + JSON.stringify(loginAdmin));
    const adminToken = loginAdmin.data?.data?.token;

    // login user
    const loginUser = await jsonReq(base, 'POST', '/api/auth/wx-login', {
      openid: 'user-1',
      nickname: 'User',
      role: 'user',
    });
    if (loginUser.status !== 200) throw new Error('login user failed ' + JSON.stringify(loginUser));
    const userToken = loginUser.data?.data?.token;

    // user list
    results.list = await jsonReq(base, 'GET', '/api/goods/list', null, userToken);

    // user create goods
    const createBody = {
      receiverName: '张三',
      receiverPhone: '13800138000',
      senderName: '李四',
      senderPhone: '13900139000',
      volume: 1.23,
      weight: 12.3,
      remark: '首单',
      images: [],
    };
    const create = await jsonReq(base, 'POST', '/api/goods', createBody, userToken);
    if (create.status !== 200) throw new Error('create goods failed ' + JSON.stringify(create));
    const goodsId = create.data?.data?.id;

    // user detail
    results.detail = await jsonReq(base, 'GET', `/api/goods/${goodsId}`, null, userToken);

    // user update
    results.update = await jsonReq(base, 'PUT', `/api/goods/${goodsId}`, { remark: '已更新' }, userToken);

    // user update status
    results.status = await jsonReq(base, 'PATCH', `/api/goods/${goodsId}/status`, { status: 'collected' }, userToken);

    // admin list-all
    results.listAll = await jsonReq(base, 'GET', '/api/goods/list-all', null, adminToken);

    // upload single
    results.uploadSingle = await uploadSingle(base);

    // upload multiple
    results.uploadMultiple = await uploadMultiple(base);

    // user delete
    results.delete = await jsonReq(base, 'DELETE', `/api/goods/${goodsId}`, null, userToken);

    // print concise summary
    const summary = Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, { status: v.status, code: v.data?.code, message: v.data?.message }])
    );
    console.log(JSON.stringify({ base, summary }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('SMOKE ERROR:', (e && e.stack) || e);
    console.error('Partial results:', results);
    process.exit(1);
  }
})();
