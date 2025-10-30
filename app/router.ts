export default (app) => {
  const { controller, router } = app;

  // 认证相关
  router.post('/api/auth/wx-login', controller.auth.wxLogin);

  // 文件上传
  router.post('/api/upload/goods-image', controller.upload.uploadGoodsImage);
  router.post('/api/upload/multiple-images', controller.upload.uploadMultipleImages);

  // 货物相关
  router.get('/api/goods/list', controller.goods.list);
  router.get('/api/goods/list-all', controller.goods.listAll);
  router.get('/api/goods/:id', controller.goods.detail);
  router.post('/api/goods', controller.goods.create);
  router.put('/api/goods/:id', controller.goods.update);
  router.patch('/api/goods/:id/status', controller.goods.updateStatus);
  router.delete('/api/goods/:id', controller.goods.delete);
};
