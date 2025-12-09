import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
  EBotherAdvanceBasicFilter,
} from '@app/types/common';
import { IColumns } from '@app/types/viewmodels';

// Lead config filters
export const LEAD_CONFIG_FILTERS: IFilterTopTable[] = [
  {
    type: ETypeFilter.SEARCH,
    name: 'search',
    placeholder: 'Tìm kiếm tên, SĐT',
    value: '',
  },
  {
    type: ETypeFilter.SELECT,
    name: 'tagIds_in',
    placeholder: 'Tags',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: true,
    searchable: true,
    multiple: true,
    minWidth: '200px',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'statusId_in',
    placeholder: 'Trạng thái Leads',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: true,
    searchable: false,
    multiple: true,
    minWidth: '200px',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.POPOVER,
    name: 'sort',
    placeholder: 'Sắp xếp',
    options: [
      {
        label: 'Ngày tạo: Mới -> Cũ',
        value: '-createdAt',
      },
      {
        label: 'Ngày tạo: Cũ -> Mới',
        value: 'createdAt',
      },
      // {
      //   label: 'Ngày cập nhật: Mới -> Cũ',
      //   value: '-updatedAt',
      // },
      // {
      //   label: 'Ngày cập nhật: Cũ -> Mới',
      //   value: 'updatedAt',
      // },
      // {
      //   label: 'Tổng tiền: Cao -> Thấp',
      //   value: '-totalPrice',
      // },
      // {
      //   label: 'Tổng tiền: Thấp -> Cao',
      //   value: 'totalPrice',
      // },
    ],
    bindLabel: 'label',
    bindValue: 'value',
    clearable: true,
    value: '-createdAt',
  },
  {
    type: ETypeFilter.DATE,
    name: 'createdAt',
    placeholder: 'Ngày tạo',
    subType: 'range',
    clearable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'createdBy.id_in',
    placeholder: 'Người tạo',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: true,
    searchable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
];

// Lead config buttons
export const LEAD_CONFIG_BUTTON: IFilterTopButton[] = [
  {
    name: 'orderableTable',
    type: ETypeButton.DEFAULT,
    icon: './assets/images/icon/table.svg',
    tooltip: 'Tùy chỉnh bảng',
    tooltipPlacement: 'bottom',
  },
  {
    name: 'sortLeadStatus',
    type: ETypeButton.DEFAULT,
    icon: './assets/images/icon/dragDrop.svg',
    tooltip: 'Sắp xếp vị trí trạng thái lead',
    tooltipPlacement: 'bottom',
  },
  {
    name: 'reload',
    type: ETypeButton.DEFAULT,
    icon: './assets/images/icon/reload.svg',
    tooltip: 'Tải lại trang',
    tooltipPlacement: 'bottom',
  },
  {
    name: 'add_new',
    type: ETypeButton.PRIMARY,
    label: 'Thêm Leads',
    icon: './assets/images/icon/plus.svg',
    tooltip: 'Thêm mới lead',
    tooltipPlacement: 'bottom',
  },
];

// Lead table columns
export const LEAD_COLUMNS: IColumns[] = [
  {
    name: 'Tên',
    value: 'name',
    fieldSort: 'name',
    tooltip: 'Tên khách hàng',
  },
  {
    name: 'Số điện thoại',
    value: 'phone',
    tooltip: 'Số điện thoại',
  },
  {
    name: 'Email',
    value: 'email',
    tooltip: 'Email',
  },
  {
    name: 'Trạng thái Leads',
    value: 'status',
    tooltip: 'Trạng thái hiện tại của lead',
  },
  {
    name: 'Tác vụ',
    value: 'taskIds',
    tooltip: 'Tác vụ liên quan',
  },
  {
    name: 'Ngày tạo',
    value: 'createdAt',
    fieldSort: 'createdAt',
    tooltip: 'Ngày tạo',
  },
  {
    name: 'Người tạo',
    value: 'createdBy',
    tooltip: 'Người tạo',
  },
];

// Default visible columns
export const LEAD_COLUMNS_DEFAULT: IColumns[] = LEAD_COLUMNS.filter((col) =>
  ['name', 'phone', 'email', 'status', 'taskIds', 'createdAt', 'createdBy'].includes(col.value)
);

// Multiple actions for leads
export enum ELeadBulkAction {
  MOVE_TO_FUNNEL = 'MOVE_TO_FUNNEL',
  DELETE_MULTI = 'DELETE_MULTI',
  UPDATE_STATUS = 'UPDATE_STATUS',
  ADD_TAGS = 'ADD_TAGS',
  REMOVE_TAGS = 'REMOVE_TAGS',
}

export const LEAD_MULTIPLE_ACTIONS = [
  {
    label: 'Di chuyển hàng loạt Lead',
    value: ELeadBulkAction.MOVE_TO_FUNNEL,
  },
  {
    label: 'Xóa hàng loạt Lead',
    value: ELeadBulkAction.DELETE_MULTI,
  },
  {
    label: 'Cập nhật trạng thái',
    value: ELeadBulkAction.UPDATE_STATUS,
  },
  {
    label: 'Thêm tags',
    value: ELeadBulkAction.ADD_TAGS,
  },
  {
    label: 'Xóa tags',
    value: ELeadBulkAction.REMOVE_TAGS,
  },
];
