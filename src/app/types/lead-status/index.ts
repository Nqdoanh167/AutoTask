export enum ELeadStatusType {
  NEW = 'NEW',
  DOING = 'DOING',
  COMPLETED = 'COMPLETED',
  TRASH = 'TRASH',
  FAIL = 'FAIL',
}

export interface ILeadStatus {
  id: string;
  name: string;
  isActive: boolean;
  type: ELeadStatusType;
  description?: string;
  isDefault: boolean;
  bgColor?: string; // For UI display
  createdAt: Date;
  updatedAt: Date;
  pos: number;
}

export interface ILeadStatusCreateDto {
  name: string;
  isActive?: boolean;
  type?: ELeadStatusType;
  description?: string;
  isDefault?: boolean;
  bgColor?: string;
  pos?: number;
}

export interface ILeadStatusUpdateDto extends Partial<ILeadStatusCreateDto> {
  id: string;
}

export interface ILeadStatusQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  filter?: string;
}

// Display labels for status types
export const LEAD_STATUS_TYPE_LABELS: Record<ELeadStatusType, string> = {
  [ELeadStatusType.NEW]: 'Mới',
  [ELeadStatusType.DOING]: 'Đang liên hệ',
  [ELeadStatusType.COMPLETED]: 'Đã chuyển đổi',
  [ELeadStatusType.TRASH]: 'Lead rác',
  [ELeadStatusType.FAIL]: 'Thất bại',
};
