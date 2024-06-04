import {AccountPublic} from '@app/types/viewmodels';
import {ITaskCartDto} from '@app/types/flow';

export enum EDataSourceType {
  MANUAL = 'MANUAL',
  API = 'API',
}

export enum ESourceArgKey {
  NAME = 'name',
  PICTURE = 'picture',
  PHONE = 'phone',
  EMAIL = 'email',
  ADDRESS = 'address',
  STREET = 'street',
  WARD_CODE = 'wardCode',
  DISTRICT_CODE = 'districtCode',
  PROVINCE_CODE = 'provinceCode',
  COUNSELOR_ID = 'counselorId',
  ADD_CHAIN_ACT_IDS = 'addChainActIds',
  PRODUCT_NAME = 'product.name',
  PRODUCT_ID = 'product.id',
}

export interface ISourceArgsDto {
  argKey: ESourceArgKey;
  argRef: string;
}

export interface ISource {
  id: string;
  name: string;
  type: EDataSourceType;
  isActive: boolean;
  exeCount: number;
  counselor: AccountPublic;
  arguments: ISourceArgsDto[];
  cart: ITaskCartDto;
  token: string;
  apiEndpoint: string;
  apiHeaders: any;
  apiBody: any;
  bizId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
}

export interface ISourceDto {
  name: string;
  type: EDataSourceType;
  isActive: boolean;
  parameters: any[];
  counselorId: string;
  products: any;
}

export interface IUpdateSourceDto {
  name: string;
  type: EDataSourceType;
  isActive: boolean;
  arguments: ISourceArgsDto[];
  counselorId: string;
  cart: ITaskCartDto;
}

export enum EScreens {
  DASHBOARD = 'dashboard',
}

export interface IViewModeDto {
  id?: string;
  name?: string;
  options?: any;
  isDefault?: boolean;
  isActive?: boolean;
  hasChanged?: boolean;
  isEdit?: boolean;
}

export interface IView {
  screen: EScreens;
  ownerId: string;
  modes: IViewModeDto[];
  bizId: string;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
}

export interface ISetting {
  roles: string[];
  assignRole: string;
  bizId: string;
  updatedBy: AccountPublic;
}

export interface IViewDto extends Pick<IView, 'screen' | 'modes'> {}

export enum ETabPermissions {
  EMPLOYEE = 'EMPLOYEE',
  ROLE = 'ROLE',
}
