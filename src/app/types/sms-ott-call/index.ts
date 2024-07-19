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
