import {AccountPublic, BaseInterface} from '@app/types/viewmodels';
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
  PERMISSION = 'PERMISSION',
}

export enum ETabUpdatePermissionsModal {
  INFORMATION = 'INFORMATION',
  EMPLOYEE = 'employees',
}

export enum EPerActTask {
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  VIEW_INFORMATION_TASK = 'VIEW_INFORMATION_TASK',
  VIEW_ORDER_TASK = 'VIEW_ORDER_TASK',
  VIEW_HISTORY_TASK = 'VIEW_HISTORY_TASK',
  CREATE_ORDER = 'CREATE_ORDER',
  MANAGER_CHAIN = 'MANAGER_CHAIN',
  MANGER_ACTION = 'MANGER_ACTION',
  EDIT_TIME_ACTION = 'EDIT_TIME_ACTION',
}

export enum EPerActFlow {
  FLOW = 'FLOW',
  DEFAULT = 'DEFAULT',
}

export enum EPerActSetting {
  SOURCE_SETTING = 'SOURCE_SETTING',
  TAG_SETTING = 'TAG_SETTING',
  ROLE_SETTING = 'ROLE_SETTING',
  PERMISSION_SETTING_ACCESS = 'PERMISSION_SETTING_ACCESS',
  PERMISSION_SETTING_USER_IN_BRANCH = 'PERMISSION_SETTING_USER_IN_BRANCH',
  PERMISSION_SETTING_USER_IN_DEPARTMENT = 'PERMISSION_SETTING_USER_IN_DEPARTMENT',
  PERMISSION_SETTING_USER_IN_TEAM = 'PERMISSION_SETTING_USER_IN_TEAM',
}

export enum EPerActType {
  TASK = 'task',
  FLOW = 'flow',
  SETTING = 'setting',
}

export interface IPermissionGroups {
  name: string;
  key: EPerActType;
  isOpen: boolean;
  permissions: Record<string, string>[];
}

export interface PermissionAction {
  [EPerActType.TASK]: EPerActTask;
  [EPerActType.FLOW]: EPerActFlow;
  [EPerActType.SETTING]: EPerActSetting;
}

export interface Permission extends BaseInterface {
  name: string;
  description: string;
  isActive: boolean;
  permissionAction: PermissionAction;
  userAclCount?: number;
}

export interface PermissionDto
  extends Pick<
    Permission,
    'name' | 'description' | 'isActive' | 'permissionAction'
  > {}

export interface UpdatePermissionDto extends PermissionDto {}

export interface UserAclBaseRole {
  id: string;
  role: string;
  name: string;
  permission: string;
}

export interface UserAclTeam extends UserAclBaseRole {}

export interface UserAclDepartment extends UserAclBaseRole {
  teams: UserAclTeam[];
}

export interface UserAclBranch extends UserAclBaseRole {
  departments: UserAclDepartment[];
}

export interface UserAcl extends Omit<BaseInterface, 'id'> {
  userId: string;
  isActive: boolean;
  branches: UserAclBranch[];
}

export interface UpdateUserAclDto extends UserAcl {}
