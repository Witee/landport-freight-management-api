export type IGoodsStatus = 'collected' | 'transporting' | 'delivered' | 'cancelled' | 'exception';

export const GoodsStatus = {
  COLLECTED: 'collected' as const,
  TRANSPORTING: 'transporting' as const,
  DELIVERED: 'delivered' as const,
  CANCELLED: 'cancelled' as const,
  EXCEPTION: 'exception' as const,
} as const;

// Goods 模型属性接口
export interface GoodsAttributes {
  id?: number;
  name?: string;
  waybillNo?: string;
  receiverName: string;
  receiverPhone: string;
  senderName: string;
  senderPhone: string;
  volume: number;
  weight: number;
  freight?: number;
  status: IGoodsStatus;
  remark?: string;
  images?: string[];
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Goods 模型实例接口
export interface GoodsInstance {
  id: number;
  name?: string;
  waybillNo?: string;
  receiverName: string;
  receiverPhone: string;
  senderName: string;
  senderPhone: string;
  volume: number;
  weight: number;
  freight?: number;
  status: IGoodsStatus;
  remark?: string;
  images?: string[];
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;

  // Sequelize 方法
  update(data: Partial<GoodsAttributes>): Promise<GoodsInstance>;
  destroy(): Promise<void>;
}
