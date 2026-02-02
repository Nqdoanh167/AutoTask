import {Customer} from '../customer';
import {AccountPublic, ITag, Order, OrderPlatformSource} from '../viewmodels';
import {ITeam, IBranchTaskDto} from '../flow';
import {ITask} from '@app/main/lead/lead-dashboard/lead-form-modal/lead-form-modal.interface';

export enum EGenderType {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum ELeadCommentContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
}

export interface ILead {
  id: string;
  name: string;
  platformSourceIds?: string[]; // Danh sách id nguồn dữ liệu
  platformSources?: OrderPlatformSource[]; // Danh sách nguồn dữ liệu
  statusId?: string;
  tags?: ITag[]; // Populated tag objects (for display)
  tagIds?: string[]; // Tag IDs (matches backend response)
  taskIds: string[];
  taskCodes: string[];
  orderId?: string[];
  orderCodes: string[];
  orders?: Order[];
  customer?: Customer;
  createdBy?: AccountPublic;
  updatedBy?: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
  funnelId?: string;
  teams?: ITeam[]; // Danh sách nhân sự phụ trách theo vai trò
  tasks?: ITask[]; // Danh sách các task
  branch?: IBranchTaskDto; // Chi nhánh / phòng ban / đội nhóm
  statusGroupFlow?: {
    statusId: string;
    statusName: string;
  }[];
}

export interface ILeadComment {
  id: string;
  leadId: string;
  content?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  contentType: ELeadCommentContentType;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadCommentCreateDto {
  leadId: string;
  content?: string;
  contentType: ELeadCommentContentType;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface IFolderLead {
  id?: string;
  bizId: string;
  name: string;
  level: number;
  funnelGroups: IFunnelGroup[];
  statusGroupId: string;
}

export interface IFunnelGroup {
  id?: string;
  name: string;
  funnels: IFunnel[];
  statusGroupId: string;
}

export interface IFunnel {
  id?: string;
  name: string;
  pos: number;
  leadCount: number;
  statusId: string;
  status: ILeadStatus;
  statLeadCount: number;
  createdAt: Date;
  updatedAt: Date;
  statusGroupId: string;
}

export interface ILeadStatus {
  id: string;
  name: string;
  isActive: boolean;
  type: ELeadStatusType;
  description?: string;
  bgColor?: string; // For UI display
  createdAt: Date;
  updatedAt: Date;
  pos: number;
  isDefault?: boolean;
}

export interface ILeadStatusGroup {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  leadStatusIds: string[];
}

export enum ELeadType {
  LEAD = 'LEAD', // Lead mới
  QUALIFIED = 'QUALIFIED', // Lead đã được qualify
  OPPORTUNITY = 'OPPORTUNITY', // Cơ hội bán hàng
  WON = 'WON', // Thắng deal
  LOST = 'LOST', // Thua deal
}

export enum ELeadStatusType {
  NOT_CONTACTED = 'NOT_CONTACTED', // - Chưa liên hệ
  CONTACTED = 'CONTACTED', // Đã liên hệ
  PENDING = 'PENDING', // Chờ
  NEGOTIATING = 'NEGOTIATING', // Thương lượng
  WON = 'WON', // Thành công
  LOST = 'LOST', // Thất bại
}

// Multiple actions for leads
export enum ELeadBulkAction {
  MOVE_TO_FUNNEL = 'MOVE_TO_FUNNEL',
  DELETE_MULTI = 'DELETE_MULTI',
  UPDATE_STATUS = 'UPDATE_STATUS',
  ADD_TAGS = 'ADD_TAGS',
  REMOVE_TAGS = 'REMOVE_TAGS',
}

export enum ETabDetail {
  DISCUSS = 'discuss',
  TASK = 'task',
  ATTRIBUTE = 'attribute',
  PRODUCT = 'product',
  PACKAGE = 'package',
}

export interface ILeadCreateBulk {
  leads: Array<{
    name: string;
    phone: string;
    email?: string;
    note?: string;
    sourceId?: string | null;
    tagIds?: string[];
  }>;
  funnelId: string;
}
