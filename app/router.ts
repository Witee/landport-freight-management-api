export default (app) => {
  const { controller, router } = app;

  // 统一设置 /api 前缀
  router.prefix('/api');

  // ========== 第一套系统：陆港货运管理微信小程序相关接口 ==========
  // 前缀：lpwx
  // 权限：由 /api/lpwx/auth/wx-login 控制，使用 jwtAuth + requireAuth

  // 认证相关
  router.post('/lpwx/auth/wx-login', controller.auth.wxLogin);

  // 文件上传
  router.post('/lpwx/upload/goods-image', controller.upload.uploadGoodsImage);
  router.post('/lpwx/upload/multiple-images', controller.upload.uploadMultipleImages);

  // 货物相关
  router.get('/lpwx/goods/list', controller.goods.list);
  router.get('/lpwx/goods/list-all', controller.goods.listAll);
  router.get('/lpwx/goods/stats', controller.goods.stats);
  router.get('/lpwx/goods/reconciliation', controller.goods.reconciliation);
  router.get('/lpwx/goods/:id', controller.goods.detail);
  router.post('/lpwx/goods', controller.goods.create);
  router.put('/lpwx/goods/:id', controller.goods.update);
  router.put('/lpwx/goods/:id/status', controller.goods.updateStatus);
  router.patch('/lpwx/goods/:id/status', controller.goods.updateStatus);
  router.delete('/lpwx/goods/:id', controller.goods.delete);

  // ========== 第二套系统：达成货运代理官网相关接口 ==========
  // 前缀：dc
  // 权限：GET 由 website-token 控制，写操作由 /api/dc/auth/login 控制（通过 User.role 判断管理员）

  // 后台管理认证（达成官网管理接口，路径不体现 admin）
  router.post('/dc/auth/login', controller.dcAuth.login);

  // 案例相关（GET 请求支持 website-token，写操作需要管理员权限）
  router.get('/dc/cases', controller.case.list);
  router.get('/dc/cases/:id', controller.case.detail);
  router.post('/dc/cases', controller.case.create);
  router.put('/dc/cases/:id', controller.case.update);
  router.delete('/dc/cases/:id', controller.case.delete);

  // 管理员文件上传（路径不体现 admin）
  router.post('/dc/upload/goods-image', controller.upload.uploadGoodsImageAdmin);
  router.post('/dc/upload/multiple-images', controller.upload.uploadMultipleImagesAdmin);

  // ========== 预留前缀：lp ==========
  // 用于未来陆港货运管理系统扩展
};
