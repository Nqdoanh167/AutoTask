export enum ETypeFilter {
  SEARCH = 'search',
  POPOVER = 'popover',
  SELECT = 'select',
  DATE = 'date',
  ACTION_RESULT='actionResult'
}
export enum ETypeBulkUpdate {
  REMOVE_TEAM = 'REMOVE_TEAM',
  ASSIGN_TEAM = 'ASSIGN_TEAM',
  DELETE_MULTI_TASK = 'DELETE_MULTI_TASK',
  CLOSE_MULTI_TASK = 'CLOSE_MULTI_TASK',
  CLONE_MULTI_TASK = 'CLONE_MULTI_TASK',
}
export enum EBotherAdvanceBasicFilter {
  BASIC = 'basic',
  ADVANCE = 'advance',
}
export enum ETypeButton {
  PRIMARY = 'primary',
  DEFAULT = 'default',
  TOGGLE = 'toggle',
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
  allowedExtraValues?: any[]; // Bên cạnh các giá trị trong options thì query filter có thể được truyền thêm các giá trị trong mảng này
  minWidth?: string;
  clearable?: boolean;
  subType?: any;
  onSearch?: (event: any) => void;
  value?: string | string[] | any;
  loading?: boolean;
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
  value?: any;
  hidden?: boolean;
  tooltip?: string;
  isActive?: boolean;
  children?: IFilterTopButton[];
}

export interface ITabFilter {
  id: number;
  title: string;
  active?: boolean;
  isEdit?: boolean;
  hasChange?: boolean;
}

export type TKeyViewModeTab = 'dashboardTask';
