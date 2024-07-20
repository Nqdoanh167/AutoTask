import {BaseInterface} from '@app/types/viewmodels';

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
    id: string;
    code: string;
  };
  task?: {
    id: string;
    code: string;
  };
}
