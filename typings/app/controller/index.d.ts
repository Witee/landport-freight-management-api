// This file is created by egg-ts-helper@3.2.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportGoods from '../../../app/controller/goods.js';
import ExportUpload from '../../../app/controller/upload.js';

declare module 'egg' {
  interface IController {
    goods: ExportGoods;
    upload: ExportUpload;
  }
}
