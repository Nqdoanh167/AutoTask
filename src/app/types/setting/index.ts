import {AccountPublic} from '@app/types/viewmodels';

export enum EDataSourceType {
  MANUAL = 'MANUAL',
  API = 'API',
}

export interface ISource {
  id: string;
  name: string;
  type: EDataSourceType;
  isActive: boolean;
  parameters: any[];
  counselor: any;
  products: any;
  token: string;
  apiPath: string;
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
