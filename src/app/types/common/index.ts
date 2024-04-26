export enum ETypeFilter {
  SEARCH = 'search',
  SELECT = 'select',
  DATE = 'date',
}
export enum ETypeBulkUpdate {
  REMOVE_COUNSELOR = 'REMOVE_COUNSELOR',
  ASSIGN_COUNSELOR = 'ASSIGN_COUNSELOR',
}
export enum EBotherAdvanceBasicFilter {
  BASIC = 'basic',
  ADVANCE = 'advance',
}
export enum ETypeButton {
  PRIMARY = 'primary',
  DEFAULT = 'default',
  SUB_PRIMARY = 'sub_primary',
}
export interface IOptionFilterTop {
  [key: string]: any;
}

export interface IFilterTopTable {
  name?: string;
  type: ETypeFilter;
  placeholder?: string;
  options?: IOptionFilterTop[];
  multiple?: boolean;
  searchable?: boolean;
  bindLabel?: string;
  bindValue?: string;
  botherType?: EBotherAdvanceBasicFilter;
  isCreatable?: boolean;
  className?: string;
  minWidth?: string;
  clearable?: boolean;
  subType?: any;
  onSearch?: (event: any) => void;
  value?: string | string[] | any;
}

export type NameButton = 'reload' | 'add_new' | 'save' | string;

export interface IFilterTopButton {
  className?: string;
  name?: NameButton;
  type?: ETypeButton;
  label?: string;
  icon?: string;
  activeIcon?: string;
  loading?: boolean;
  disabled?: boolean;
}

export interface ITabFilter {
  id: number;
  title: string;
  active?: boolean;
  isEdit?: boolean;
  hasChange?: boolean;
}

export type TKeyViewModeTab = 'dashboardTask';
