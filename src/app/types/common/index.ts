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
  clearable?: boolean;
}

export interface IFilterTopButton {
  className?: string;
  name?: string;
  type?: ETypeButton;
  label?: string;
  icon?: string;
}
