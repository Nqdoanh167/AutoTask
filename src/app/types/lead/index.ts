import { Customer } from '../customer';
import { ITag, AccountPublic } from '../viewmodels';
import { ILeadStatus } from '../lead-status';
import { ILeadTag, ILeadTag as ILeadTagType } from '../lead-tag';
import { ITeam } from '../flow';

export enum EGenderType {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
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
  totalPrice?: number;
  status?: ILeadStatus;
  statusId?: string;
  tags?: ILeadTag[]; // Populated tag objects (for display)
  tagIds?: string[]; // Tag IDs (matches backend response)
  taskId?: string;
  orderId?: string;
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
}

// Re-export from dedicated type files for external consumers
export type { ILeadStatus };
export type { ILeadTagType as ILeadTag };

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
  tagIds?: string[]; // Array of tag IDs (matches backend DTO)
  picture?: string; // Avatar URL
  sourceId?: string; // Nguồn dữ liệu (Data source)
  funnelId?: string; // Phễu
  teams?: ITeam[]; // Danh sách nhân sự phụ trách theo vai trò
}

export interface ILeadUpdateDto extends Partial<ILeadCreateDto> {
  id: string;
}
