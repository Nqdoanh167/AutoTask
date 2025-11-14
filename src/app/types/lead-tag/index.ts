export interface ILeadTag {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  bgColor?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadTagCreateDto {
  name: string;
  description?: string;
  isActive?: boolean;
  bgColor?: string;
  color?: string;
  icon?: string;
}

export interface ILeadTagUpdateDto extends Partial<ILeadTagCreateDto> {
  id: string;
}

export interface ILeadTagQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  filter?: string;
}
