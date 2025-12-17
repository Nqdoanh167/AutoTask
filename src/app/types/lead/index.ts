import {Customer} from '../customer';
import {ITag, AccountPublic} from '../viewmodels';
import {ILeadStatus} from '../lead-status';
import {ILeadTag, ILeadTag as ILeadTagType} from '../lead-tag';
import {ITeam, IBranchTaskDto} from '../flow';
import {
  ITask,
  IPlatform,
} from '@app/main/lead/lead-dashboard/lead-form-modal/lead-form-modal.interface';

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
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  gender?: EGenderType;
  address?: string;
  street?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtCode?: string;
  province?: string;
  provinceCode?: string;
  platforms?: IPlatform[]; // Danh sách nền tảng và kết nối
  totalPrice?: number;
  status?: ILeadStatus;
  statusId?: string;
  tags?: ILeadTag[]; // Populated tag objects (for display)
  tagIds?: string[]; // Tag IDs (matches backend response)
  taskIds: string[];
  taskCodes: string[];
  orderId?: string[];
  orderCodes: string[];
  customer?: Customer;
  createdBy?: AccountPublic;
  updatedBy?: AccountPublic;
  createdAt: Date;
  updatedAt: Date;
  checked?: boolean;
  picture?: string;
  sourceId?: string;
  funnelId?: string;
  teams?: ITeam[]; // Danh sách nhân sự phụ trách theo vai trò
  tasks?: ITask[]; // Danh sách các task
  branch?: IBranchTaskDto; // Chi nhánh / phòng ban / đội nhóm
}

// Re-export from dedicated type files for external consumers
export type {ILeadStatus};
export type {ILeadTagType as ILeadTag};

export interface ILeadQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  filter?: string;
  after?: string;
}

export interface ILeadCreateDto {
  name: string;
  statusId: string; // Required - MongoDB ID of lead status
  phone: string;
  email?: string;
  gender?: EGenderType;
  address?: string;
  street?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtCode?: string;
  province?: string;
  provinceCode?: string;
  platforms?: IPlatform[]; // Danh sách nền tảng và kết nối
  tagIds?: string[]; // Array of tag IDs (matches backend DTO)
  picture?: string; // Avatar URL
  sourceId?: string; // Nguồn dữ liệu (Data source)
  funnelId?: string; // Phễu
  teams?: ITeam[]; // Danh sách nhân sự phụ trách theo vai trò
  branch?: IBranchTaskDto; // Chi nhánh / phòng ban / đội nhóm
}

export interface ILeadUpdateDto extends Partial<ILeadCreateDto> {
  id: string;
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

export interface ILeadCommentQuery {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
}

export interface IFolderLead {
  id?: string;
  bizId: string;
  name: string;
  level: number;
  funnelGroups: IFunnelGroup[];
}

export interface IFunnelGroup {
  id?: string;
  name: string;
  funnels: IFunnel[];
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
}
