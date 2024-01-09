import {AccountPublic} from '@app/types/viewmodels';

export enum ETabConfigData {
  ACTION = 'action',
  CHAIN_ACTION = 'chain_action',
  RESULT = 'result',
  REASON = 'reason',
}

export enum EActionType {
  CALL = 0,
  SMS = 1,
  CREATE_CUSTOMER = 2,
  BLOCK_AUTOMATION = 3,
  OTHER = 4,
  CREATE_ORDER = 5,
  CLOSE_CHAIN = 6,
  CHANGE_ACTION = 7,
  ADD_CHAIN = 8,
}

export interface IActResult {
  id: string;
  name: string;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
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
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
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

export enum EDelayTypeChainNextAct {
  NOW = 0,
  MINUTE = 1,
  HOUR = 2,
  DAY = 3,
}

export interface IChainNextAction {
  type: EChainNextActType;
  delayType: EDelayTypeChainNextAct;
  ordering: number;
  delayValue: number;
  actionId: string;
  action: IAction;
}

export interface IChainResult {
  ordering: number;
  resultId: string;
  result: IActResult;
  nextActions: IChainNextAction[];
}

export interface IChainActResult {
  ordering: number;
  chainActId: string;
  actionId: string;
  action?: IAction;
  results: IChainResult[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: AccountPublic;
  updatedBy: AccountPublic;
}

export interface IChainAct {
  id: string;
  name: string;
  isActive: boolean;
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

export interface IBodyChainAct {
  name: string;
  isActive: boolean;
  actionIds: string[];
}
