import {
  AccountPublic,
  BaseInterface,
  ESocialPlatform,
  User,
} from '@app/types/viewmodels';
import {IBranchTaskDto, ITaskCartDto} from '@app/types/flow';

export enum EDataSourceType {
  MANUAL = 'MANUAL',
  API = 'API',
}

export enum EDistributeType {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
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
  TAGS = 'tags',
  TEAMS = 'teams',
  ADD_CHAIN_ACT_IDS = 'addChainActIds',
  PRODUCT_NAME = 'product.name',
  BRANCH = 'branch',
  FB_AD_ID = 'fbAdId',
  UTM_CAMPAIGN = 'utmCampaign',
  UTM_SOURCE = 'utmSource',
  UTM_MEDIUM = 'utmMedium',
  UTM_TERM = 'utmTerm',
  UTM_CONTENT = 'utmContent',
}
export interface ISourceArgsDto {
  argKey: ESourceArgKey;
  argRef: string;
}

export interface ISourceDTaskTeam {
  roleId: string;
  roleIcon: string;
  roleName: string;
  userId: string;
  userName: string;
  userPicture: string;
  userEmail: string;
}

export interface ISourceDTask {
  branch: IBranchTaskDto;
  teams: ISourceDTaskTeam[];
  taskChainIds: string[];
  distributionType: string | 'MANUAL' | 'AUTO';
  priority: number;
  taskDistributionConfigId: string;
}

export interface ISource {
  id: string;
  name: string;
  picture: string;
  platform: ESocialPlatform;
  platformId: string;
  type: EDataSourceType;
  dTask: ISourceDTask;
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
  isChangeTab?: boolean;
  isActive?: boolean;
  hasChanged?: boolean;
  isEdit?: boolean;
  type?: string | 'all' | 'personal' | 'position';
  ownerId?: string;
  allowedUserIds?: string[];
  posIds?: string[];
  roleIds?: string[];
  quantity?: number;
  isRename?: boolean;
  isEditView?: boolean;
  pos?: number;
  tabViewModeBorderColor?: string;
}

export interface IView {
  id?: string;
  name: string;
  screen: EScreens;
  ownerId: string;
  bizId: string;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  options?: any;
  type?: string | 'all' | 'personal' | 'position';
  allowedUserIds?: string[];
  posIds?: string[];
  roleIds?: string[];
  isDefault?: boolean;
  isEdit?: boolean;
  isActive?: boolean;
  isEditView?: boolean;
  tabViewModeBorderColor?: string;
}

export interface ISetting {
  roles: string[];
  assignRole: string;
  bizId: string;
  updatedBy: AccountPublic;
  taskExportFields?: string[];
  workHourEnable?: boolean;
  workHourType?: string | 'fixed_daily';
  workHours?: {
    start: string;
    end: string;
  }[];
  drawAndDropConfig?: {
    roles: string[]; // Vai trò được phép rút & thả số, ví dụ: ["Telesale", "Chăm sóc khách hàng"]
    drawConfig: {
      maxOpenTasks?: number; // Số tác vụ đang mở tối đa trước khi bị chặn rút số
    };
    dropConfig: {
      transferToBranch?: string; // Chi nhánh được chuyển tới sau khi thả số, ví dụ: "Toshiko Tổng"
      assignTags?: string[]; // Tag được gán sau khi thả số, ví dụ: "Tự do"
    };
    isEnabled?: boolean; // Bật/tắt tính năng cấu hình rút & thả số
  };
  viewDropConfig?: boolean;
  viewDrawConfig?: boolean;
}

export interface IViewDto
  extends Pick<
    IView,
    | 'screen'
    | 'options'
    | 'type'
    | 'allowedUserIds'
    | 'posIds'
    | 'roleIds'
    | 'isDefault'
    | 'isEdit'
    | 'isActive'
    | 'name'
    | 'tabViewModeBorderColor'
  > {}

export enum ETabPermissions {
  EMPLOYEE = 'EMPLOYEE',
  PERMISSION = 'PERMISSION',
}

export enum ETabUpdatePermissionsModal {
  INFORMATION = 'information',
  EMPLOYEE = 'employees',
}

