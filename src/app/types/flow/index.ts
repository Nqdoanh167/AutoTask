import {
  AccountPublic,
  BeautyService,
  Combo,
  CourseEvent,
  ITag,
  Order,
  PrepaidCard,
  Product,
} from '@app/types/viewmodels';
import {ELevelPer} from '@app/types/setting';
import {Customer} from '@app/types/customer';

export enum ETabConfigData {
  ACTION = 'action',
  CHAIN_ACTION = 'chain_action',
  RESULT = 'result',
  REASON = 'reason',
}

export enum EActionType {
  CALL = 'CALL',
  SEND_BLOCK_AUTOMATION = 'SEND_BLOCK_AUTOMATION',
  FEEDBACK = 'FEEDBACK',
  MANUAL_CREATE_ORDER = 'MANUAL_CREATE_ORDER',
  OTHER = 'OTHER',
}

export enum ENextStepType {
  CONTINUE_TO_NEXT_ACTION = 'CONTINUE_TO_NEXT_ACTION',
  CREATE_ORDER = 'CREATE_ORDER',
  CALL_BLOCK_AUTOMATION = 'CALL_BLOCK_AUTOMATION',
  CLOSE_CHAIN = 'CLOSE_CHAIN',
  CLOSE_CHAIN_AND_CLONE_TASK = 'CLOSE_CHAIN_AND_CLONE_TASK',
  ADD_CHAIN = 'ADD_CHAIN',
}

export enum EOptionCloneTask {
  SOURCE = 'SOURCE',
  TEAM = 'TEAM',
  TAG = 'TAG',
  CURRENT_CHAIN = 'CURRENT_CHAIN',
  LEADDEAL = 'LEADDEAL',
  NOTE = 'NOTE',
  PRODUCT = 'PRODUCT',
  BRANCH = 'BRANCH',
}

export enum EResultType {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  UNCOMPLETED = 'UNCOMPLETED',
  SKIP = 'SKIP',
}

