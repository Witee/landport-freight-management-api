// typings/app/model/index.d.ts
import 'egg';
import { Model, BuildOptions, CreateOptions, Sequelize } from 'sequelize';

export type IGoodsStatus = 'pending' | 'collected' | 'transporting' | 'delivered' | 'cancelled';

export const GoodsStatus: {
  readonly PENDING: 'pending';
  readonly COLLECTED: 'collected';
  readonly TRANSPORTING: 'transporting';
  readonly DELIVERED: 'delivered';
  readonly CANCELLED: 'cancelled';
};

// Goods 模型属性接口
export interface GoodsAttributes {
  id?: number;
  receiverName: string;
  receiverPhone: string;
  senderName: string;
  senderPhone: string;
  volume: number;
  weight: number;
  status: IGoodsStatus;
  remark?: string;
  images?: string[];
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Goods 模型实例接口
export interface GoodsInstance extends Model<GoodsAttributes>, GoodsAttributes {}

// 扩展 Sequelize 的 CreateOptions 以支持自定义属性
export interface GoodsCreateOptions extends CreateOptions {
  createdBy: number;
}

// Goods 模型静态方法接口
export interface GoodsModelStatic extends Model {
  new (values?: GoodsAttributes, options?: BuildOptions): GoodsInstance;

  // 静态方法
  initModel(sequelize: Sequelize): void;

  // Sequelize 自动生成的方法
  findOne(options?: any): Promise<GoodsInstance | null>;
  findAll(options?: any): Promise<GoodsInstance[]>;
  findByPk(id: number): Promise<GoodsInstance | null>;
  create(values: GoodsAttributes, options?: GoodsCreateOptions): Promise<GoodsInstance>;
  update(values: Partial<GoodsAttributes>, options: any): Promise<[number]>;
  destroy(options?: any): Promise<number>;
  count(options?: any): Promise<number>;
  findAndCountAll(options?: any): Promise<{ count: number; rows: GoodsInstance[] }>;

  // 关联关系方法（根据你的实际需求添加）
  associate?: (models: any) => void;
}