export enum EPerActTask {
  VIEW_TASK = 'VIEW_TASK',
  VIEW_TASK_SAME_LEVEL = 'VIEW_TASK_SAME_LEVEL',
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  VIEW_HISTORY_TASK = 'VIEW_HISTORY_TASK',
  CREATE_ORDER = 'CREATE_ORDER',
  MANAGE_CHAIN = 'MANAGE_CHAIN',
  EDIT_TIME_ACTION = 'EDIT_TIME_ACTION',
  SPLIT_TEAM_TASK = 'SPLIT_TEAM_TASK',
  REMOVE_TEAM_TASK = 'REMOVE_TEAM_TASK',
  DELETE_MULTI_TASK = 'DELETE_MULTI_TASK',
}

export enum EPerActFlow {
  VIEW_FLOW = 'VIEW_FLOW',
  UPDATE_FLOW = 'UPDATE_FLOW',
}

export enum EPerActSetting {
  VIEW_MASTER_DATA = 'VIEW_MASTER_DATA',
  UPDATE_SOURCE_SETTING = 'UPDATE_SOURCE_SETTING',
  UPDATE_TAG_SETTING = 'UPDATE_TAG_SETTING',
  UPDATE_ROLE_SETTING = 'UPDATE_ROLE_SETTING',

  MANAGE_TASK_DISTRIBUTION_CONFIG = 'MANAGE_TASK_DISTRIBUTION_CONFIG',
  VIEW_TASK_DISTRIBUTION_CONFIG = 'VIEW_TASK_DISTRIBUTION_CONFIG',
  CREATE_TASK_DISTRIBUTION_CONFIG = 'CREATE_TASK_DISTRIBUTION_CONFIG',
  UPDATE_TASK_DISTRIBUTION_CONFIG = 'UPDATE_TASK_DISTRIBUTION_CONFIG',
  DELETE_TASK_DISTRIBUTION_CONFIG = 'DELETE_TASK_DISTRIBUTION_CONFIG',

  VIEW_PERMISSION_SETTING_ACCESS = 'VIEW_PERMISSION_SETTING_ACCESS',
  UPDATE_PERMISSION_SETTING_ACCESS = 'UPDATE_PERMISSION_SETTING_ACCESS',

  VIEW_USER_ACCESS_SAME_LEVEL = 'VIEW_USER_ACCESS_SAME_LEVEL',
  UPDATE_USER_ACCESS = 'UPDATE_USER_ACCESS',
}

export enum EPerActType {
  TASK = 'task',
  FLOW = 'flow',
  SETTING = 'setting',
}

export interface IPermissionItem {
  key: EPerActSetting | EPerActFlow | EPerActTask;
  name: string;
  isRootPer?: boolean;
  tooltip?: string;
  dependsOnPer?: EPerActTask | EPerActFlow | EPerActSetting;
  class?: string;
}

export interface IPermissionGroups {
  name: string;
  key: EPerActType;
  isOpen: boolean;
  groups?: {name: string; permissions: IPermissionItem[]}[];
  permissions?: IPermissionItem[];
  class?: string;
}

export interface PermissionAction {
  [EPerActType.TASK]: EPerActTask[];
  [EPerActType.FLOW]: EPerActFlow[];
  [EPerActType.SETTING]: EPerActSetting[];
}

export enum EPermDefault {
  MEMBER_PERMISSION = 'MEMBER_PERMISSION',
  OWNER_PERMISSION = 'OWNER_PERMISSION',
}

export interface Permission extends BaseInterface {
  name: string;
  description: string;
  isActive: boolean;
  permissionAction: PermissionAction;
  userAclCount?: number;
  userAcls?: UserAcl[];
  permDefault?: EPermDefault;
}

export interface PermissionDto
  extends Pick<
    Permission,
    'name' | 'description' | 'isActive' | 'permissionAction'
  > {}

export interface UpdatePermissionDto extends PermissionDto {}

export enum EBatchActionEmployeePer {
  REMOVE = 'REMOVE',
}

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
  stopReceiveTaskDuration?: string | number
  nextReceiveTaskDate?: Date
}

export interface UpdateUserAclDto extends UserAcl {}

export interface BulkRemoveUserAcl {
  permissionId: string;
  userIds: string[];
}

export interface CombinedUserAcl extends User {
  isActiveAcl: boolean;
  aclBranches: UserAclBranch[];
  isUpserting?: boolean;
}

export enum ELevelPer {
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM',
}

export interface SeparateTaskPer {
  id: string;
  permission: EPerActTask[];
  type: ELevelPer;
}

export interface UserPerAccess extends PermissionAction {
  roleBranch?: {
    [name: string]: string[];
  };
}
