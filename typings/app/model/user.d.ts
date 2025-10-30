// typings/app/model/user.d.ts
import 'egg';
import { Model, BuildOptions, CreateOptions, Sequelize } from 'sequelize';

// User 模型属性接口
export interface UserAttributes {
  id?: number;
  openid: string;
  nickname: string;
  avatar?: string;
  role: UserRole;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User 模型实例接口
export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

// User 模型静态方法接口
export interface UserModelStatic extends Model {
  new (values?: UserAttributes, options?: BuildOptions): UserInstance;

  // 静态方法
  initModel(sequelize: Sequelize): void;

  // Sequelize 自动生成的方法
  findOne(options?: any): Promise<UserInstance | null>;
  findAll(options?: any): Promise<UserInstance[]>;
  findByPk(id: number): Promise<UserInstance | null>;
  create(values: UserAttributes, options?: CreateOptions): Promise<UserInstance>;
  update(values: Partial<UserAttributes>, options: any): Promise<[number]>;
  destroy(options?: any): Promise<number>;
  count(options?: any): Promise<number>;

  // 关联关系方法
  associate?: (models: any) => void;
}

// 导出 UserRole 类型
export const UserRole: {
  readonly ADMIN: 'admin';
  readonly USER: 'user';
};

export type UserRole = 'admin' | 'user';
