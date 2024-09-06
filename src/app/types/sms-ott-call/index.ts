import {AccountPublic, BaseInterface} from '@app/types/viewmodels';

export interface Platform {
  id: string;
  author: string;
  updatedBy: {
    id: string;
    name: string;
    picture: string;
    email: string;
  };
  bizId: string;
  name: string;
  platformType: string;
  platform: EVoicePlatform;
  stringee?: {
    key: string;
    secret: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManageMappingPhone extends BaseInterface {
  platformId: string;
  hotline: string;
  sip: number;
  counselor: any;
  userIds: string;
  isActive: boolean;
  platform: Platform;
}

export enum EVoicePlatform {
  STRINGEE = 'stringee',
  VFONE = 'vfone',
  OMICALL = 'omicall',
  PORTSIP = 'portsip',
  ESMS = 'esms',
  ZNS = 'zns',
  SMAX_SMS = 'smax_sms',
  SMAX_ZNS = 'smax_zns',
  SMAX_PORTSIP = 'smax_portsip',
}

export enum EVoicePlatformType {
  VOICE = 'voice',
  SMS = 'sms',
  SMAX_AGENCY = 'smax_agency',
}

export interface StringeeReceiveCallEvent {
  answeredOnAnotherDevice: boolean;
  audioDeviceId: any;
  callId: string;
  client: any;
  custom: any;
  ended: boolean;
  fromAlias: string;
  fromInternal: boolean;
  fromNumber: string;
  isAnswered: boolean;
  isIncomingCall: boolean;
  isOnHold: boolean;
  isVideoCall: boolean;
  localVideoEnabled: boolean;
  microphones: any[];
  muted: boolean;
  reasonEndall: string;
  speakers: any[];
  toAlias: string;
  toNumber: string;
  toType: string;
  videoDeviceId: any;
  videoResolution: any;
}

export interface OutGoingCallEvent {
  callId: string;
  customDataFromYourSever: string;
  fromNumber: string;
  toNumber: string;
  toType: 'external';
  peerToPeerCall: boolean;
  message: string;
  r: EStringeeErrorCode;
}

// https://developer.stringee.com/docs/call-error-code

export enum EStringeeErrorCode {
  NOT_INIT = -1,
  SUCCESS = 0,
  ANSWER_URL_EMPTY = 1,
  ANSWER_URL_SCCO_INCORRECT_FORMAT = 2,
  TO_TYPE_IS_NOT_INTERNAL_OR_EXTERNAL = 3,
  FROM_NUMBER_NOT_FOUND = 4,
  FROM_NUMBER_NOT_BELONG_YOUR_ACCOUNT = 5,
  SIP_TRUNK_NOT_FOUND = 6,
  SIP_TRUNK_NOT_BELONG_YOUR_ACCOUNT = 7,
  NOT_ENOUGH_MONEY = 8,
  UNKNOW_ERROR_1 = 9,
  FROM_NUMBER_OR_TO_NUMBER_INVALID_FORMAT = 10,
  CALL_NOT_ALLOWED_BY_YOUR_SERVER = 11,
  MAX_CONCURRENT_CALL = 12,
  WAIT_TEXT_TO_SPEECH = 13,
  TO_NUMBER_INVALID = 14,
  FROM_NUMBER_NOT_BELONG_YOUR_PROJECT = 15,
  NOT_ALLOW_CHAT_USER = 16,
  NOT_ALLOW_CALLOUT = 17,
  REQUEST_ANSWER_URL_ERROR = 18,
  ACCOUNT_LOCKED = 19,
  CREATE_PEER_CONNECTION_ERROR = 1001,
  GET_USER_MEDIA_ERROR = 1000,
}

export enum EStatusVoice {
  NONE = 'NONE',
  RINGING = 'RINGING',
  CONNECT = 'CONNECT',
  SUCCESS = 'SUCCESS',
  REJECT = 'REJECT',
  FAIL = 'FAIL',
}

export interface HistoryUpdateDto {
  status: EStatusVoice;
  order?: {
    id?: string | null;
    code?: string | null;
  };
  task?: {
    id?: string | null;
    code?: string | null;
  };
  author: Pick<AccountPublic, 'id' | 'name' | 'email' | 'picture'>;
}
