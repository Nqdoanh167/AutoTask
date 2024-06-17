export enum EStatusOrderCustomer {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TRASH = 'trash',
  DRAFT = 'draft',
  NEW = 'new',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
}

export enum ESourceOrderCustomer {
  APPOINTMENT_BOOKING = 'APPOINTMENT_BOOKING',
  AUTOMATION = 'AUTOMATION',
  BOOKING = 'BOOKING',
  LEADS = 'LEADS',
  POS = 'POS',
  FANPAGE = 'FANPAGE',
  LIVE = 'LIVE',
  SMAXCHAT = 'SMAXCHAT',
  SMAXBOT = 'SMAXBOT',
  SMAXSALE = 'SMAXSALE',
  SMAXAPP = 'SMAXAPP',
  LADIPAGE = 'LADIPAGE',
  SHOPEE = 'SHOPEE',
  LAZADA = 'LAZADA',
  TIKTOK_SHOP = 'TIKTOK_SHOP',
  TIKI = 'TIKI',
  WEBVIEW = 'WEBVIEW',
  NHANHVN = 'NHANHVN',
  SAPO = 'SAPO',
  PANCAKE = 'PANCAKE',
  KIOTVIET = 'KIOTVIET',
  HARAVAN = 'HARAVAN',
  ZALO = 'ZALO',
  ZALO_OA = 'ZALO_OA',
  PANCAKE_POS = 'PANCAKE_POS',
}

export interface ICartItem {
  id: string;
  name: string;
  code: string;
  product: string;
  price: number;
  quantity: number;
}

export interface IOrderCustomer {
  id: string;
  bizId: string;
  author?: string;
  status: EStatusOrderCustomer;
  code?: string;
  customer?: any;
  tags?: string[];
  tagNames?: string[];
  branch?: string;
  branchName?: string;
  source?: ESourceOrderCustomer;
  sourceName?: string;
  sourceId?: string;
  cart?: ICartItem;
  amount?: number;
  amountCartRefund?: number;
  totalAmountPaid?: number;
  totalProduct: number;
  createdAt: Date;
}

export interface ISaleCenter {
  totalOrderCompleted?: number;
  totalOrderRefund?: number;
  totalOrderCancel?: number;
  moneyCompleted?: number;
  moneyRefund?: number;
  moneyCancel: number;
  lastCreatedOrder?: IOrderCustomer;
  lastCompletedOrder?: IOrderCustomer;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  saleCenter?: ISaleCenter;
  id: string;
  bizId?: string;
  fbId?: string;
  zaloId?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  typePrice?: string;
  code: string;
  picture?: string;
  pictures?: string[];
  postcode: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  address: string;
  tags: CustomerTag[];
  orders: IOrderCustomer[];
  createdAt: Date;
  updatedAt: Date;
}
export interface CustomerTag {
  bizId?: string;
  bgColor?: string;
  createdAt?: string;
  name?: string;
  updatedAt?: string;
  id: string;
}
