// This file is created by egg-ts-helper@3.2.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
export * from 'egg';
export as namespace Egg;

// 扩展 Egg 类型定义
declare module 'egg' {
  interface Context {
    model: {
      Goods: any;
      User: any;
    };
    validate(rules: any): void;
  }

  interface Service {
    goodsService: any;
    userService: any;
  }

  interface EggAppConfig {
    validate: any;
  }
}
