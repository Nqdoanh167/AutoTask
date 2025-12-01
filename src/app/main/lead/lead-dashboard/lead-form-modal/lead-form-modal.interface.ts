import { EChainNextActionType, ETaskChainType } from "@app/types/flow";

export interface ILeadTeam {
  roleId: string;
  roleIcon: string;
  roleName: string;
  userId: string;
  userName: string;
  userPicture: string;
  userEmail: string;
}

export interface ITaskChainResult {
  id: string;
  action: {
    id: string;
    name: string;
  }
  executedDate?: Date;
  result: {
    id: string;
    name: string;
  }
  reason: null | {
    id: string;
    name: string;
  }
  note: string;
  type: EChainNextActionType;
}

export interface ITaskChain {
  id: string;
  name?: string;
  status: ETaskChainType;
  taskChainResults: ITaskChainResult[];
}

export interface ITask {
  id: string;
  code: string;
  name?: string;
  tags: {
    id: string;
    name: string;
    bgColor: string;
  }[];
  leadId: string;
  taskChains: ITaskChain[];
}

export interface ILeadFormModalSubmitData {
  id?: string;
  name: string;
  phone: string;
  statusId: string;
  email: string;
  gender: string;
  tagIds: string[];
  picture: string;
  sourceId: string;
  funnelId: string;
  address: string;
  street: string;
  province: string;
  provinceCode: string;
  district: string;
  districtCode: string;
  ward: string;
  wardCode: string;
  teams: ILeadTeam[];
}

export interface ILeadFormModalVisibleData extends ILeadFormModalSubmitData {
  tasks: ITask[];
}

export interface IConnection {
  id?: string;
  platformId: string; // ID Nền tảng
  customerId: string; // ID Khách hàng
  customerName?: string; // Tên khách hàng (nếu có)
  isInterested?: boolean; // Quan tâm (cho Zalo OA)
}

export interface IPlatform {
  platform: string; // Platform type: FACEBOOK, ZALO, etc.
  platformName: string; // Platform name: Facebook, Zalo Cá Nhân, Zalo OA, etc.
  platformIcon: string; // Icon URL hoặc class name
  connections: IConnection[];
}
