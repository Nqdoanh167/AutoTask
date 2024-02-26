export enum ETypeFilter {
  SEARCH = 'search',
  SELECT = 'select',
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
  isCreatable?: boolean;
  className?: string;
  minWidth?: string;
  clearable?: boolean;
  onSearch?: (event: any) => void;
  value?: string | string[];
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
