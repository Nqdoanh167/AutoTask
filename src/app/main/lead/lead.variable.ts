import {ELeadBulkAction, ELeadStatusType} from '@app/types/lead';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {IColumns} from '@app/types/viewmodels';

// Lead config filters
export const LEAD_CONFIG_FILTERS: IFilterTopTable[] = [
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
    value: [],
  },
  // {
  //   type: ETypeFilter.SELECT,
  //   name: 'statusId_in',
  //   placeholder: 'Trạng thái Leads',
  //   options: [],
  //   bindLabel: 'name',
  //   bindValue: 'id',
  //   clearable: true,
  //   searchable: false,
  //   multiple: true,
  //   minWidth: '200px',
  // },
  {
    type: ETypeFilter.DATE,
    name: 'createdAt',
    placeholder: 'Ngày tạo',
    subType: 'range',
    clearable: true,
    value: [],
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
    value: [],
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
    icon: './assets/images/icon-plus-bold.svg',
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
  [
    'name',
    'phone',
    'email',
    'status',
    'taskIds',
    'createdAt',
    'createdBy',
  ].includes(col.value),
);

export const LEAD_MULTIPLE_ACTIONS = [
  {
    label: 'Xóa hàng loạt Lead',
    value: ELeadBulkAction.DELETE_MULTI,
  },
  // {
  //   label: 'Cập nhật trạng thái',
  //   value: ELeadBulkAction.UPDATE_STATUS,
  // },
  // {
  //   label: 'Thêm tags',
  //   value: ELeadBulkAction.ADD_TAGS,
  // },
  // {
  //   label: 'Xóa tags',
  //   value: ELeadBulkAction.REMOVE_TAGS,
  // },
];

export const LEAD_STATUS_TYPE_LABELS: Record<ELeadStatusType, string> = {
  [ELeadStatusType.NOT_CONTACTED]: 'Chưa liên hệ',
  [ELeadStatusType.CONTACTED]: 'Đã liên hệ',
  [ELeadStatusType.PENDING]: 'Chờ',
  [ELeadStatusType.NEGOTIATING]: 'Thương lượng',
  [ELeadStatusType.WON]: 'Thành công',
  [ELeadStatusType.LOST]: 'Thất bại',
};

export const LEAD_STATUS_TYPE_OPTIONS = [
  {
    value: ELeadStatusType.NOT_CONTACTED,
    label: 'Chưa liên hệ',
  },
  {
    value: ELeadStatusType.CONTACTED,
    label: 'Đã liên hệ',
  },
  {
    value: ELeadStatusType.PENDING,
    label: 'Chờ',
  },
  {
    value: ELeadStatusType.NEGOTIATING,
    label: 'Thương lượng',
  },
  {
    value: ELeadStatusType.WON,
    label: 'Thành công',
  },
];

// type lead
export const TYPE_LEAD_OPTIONS = [
  {key: 'LEAD', name: 'Lead', icon: 'lead'},
  {key: 'QUALIFIED', name: 'Qualified Lead', icon: 'qualified-lead'},
  {key: 'OPPORTUNITY', name: 'Opportunity', icon: 'opportunity-lead'},
  {key: 'WON', name: 'Closed Won', icon: 'closed-won-lead'},
  {key: 'LOST', name: 'Closed Lost', icon: 'closed-lost-lead'},
];
