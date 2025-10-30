import { Controller } from 'egg';

export default class AuthController extends Controller {
  async wxLogin() {
    const { ctx } = this;
    // 简化：直接返回一个模拟的用户登录结果
    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token: '',
        user: { id: 0, nickname: 'guest' },
      },
    };
  }
}
