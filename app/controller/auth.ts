// @ts-nocheck
import { Controller } from 'egg';
import UserFactory from '../model/User.js';

export default class AuthController extends Controller {
  async wxLogin() {
    const { ctx, app } = this;
    // 小程序登录：必须提供 code（或 token 作为别名），不再兼容直接传 openid
    ctx.validate({
      code: { type: 'string', required: false, allowEmpty: false },
      token: { type: 'string', required: false, allowEmpty: false },
      // 兼容微信小程序字段：nickName / avatarUrl
      nickname: { type: 'string', required: false, allowEmpty: true },
      nickName: { type: 'string', required: false, allowEmpty: true },
      avatar: { type: 'string', required: false, allowEmpty: true },
      avatarUrl: { type: 'string', required: false, allowEmpty: true },
      phone: { type: 'string', required: false, format: /^1[3-9]\d{9}$/ },
      role: { type: 'string', required: false },
    });
    let {
      code,
      token: wxToken,
      nickname,
      nickName,
      avatar = '',
      avatarUrl = '',
      phone = '',
      role,
    } = ctx.request.body || {};
    // 映射小程序字段到后端统一字段
    const finalNickname = nickname || nickName || '';
    const finalAvatar = avatar || avatarUrl || '';
    // 兼容小程序把登录临时凭证命名为 token 的情况
    if (!code && wxToken) code = wxToken;
    if (!code) ctx.throw(422, '需提供 code 或 token');

    // 获取或加载 User 模型
    const UserModel = (ctx.model as any)?.User || UserFactory(app as any);
    // 本地环境按需同步，确保新增列（如 phone）存在
    try {
      const syncConfig = (app.config as any).sequelize?.sync;
      const shouldSync = app.config.env === 'local' && !!syncConfig;
      if (shouldSync && UserModel?.sync) {
        const syncOptions = typeof syncConfig === 'object' ? syncConfig : {};
        await UserModel.sync(syncOptions);
      }
    } catch {}

    // 使用 code 调用微信服务换取 openid（默认直连微信；若配置 wechat.useMock=true 则走本地快捷分支）
    let finalOpenid: string | undefined;
    const wechatCfg: any = (app.config as any).wechat || {};
    if (wechatCfg.useMock) {
      finalOpenid = `dev_${code}`;
    } else {
      const { appID, appSecret } = wechatCfg;
      if (!appID || !appSecret) ctx.throw(500, '微信配置缺失');
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(
        appID
      )}&secret=${encodeURIComponent(appSecret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        const data = await resp.json();
        if (!resp.ok || (data && data.errcode)) {
          const msg = (data && (data.errmsg || data.message)) || `wx api http ${resp.status}`;
          ctx.throw(401, `微信登录失败：${msg}`);
        }
        finalOpenid = data.openid;
        if (!finalOpenid) ctx.throw(401, '未获取到 openid');
      } catch (e) {
        // @ts-ignore
        if (e && e.name === 'AbortError') ctx.throw(504, '微信登录超时');
        // @ts-ignore
        ctx.throw(401, `微信登录异常：${e && e.message ? e.message : e}`);
      }
    }

    // 创建或查找用户
    const _res = await UserModel.findOrCreate({
      where: { openid: finalOpenid },
      defaults: {
        nickname: finalNickname || '微信用户',
        avatar: finalAvatar || null,
        phone: phone || null,
        role: role || 'user',
        lastLoginAt: new Date(),
      },
    });
    const user: any = _res[0];
    const created: boolean = _res[1];
    // 如果提供了新属性，则更新
    const needUpdate: any = {};
    // @ts-ignore
    if (finalNickname && finalNickname !== user.nickname) needUpdate.nickname = finalNickname;
    // @ts-ignore
    if (finalAvatar && finalAvatar !== user.avatar) needUpdate.avatar = finalAvatar;
    // @ts-ignore
    if (role && role !== user.role) needUpdate.role = role;
    // @ts-ignore
    if (phone && phone !== user.phone) needUpdate.phone = phone;
    // 刚创建且未提供昵称时，兜底默认昵称
    if (!nickname && created && !user.nickname) needUpdate.nickname = '微信用户';
    // 记录最近登录时间
    // @ts-ignore
    needUpdate.lastLoginAt = new Date();
    if (Object.keys(needUpdate).length) await user.update(needUpdate);

    // 颁发 JWT
    // @ts-ignore
    const token = (app as any).jwt.sign({ userId: user.id, role: user.role }, app.config.jwt.secret, {
      expiresIn: app.config.jwt.expiresIn,
    });

    ctx.body = {
      code: 200,
      message: created ? '注册并登录成功' : '登录成功',
      data: {
        token,
        // @ts-ignore
        user: { id: user.id, nickname: user.nickname, avatar: user.avatar, phone: user.phone, role: user.role },
      },
    };
  }
}
