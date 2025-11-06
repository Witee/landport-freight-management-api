export default (app) => {
  const { controller, router } = app;

  // 认证相关
  router.post('/api/auth/wx-login', controller.auth.wxLogin);

  // 后台管理认证
  router.post('/api/admin/auth/login', controller.adminAuth.login);

  // 文件上传
  router.post('/api/upload/goods-image', controller.upload.uploadGoodsImage);
  router.post('/api/upload/multiple-images', controller.upload.uploadMultipleImages);

  // 货物相关
  router.get('/api/goods/list', controller.goods.list);
  router.get('/api/goods/list-all', controller.goods.listAll);
  router.get('/api/goods/stats', controller.goods.stats);
  router.get('/api/goods/reconciliation', controller.goods.reconciliation);
  router.get('/api/goods/:id', controller.goods.detail);
  router.post('/api/goods', controller.goods.create);
  router.put('/api/goods/:id', controller.goods.update);
  router.put('/api/goods/:id/status', controller.goods.updateStatus);
  router.patch('/api/goods/:id/status', controller.goods.updateStatus);
  router.delete('/api/goods/:id', controller.goods.delete);

  // 案例相关（需要后台认证）
  router.get('/api/cases', controller.case.list);
  router.get('/api/cases/:id', controller.case.detail);
  router.post('/api/cases', controller.case.create);
  router.put('/api/cases/:id', controller.case.update);
  router.delete('/api/cases/:id', controller.case.delete);
};