export interface IActResult {
  id: string;
  name: string;
  type: EResultType;
  createdBy?: AccountPublic;
  updatedBy?: AccountPublic;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActReason {
  id: string;
  name: string;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAction {
  id: string;
  name: string;
  type: EActionType;
  resultIds: string[];
  reasonIds: string[];
  results?: IActResult[];
  reasons?: IActReason[];
  callBlockAutomation?: {
    blockId?: string;
  };
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
  subActions?: IAction[];
}

export interface IBodyAction {
  name: string;
  type: EActionType;
  resultIds: string[];
  reasonIds: string[];
}

export interface IBodyResultReason {
  name: string;
}

export enum EChainNextActType {
  AUTO = 0,
  MANUAL = 1,
}

export enum EDelayType {
  NOW = 0,
  MINUTE = 1,
  HOUR = 2,
  DAY = 3,
}

export interface IChainNextAction {
  id?: string;
  status?: ETaskChainResultType;
  type?: EChainNextActType;
  delayType?: EDelayType;
  ordering?: number;
  delayValue?: number;
  nextAction?: ENextStepType;
  moveToAction?: {
    chainActResultId: undefined;
    chainActResult?: IChainActResult;
  };
  addNewChain?: {
    chainId?: string;
    chainActResultId?: string;
    chain?: {
      name: string;
      id: string;
    };
    chainActResult?: IChainActResult;
  };
  callBlockAutomation?: {
    blockId?: string;
  };
  closeCloneTask?: string[];
  callToBlockId?: string;
  moveToActionId?: string;
  addNewChainId?: string;
  addNewChainActId?: string;
}

export interface IChainResult {
  ordering?: number;
  resultId?: string;
  result?: IActResult;
  nextActions: IChainNextAction[];
}

export interface IChainActResult {
  id?: string;
  ordering: number;
  chainActId?: string;
  chainAct?: IChainAct;
  actionId?: string;
  action?: IAction;
  results: IChainResult[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: AccountPublic;
  updatedBy?: AccountPublic;
}

export interface IFistActionDelayDto {
  delayType?: EDelayType;
  delayValue?: number;
}

export interface IChainAct {
  id: string;
  name: string;
  isActive: boolean;
  fistActionDelay: IFistActionDelayDto;
  ordering: number;
  actionResultIds: string[];
  actionResults: IChainActResult[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
}

export interface IChainActRule extends IChainAct {
  isExpand: boolean;
}

export interface IUpdateChainActDto {
  name: string;
  isActive: boolean;
  actionIds: string[];
  fistActionDelay: IFistActionDelayDto;
}

export interface IBodyChainResult {
  ordering?: number;
  resultId: string;
  nextActions: IChainNextAction[];
  fistActionDelay: IFistActionDelayDto;
}

export interface IBodyUpdateOrdering {
  ordering: number;
  id: string;
}

export interface IManyUpdateChainActResultDto {
  results: IBodyChainResult[];
  id: string;
  ordering?: number;
}

export interface IManyUpsertChainActResultDto {
  results: IBodyChainResult[];
  id?: string;
  ordering: number;
  actionId: string;
  chainActId: string;
}

export enum ELeadDeal {
  LEAD = 'LEAD',
  DEAL = 'DEAL',
}

export enum ETypeProduct {
  PRODUCT,
  COURSE,
  SERVICE,
  SIM_CARD,
  COMBO,
}

export interface IProductDto {
  id: string;
  name: string;
  picture: string;
  quantity: number;
  code: number;
  price: number;
  isVirtual?: boolean;
}

export interface ILeadDealDto extends Customer {
  type: ELeadDeal;
}

export enum ETaskChainType {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum ETaskChainResultType {
  ACTIVE = 'ACTIVE',
  BACKGROUND_PROCESSING = 'BACKGROUND_PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export interface ReasonEditedDate {
  editedDate: Date;
  deadDate: Date;
  newDate: Date;
  reason: string;
  editedBy: AccountPublic;
}

export interface ITaskChainResult {
  id?: string;
  status: ETaskChainResultType;
  action: IAction;
  deadlineDate: Date;
  executedDate: Date;
  result: IActResult;
  resultIndex: number;
  reason: IActReason;
  reasonIndex: number;
  executeAction: any;
  nextActionIds: string[];
  nextActions: ITaskChainResult[];
  note: string;
  reasonEditedDate: ReasonEditedDate[];
  backgroundProcessingActions: any;
  results: IChainResult[];
  childNextAction: IChainNextAction;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
  order?: {
    id: string;
    code: string;
  };
  feedback?: {
    id: string;
    rate: string;
    comment: string;
  };
}

export interface ITaskChain {
  id: string;
  status: ETaskChainType;
  name: string;
  taskId: string;
  task: ITask;
  chainActId: string;
  chainActionResults: IChainActResult[];
  taskChainResults: ITaskChainResult[];
  currentChainResultIndex: number;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskCartDto {
  products: Product[];
  beautyServices: BeautyService[];
  combos: Combo[];
  warehouse: string;
  prepaidCards: PrepaidCard[];
  courseEvents: CourseEvent[];
}
export interface ITeam {
  roleId: string;
  roleIcon: string;
  roleName: string;
  userId: string;
  userName: string;
  userPicture: string;
  userEmail: string;
}
export interface ITask {
  checked?: boolean;
  id: string;
  code?: string;
  name: string;
  note: string;
  leadDeal?: ILeadDealDto;
  tags?: ITag[];
  cart: ITaskCartDto;
  orderIds: string[];
  orders: Pick<Order, 'code' | 'id'>[];
  counselor: AccountPublic;
  taskChainIds: string[];
  taskChains: ITaskChain[];
  teams?: ITeam[];
  chatLink?: string;
  branch: IBranchTaskDto;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBranchTaskDto {
  unit: ELevelPer;
  name: string;
  id: string;
  department: string;
  departmentName: string;
  team: string;
  teamName: string;
}

export interface ITaskDto {
  name: string;
  branch: IBranchTaskDto;
  leadDeal: ILeadDealDto;
  products: IProductDto[];
  counselorId: string;
  addChainActIds?: string[];
}
export interface CloneTaskDto {
  options: string[];
}
export interface IBulkTaskDto {
  taskIds: string[];
  teams: ITeam[];
}

export interface IAddTaskChainDto {
  addChainActIds: string[];
  removeTaskChainIds?: string[];
}

export interface IPickResultForActionDto {
  resultIndex: number;
  reasonIndex?: number;
  note: string;
}

export interface IUpdateTaskResultDto {
  deadlineDate?: Date;
  note?: string;
  resultIndex: number;
  reasonIndex?: number;
  nextActions?: IChainNextAction[];
}

export interface IUpdateDeadlineTaskResult
  extends Pick<IUpdateTaskResultDto, 'note' | 'deadlineDate'> {}

export enum EStatusTaskChainResult {
  DONE = 'DONE',
  UNDONE = 'UNDONE',
}

export enum EActionStates {
  OVERDUE = 'OVERDUE',
  DUE_SOON = 'DUE_SOON',
  EXECUTED = 'EXECUTED',
  HIDE_FULL_EXECUTED = 'HIDE_FULL_EXECUTED',
}

export enum EEditedDateState {
  HAS_EDITED = 'HAS_EDITED',
  NOT_EDITED = 'NOT_EDITED',
}

export interface ModifiedUserUnit {
  key: string;
  label: string;
  data: string;
  id: string | null;
  name: string | null;
  department: null | string;
  departmentName: null | string;
  team: null | string;
  teamName: null | string;
  children?: ModifiedUserUnit[];
}
