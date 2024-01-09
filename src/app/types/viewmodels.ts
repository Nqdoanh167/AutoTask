export interface ObjectAny {
  [name: string]: any;
}

export interface ICommonDataSource<T, K> {
  rows: T[];
  loading: boolean;
  paramsQuery: K;
  total: number;
}

export interface Option {
  id?: string;
  label?: string;
  bgColor?: string;
  value?: string;
  alias?: string;
}

export interface EntityPagination<T> {
  [name: string]: any;
  rows: T[];
  currentRow?: T | null;
  currentRowId?: string | null;
  limit?: number;
  page?: number;
  total?: number;
  search?: string | null;
  debounce?: number;
  isGet?: boolean;
  loading: boolean;
  loadingGetRow?: boolean;
  timeout?: any;
  after?: string | null;
  query?: any;
  sort?: any;
}

// ReturnType<typeof setTimeout> | null

export interface QueryMen {
  // agency?: number
  limit?: number;
  page?: number;
  before?: Date;
  after?: Date;
  q?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export interface BackendError {
  messages?: string[];
  silent?: boolean;
}
export interface GetResult<T> {
  entity: T;
}
export interface EntityResult<T> {
  status: number;
  statusText: string;
  subStatus: number;
  subStatusText: string;
  message: string;
  refToken?: string;
  total: number;
  data: T;
  viewer?: User;
}
export interface Location {
  id: string;
  provinceCode: string;
  province: string;
  districtCode: string;
  district: string;
  wardCode: string;
  ward: string;
  enWard: string;
  location: string;
}
export interface GetAllResult<T> {
  entity: Array<T>;
}
export interface QueryResult<T> {
  entity: EntityResult<T>;
}
export interface AuthResult {
  token: string;
  user: User;
}
export interface Image {
  url?: string;
  urls?: string[];
  loading?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  address?: string;
  picture: string;
  gender?: string;
  birthday?: string;
  role: string;
  biz: Biz;
  quickModules: string[];
  services: {
    facebooks?: string[];
    googles?: string[];
  };
  groupIds?: string[];
  branches: Branch[];
  branchIds: string[];
  groups?: BizGroup[];
  roleIds?: string[];
  roles?: BizRole[];
  createdAt?: Date;
}
export interface Branch {
  address: string;
  desc: string;
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface Biz {
  id: string;
  alias: string;
  location?: string;
  author?: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  branches: Branch[];
  name: string;
  email?: string;
  picture?: string;
  isActive: boolean;
  currency: {
    code: string;
    exchangeRates: string[];
    mask: string;
    name: string;
    symbol: string;
    thousandSeparator: string;
  };
  module: BizModule;
  modules: BizModule[];
  quickModules: string[];
  groups: BizGroup[];
  roles: BizRole[];
  user: User;
  staff: any;
  users: User[];
  timezone: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface BizRole {
  id: string;
  desc: string;
  icon: string;
  isActive: boolean;
  name: string;
}
export interface BizModule {
  id: string;
  name: string;
  alias: string;
  icon: string;
  isActive: true;
  isDefault: false;
  isInside: false;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface BizGroup {
  id: string;
  name: string;
  desc: string;
  modules: BizModule[];
  scopeIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  author?: string;
  bizId?: string;
  coupon?: string;
  name?: string;
  code?: string;
  status: string;
  statusReal: string;
  codeSize?: number;
  codeFormat?: number;
  description?: string;
  type: string;
  start?: Date;
  end?: Date;
  conditionHtml?: string;
  conditions?: CouponCondition[];
  picture?: string;
  applySourceLink?: {
    website?: string;
    webview?: string;
    miniapp?: string;
  };
  formPromotion?: {
    type?: string;
    giveProducts?: string[];
    givePoint?: number;
    discountAmount?: number;
    discountMax?: number;
    discountPercent?: number;
    discountType?: string;
    giveProductOption: string;
    isFreeship: boolean;
  };
  conditionCustomer: {
    status?: string; // all, option
    ids?: string[] | null;
    segments?: string[] | null;
    loyaltyRanks?: string[] | null;
  };
  conditionBranch: {
    status?: string;
    ids?: string[] | null;
  };
  isNotEnd: boolean;
  customer?: {
    id?: string;
    picture?: string;
    code?: string;
    phone?: string;
    name?: string;
    fbid?: string;
  };
  customerLoyalty?: {
    id?: string;
    picture?: string;
    code?: string;
    phone?: string;
    name?: string;
    fbid?: string;
  };
  collaborator?: {
    id?: string;
    picture?: string;
    code?: string;
    phone?: string;
    name?: string;
    fbmessid?: string;
  };
  totalCodeProvide?: number;
  totalCodeCreate?: number;
  totalCodeUsed?: number;
  totalDiscount?: number;
  durationCode?: number;
  expiredCode?: Date;
  operandCondition?: string;
  numUseCode: string | number;
  isUseNumberCode: boolean;
  isTotalCodeProvide: boolean;
  isDurationCode?: boolean;
  isGeneral?: boolean;
  isActive?: boolean;
  isAcceptOrder?: boolean;
  token?: string;
  endpoint?: string;
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: {
    email: string;
    id: string;
    name: string;
    picture: string;
  };
}

export interface CouponHistory {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  bizId: string;
  status: string;
  order: {
    id: string;
    code: string;
  };
  customer: {
    id: string;
    name: string;
  };
  title: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponCondition {
  type?: string;
  categories?: string[];
  beautyServices?: string[];
  combos?: string[];
  totalQuantity?: number;
  totalAmount?: number;
  courseEvent: string;
  priceIds: [string];
  priceNames: [string];
  products?: string[];
  groups?: string[];
}

export interface Category {
  id: string;
  name: string;
  desc?: string;
  category?: string;
  children: Category[];
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Group {
  id: string;
  name: string;
  desc?: string;
  group?: string;
  children: Group[];
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Unit {
  id: string;
  name: string;
  desc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Provider {
  id: string;
  name: string;
  desc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Property {
  id: string;
  name: string;
  desc?: string;
  values?: PropertyValue[];
  createdAt?: Date;
  updatedAt?: Date;
}
export interface PropertyValue {
  id: string;
  name: string;
  property?: string;
  desc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Topping {
  id: string;
  name: string;
  desc?: string;
  values?: ToppingValue[];
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ToppingValue {
  id: string;
  topping?: string;
  name: string;
  desc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: string;
  author?: string;
  business?: string;
  code?: string;
  barcode?: string;
  shortDesc?: string;
  desc?: string;
  type: 'SINGLE' | 'MULTI' | 'TOPPING';
  categories?: string[];
  groups?: string[];
  unit?: string;
  name: string;
  nameParent: string;
  nameProperty: string;
  picture: string;
  pictures: string[];
  parent?: string;
  isParent?: boolean;
  isActive?: boolean;
  isProduct?: boolean;
  isManagerWarehouse?: boolean;
  isManagerImei?: boolean;
  imeiCodes?: string[];
  properties?: ProductProperty[];
  topping?: ProductTopping[];
  children?: Product[];
  isViewChild?: boolean;
  weight: number;
  livestreamPrice: number;
  price: number;
  entryPrice: number;
  fee: number;
  wholesalePrice: number;
  upsalePrice: number;
  marketPrice?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductTopping {
  id: string;
  name: string;
  choice: 'SINGLE' | 'MULTI';
  values: ProductToppingItem[];
}
export interface ProductToppingItem {
  id: string;
  name: string;
  originalPrice: number;
  discount: number;
  price: number;
  isDefault: boolean;
}
export interface ProductProperty {
  id?: string;
  name: string;
  values: {
    id?: string;
    name: string;
  }[];
}
export interface LoyaltyRank {
  id: string;
  bizId?: string;
  author: string;
  bgColor: string;
  content: string;
  gift: {
    typePrice: string;
  };
  icon: string;
  isActive: boolean;
  name: string;
  point: number;
  txtColor: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Customer {
  saleCenter: any;
  id: string;
  bizId?: string;
  fbId?: string;
  zaloId?: string;
  name?: string;
  email?: string;
  phone?: string;
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
  createdAt: Date;
  updatedAt: Date;
}
export interface Segment {
  id: string;
  bizId?: string;
  conditions: [
    {
      attribute: string;
      dataType: string;
      operation: string;
      options: string;
      serviceType: string;
      value: string;
      values: string[];
    },
  ];
  displayName: string;
  isManualGroup: boolean;
  quantityCustomer: {
    from: {
      total: number;
      countedDate: Date;
    };
    to: {
      total: number;
      countedDate: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Collaborator {
  id: string;
  bizId?: string;
  fbId?: string;
  zaloId?: string;
  name?: string;
  email?: string;
  phone?: string;
  typePrice?: string;
  code: string;
  picture?: string;
  pictures?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEvent {
  id: string;
  name: string;
  bizId: string;
  picture: string;
  pictures: string[];
  status: string;
  startAt: Date;
  endAt: Date;
  shortDesc: string;
  desc: string;
  priceType: string;
  totalLesson: number;
  totalAmount: number;
  totalSold: number;
  sold: {id: string; name: string; amount: number; quantity: number}[];
  prices: CourseEventPrice[];
  lessons: CourseEventLesson[];
  gifts: CourseEventGift[];
  program: string;
  programType: string;
  speakers: string[];
  categories: string[];
  programName: string;
  programTypeName: string;
  speakersNames: string[];
  categoriesNames: string[];
  questionConfig?: {
    isActive: boolean;
    isQrcode: boolean;
    webview: string;
    webviewUrl: string;
    token: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface CourseEventLesson {
  id: string;
  name: string;
  status?: string;
  desc: string;
  time: number;
  speakers: string[];
  speakersName: string[];
  isActive: boolean;
  teachingForm?: string;
  postCode?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  address?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  urlMap?: string;
  platform: CourseEventLessonPlatform[];
  setupGiftGame: {
    type: string;
    status: string;
  };
}
export interface CourseEventLessonPlatform {
  social: string;
  url: string;
  name: string;
  isActive: boolean;
}
export interface CourseEventPrice {
  id: string;
  name: string;
  price: number;
  quantity: number;
  desc: string;
  codes: string[] | string;
  codeType: string;
  codeFormat: number;
  codeSize: number;
  picType: string;
  picAttrs: {
    attrInput: string;
    attrValue: string;
    attrLabel: string;
  }[];
  imageDesign?: {
    id: string;
    name: string;
    picture: string;
    params: string[];
  };
  picture: string;
  pictures: string[];
  isActive: boolean;
}
export interface CourseEventGift {
  id: string;
  name: string;
  priceName: string;
  priceId: string;
  price: number;
  originalPrice: number;
  quantityMin: number;
  desc: string;
  expired: Date;
  isActive: boolean;
}
export interface CourseEventGiftGame {
  id: string;
  name: string;
  picture: string;
  price: number;
  total: number;
  used: number;
  desc: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface CourseEventGiftGamePrize {
  id: string;
  bizId: string;
  courseEvent: string;
  lesson: {
    id: string;
    name: string;
  };
  gameType: String;
  giftMode: String;
  giftGame: {
    id: string;
    name: string;
    picture: string;
  };
  ticket: {
    id: string;
    code: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerPicture: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface BeautyService {
  id: string;
  name: string;
  bizId: string;
  picture: string;
  price: number;
  isTherapy: boolean;
  therapySession: number;
  therapyPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Combo {
  id: string;
  name: string;
  picture: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManageQueue {
  id: string;
  data: ObjectAny;
  name: string;
  worker: string;
  hit: number;
  bizId: string;
  order: string;
  schedule: Date;
  progress: string;
  note: string;
  priority: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export enum ETypeAppointment {
  STATUS = 'STATUS',
  APPOINTMENT = 'APPOINTMENT',
}
export interface IDataColumns {
  columnEventGlobal: IColumns[];
  columnRenderCode: IColumns[];
  columnCoupon: IColumns[];
}
export interface IColumns {
  name: string;
  value: string;
  fieldSort?: string;
  tooltip?: string;
  showTooltip?: boolean;
}
export enum ERole {
  OWNER = 'OWNER',
  DEV = 'DEV',
}

export interface AppointmentStatus {
  id: string;
  bizId: string;
  author: string;
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  type: string;
  name: string;
  desc: string;
  bgColor: string;
  pos: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface AppointmentRoom {
  id: string;
  bizId: string;
  author: string;
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  name: string;
  branch: string;
  desc: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface AppointmentBooking {
  id: string;
  bizId: string;
  author: string;
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  order?: {
    id: string;
    code: string;
    author: {
      id: string;
      name: string;
      email: string;
      picture: string;
    };
  };
  appointmentStatus?: {
    id: string;
    name: string;
    type?: string;
  };
  appointmentRoom?: {
    id: string;
    name: string;
  };
  title: string;
  desc: string;
  start: Date;
  end: Date;
  shifts?: {
    id: string;
    fromTime: number;
    toTime: number;
    title: string;
  }[];
  tags: string[];
  cart: OrderCart[];
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  sale?: {
    isSchedule: boolean;
    scheduleTime: Date;
    orderNumber: number;
  };
  teams: OrderTeam[];
  platformSourceIds: string[];
  platformSources: OrderPlatformSource[];
  branch: string;
  branchName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeautyService {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  bizId: string;
  picture: string;
  categories: string[];
  categoryNames: string[];
  workingTimeName: string;
  name: string;
  desc: string;
  price: number;
  isTherapy: boolean;
  therapyPrice: number;
  therapySession: number;
  therapyDurationName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface BeautyOrderService {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  bizId: string;
  order: {
    id: string;
    code: string;
  };
  customer: {
    id: string;
    name: string;
    picture: string;
    email: string;
    phone: string;
    address: string;
    fbid: string;
  };
  service: {
    id: string;
    isVirtual: boolean;
    name: string;
    picture: string;
    desc: string;
    price: string;
    isTherapy: boolean;
    therapyPrice: number;
    therapySession: string;
    therapyDurationName: string;
  };
  isTherapy: boolean;
  isTherapySession: boolean;
  orderService: string;
  amountDiscount: number;
  price: number;
  quantity: number;
  amount: number;
  lastSessionNumber: number;
  lastSessionDate: Date;
  reasonCancel: string; // Lý do hủy nếu isActive = false
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface UserWeekDay {
  date: Date;
  day: number;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  isWeekend: boolean;
  cssClass?: string;
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface PrepaidCard {
  id: string;
  author: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
  updatedBy: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
  order?: {
    id: string;
    code: string;
    quantity: number;
    price: number;
    amountDiscount: number;
    amount: number;
  };
  bizId: string;
  card: string;
  name: string;
  picture: string;
  type: string;
  code: string;
  codeSize: number;
  codeFormat: number;
  typeCode: string;
  desc: string;
  customer: {
    id: string;
    picture: string;
    code: string;
    phone: string;
    name: string;
    fbid: string;
  };
  value: number;
  wallet: number;
  walletHold: number;
  walletUse: number;
  discount: number;
  price: number;
  numUseCode: string;
  numBuyCustomer: string;
  totalCodeProvide: number;
  totalCodeCreate: number;
  totalCodeUsed: number;
  durationCode: number;
  expiredCode: Date;
  isGeneral: boolean;
  isSharing: boolean;
  isActive: boolean;
  isExpired: boolean;
  noteExpired: string;
  isAcceptOrder?: boolean;
  conditionHtml?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface SaleHistory {
  id: string;
  bizId: string;
  loading?: boolean;
  isUpdateResult?: boolean;
  author?: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  name: string;
  desc: string;
  type: string;
  orderNumber: string;
  order: {
    id: string;
    code: string;
  };
  appointmentBooking: {
    id: string;
    title: string;
  };
  smsottcallPlatform: {
    id: string;
    name: string;
    platform: string;
  };
  voice: {
    callId: string;
    platform: string;
    smsottcallPlatform: string;
    status: string;
    toPhone: string;
    fromPhone: string;
    duration: number;
    radioLink: string;
  };
  result: string;
  reason: string;
  status: string;
  isSchedule: boolean;
  scheduleTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTeam {
  roleId?: string | null;
  roleName?: string | null;
  roleIcon?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPicture?: string | null;
  permissionId?: string | null;
  permissionName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  staffs?: any[];
}

export interface OrderPaymentPrepaidCard {
  id: string;
  card: string;
  code: string;
  name: string;
  isGeneral: boolean;
  isSharing: boolean;
  amount: number;
  wallet: number;
}
export interface OrderPlatformSource {
  id: string;
  name: string;
  link?: string;
  picture: string;
  platform: string;
  platformId: string;
}
export interface OrderCart {
  id?: string;
  cartId?: string;
  ecomId?: string;
  ecomCode?: string;
  type: string;
  warehouseBy: string;
  isPayment?: boolean;
  isGift?: boolean;
  isCourseEvent?: boolean;
  isShowItemExport?: boolean;
  isBeautyService?: boolean;
  isPrepaidCard?: boolean;
  loadingPrice?: boolean;
  isGetSameParent?: boolean;
  loadingSameParent?: boolean;
  courseEvent?: string;
  beautyService?: string;
  prepaidCard?: string;
  beautyOrderService?: string;
  note?: string;
  coupon?: string;
  combo?: string;
  loyaltyRankPrice?: {
    id: null;
    name: null;
    discount: null;
    discountType: null;
  };
  collaboratorRankPrice?: {
    id: string;
    name: string;
    discount: number;
    discountType: string;
  };
  customizePrice?: string;
  customizePriceName?: string;
  comboName?: string;
  comboVersion?: string;
  nameParent?: string;
  name?: string;
  desc?: string;
  code?: string;
  picture?: string;
  loading?: boolean;
  product?: string;
  typePrice: string;
  quantity: number;
  quantityMin: number;
  quantityMax?: number;
  weight: number;
  entryPrice: number;
  toppingPrice: number;
  amountDiscount: number;
  totalEntryPrice?: number;
  flashSale: string;
  flashSaleName: string;
  flashSaleDiscount: number;
  unit: string;
  unitName: string;
  price: number;
  refundQty?: number;
  realPrice: number;
  priceId?: string;
  priceNote?: string;
  priceName?: string;
  originalPrice: number;
  amount?: number;
  isManagerImei?: boolean;
  imeiCodes?: string[];
  exportedImeiCodes?: string[];
  inventoryImeiCodes?: string[];
  totalInventoryImeicodes?: number;
  pageInventoryImeicodes?: number;
  loadingInventoryImeicodes?: boolean;
  searchInventoryImeicodes?: string;
  isGetInventoryImeicodes?: boolean;
  timeoutInventoryImeicodes?: any;
  // itemExports?: ItemExport[];
  isExpand?: boolean;
  isVirtual?: boolean;
  loadingExportWarehouse?: boolean;
  statusWarehouse?: string;
  statusWarehouseName?: string;
  statusWarehouseColor?: string;
  statusWarehouseIcon?: string;
  warehouse?: string;
  inventory?: number;
  hang?: number;
  priceCollaborators?: {
    id?: string;
    name?: string;
    price?: number;
    type?: string;
  }[];
  manufactureProcess?: {
    id: string;
    name: string;
    type: string;
    quantity: number;
  };
  isTherapy: boolean;
  therapySession: number;
  therapySessionMax: number;
}
export interface ConfigAppointmentBookingShift {
  id: string;
  title: string;
  fromTime?: any;
  toTime?: any;
  isActive?: boolean;
}
export interface IRoleAct {
  has_live: boolean;
  has_order: boolean;
  order_create: boolean;
  order_sync_integration: boolean;
  order_edit: boolean;
  order_delete: boolean;
  order_view_all: boolean;
  order_accept_payment: boolean;
  order_model_tab_order: boolean;
  order_model_tab_payment: boolean;
  order_model_tab_shipment: boolean;
  order_model_tab_detail: boolean;
  order_model_tab_history: boolean;
  order_model_tab_print: boolean;
  order_model_tab_trigger: boolean;
  order_model_tab_collaborator: boolean;
  order_model_tab_sale: boolean;
  order_refund: boolean;
  order_view_customer: boolean;
  order_feature_export: boolean;
  order_feature_print: boolean;
  order_feature_change_status: boolean;
  order_feature_view_shipment: boolean;
  order_feature_statistic: boolean;
  order_feature_split: boolean;
  order_feature_connect_shipment: boolean;
  order_feature_update_shipment: boolean;
  order_feature_trigger: boolean;
  order_feature_conflict: boolean;
  has_pos: boolean;
  has_lead: boolean;
  has_appointment: boolean;
  has_manufacture_process: boolean;
  has_pack_process: boolean;
  pack_process_status_full: boolean;
  pack_process_create: boolean;
  pack_process_edit: boolean;
  pack_process_feature_export: boolean;
  pack_process_feature_print: boolean;
  pack_process_feature_change_status: boolean;
  pack_process_feature_statistic: boolean;
  pack_process_feature_split: boolean;
  pack_process_feature_split_all: boolean;
  has_booking: boolean;
  has_shipment: boolean;
  shipment_manage: boolean;
  shipment_collect: boolean;
  shipment_refund_partial: boolean;
  shipment_refund_control: boolean;
  shipment_crosscheck: boolean;
  shipment_connect_shipper: boolean;
  has_setting: boolean;
  config_manage: boolean;
  status_manage: boolean;
  tag_manage: boolean;
  source_manage: boolean;
  sale_manage: boolean;
  has_report: boolean;
  report_view_all: boolean;
  report_owner: boolean;
  has_sync: boolean;
  has_staff: boolean;
}
export interface Config {
  isDetectLocation: boolean;
  appointmentBookingCalendar?: {
    dayStartHour: number;
    dayStartMinute: number;
    dayEndHour: number;
    dayEndMinute: number;
    hourDuration: number;
  };
  orderRoleIds: string[];
  appointmentBookingRoleIds: string[];
  appointmentBookingShifts: ConfigAppointmentBookingShift[];
  staff: {
    id: string;
    roleAct: {
      [roleId: string]: IRoleAct;
    };
    orderViewColumns: string[];
    shift: {
      currentAmount: number;
    };
    branchIds: string[];
    branches: {
      id: string;
      name: string;
      permission: string;
      role: string;
    }[];
  };
}
export interface Staff {
  [name: string]: any;
}
export interface Tag {
  bgColor: string;
  name: string;
  icon: string;
  txtColor: string;
  id: string;
  bizId: string;
  desc: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface SaleReason {
  [name: string]: any;
  name: string;
  distanceTime: any;
  isSchedule: any;
}
export interface Order {
  [name: string]: any;
}
export interface Status {
  [name: string]: any;
}
export interface Source {
  [name: string]: any;
  platform: string;
  id: string;
  picture: string;
  name: string;
}

export interface ISidebar {
  link: string;
  name: string;
  icon?: string;
  iconActive?: string;
  isActive: boolean;
  children?: ISidebar[];
  disabled?: boolean;
}

export enum EModule {
  TABLE = 'table',
  CONFIG = 'config',
  SETTING = 'setting',
}

export enum EFlowTab {
  RULE = 'rule',
  DATA = 'data',
}

export enum ESettingTab {
  PERMISSION = 'permission',
  NON = 'non',
}

export type ITypePaginate = 'number' | 'lazy';
export type IChangePage = 'before' | 'after';

export interface IMetaData {
  total?: number;
  totalPage?: number;
  countRows?: number;
  currentPage?: number;
  limit?: number;
}

export interface AccountPublic {
  id: string;
  name: string;
  email: string;
  role: string;
  roleIds: string[];
  isActive: boolean;
  picture: string;
  createdAt: string;
  isFollowReport?: boolean;
}
