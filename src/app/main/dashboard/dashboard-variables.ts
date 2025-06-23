import {
  EBotherAdvanceBasicFilter,
  ETypeBulkUpdate,
  ETypeButton,
  ETypeFilter,
} from '@app/types/common';
import {EActionStates, EEditedDateState} from '@app/types/flow';
import {BsCustomDates} from 'ngx-bootstrap/datepicker/themes/bs/bs-custom-dates-view.component';

export enum ESpecialQueryTaskKey {
  BRANCH_IDS = 'branchIds',
}

export const specialQueryTaskKeys = Object.values(ESpecialQueryTaskKey);

export const TASK_MULTIPLE_ACTIONS = [
  // {
  //   label: 'Gán nhân viên phụ trách',
  //   value: ETypeBulkUpdate.ASSIGN_TEAM,
  // },
  {
    label: 'Bỏ nhân viên phụ trách',
    value: ETypeBulkUpdate.REMOVE_TEAM,
  },
];

export const TASK_CONFIG_FILTERS = [
  // {
  //   type: ETypeFilter.SEARCH,
  //   placeholder: 'Tìm kiếm...',
  // },
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
      {
        label: 'Ngày cập nhật: Mới -> Cũ',
        value: '-updatedAt',
      },
      {
        label: 'Ngày cập nhật: Cũ -> Mới',
        value: 'updatedAt',
      },
      {
        label: 'Hành động: Trễ -> Cần thực hiện -> Đã thực hiện',
        value: 'deadlineDate',
      },
      {
        label: 'Hành động: Đã thực hiện -> Cần thực hiện -> Trễ',
        value: '-deadlineDate',
      },
    ],
    bindLabel: 'label',
    bindValue: 'value',
    clearable: true,
    value: 'createdAt',
  },
  {
    type: ETypeFilter.SELECT,
    name: 'actionStates',
    placeholder: 'Trạng thái hành động',
    options: [
      {
        label: 'Hành động đã trễ',
        value: EActionStates.OVERDUE,
      },
      {
        label: 'Hành động hẹn giờ',
        value: EActionStates.DUE_SOON,
      },
      {
        label: 'Hành động hoàn thành',
        value: EActionStates.EXECUTED,
      },
    ],
    bindLabel: 'label',
    bindValue: 'value',
    clearable: true,
    multiple: true,
    minWidth: '200px',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  // {
  //   type: ETypeFilter.SELECT,
  //   name: 'teamRoles',
  //   placeholder: 'Vai trò',
  //   options: [],
  //   bindLabel: 'name',
  //   bindValue: 'id',
  //   clearable: true,
  //   searchable: true,
  //   multiple: true,
  //   botherType: EBotherAdvanceBasicFilter.ADVANCE,
  // },
  // {
  //   type: ETypeFilter.SELECT,
  //   name: 'teamId',
  //   placeholder: 'Nhân sự phụ trách',
  //   options: [],
  //   bindLabel: 'name',
  //   bindValue: 'id',
  //   clearable: false,
  //   searchable: true,
  //   botherType: EBotherAdvanceBasicFilter.ADVANCE,
  // },
  {
    type: ETypeFilter.SELECT,
    name: 'editDateState',
    placeholder: 'Từng chỉnh sửa deadline',
    options: [
      {
        label: 'Đã chỉnh sửa thời gian',
        value: EEditedDateState.HAS_EDITED,
      },
      {
        label: 'Chưa chỉnh sửa thời gian',
        value: EEditedDateState.NOT_EDITED,
      },
    ],
    bindLabel: 'label',
    bindValue: 'value',
    clearable: false,
    multiple: false,
    minWidth: '200px',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  // {
  //   type: ETypeFilter.DATE,
  //   name: 'createdAt',
  //   placeholder: 'Ngày tạo',
  //   subType: 'range',
  //   clearable: true,
  //   botherType: EBotherAdvanceBasicFilter.ADVANCE,
  // },
  {
    type: ETypeFilter.DATE,
    name: 'updatedAt',
    placeholder: 'Ngày cập nhật cuối',
    subType: 'range',
    clearable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'createdBy',
    placeholder: 'Người tạo',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
];

export const TASK_FLOWS_CONFIG_FILTERS = [
  {
    type: ETypeFilter.SELECT,
    name: 'chainActId',
    placeholder: 'Chuỗi hành động',
    options: [
      {
        id: 'NONE',
        name: 'Chưa gán chuỗi',
      },
    ],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: true,
    multiple: false,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'actionIds',
    placeholder: 'Hành động',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: true,
    multiple: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'resultIds',
    placeholder: 'Kết quả',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: true,
    multiple: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SELECT,
    name: 'unassignedRoleId',
    placeholder: 'Tác vụ chưa được gán vai trò',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: false,
    multiple: false,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.ACTION_RESULT,
    name: 'actionResult',
    placeholder: 'Hành động & Kết quả',
    clearable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SEARCH,
    name: 'fbAdId',
    placeholder: 'FB ADs ID',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SEARCH,
    name: 'utmSource',
    placeholder: 'UTM Source',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SEARCH,
    name: 'utmCampaign',
    placeholder: 'UTM Campaign',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.SEARCH,
    name: 'utmMedium',
    placeholder: 'UTM Medium',
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
];

export const TASK_SOURCE_SETTING_CONFIG_FILTERS = [
  {
    type: ETypeFilter.SELECT,
    name: 'sourceIds',
    placeholder: 'Nguồn dữ liệu',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: false,
    searchable: true,
    multiple: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
];

export const TASK_TAG_SETTING_CONFIG_FILTERS = [
  {
    type: ETypeFilter.SELECT,
    name: 'tags',
    placeholder: 'Tag',
    options: [],
    bindLabel: 'name',
    bindValue: 'id',
    clearable: true,
    searchable: true,
    multiple: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
];

export const TASK_CONFIG_BUTTON = [
  {
    name: 'isHideExecute',
    type: ETypeButton.DEFAULT,
    // label: 'Ẩn chuỗi đã đóng',
    // value: true,
    icon: './assets/images/icon/keychain.svg',
    tooltip: 'Ẩn chuỗi đã đóng',
    isActive: false,
  },
  {
    name: 'reload',
    type: ETypeButton.DEFAULT,
    icon: './assets/images/icon/reload.svg',
    tooltip: 'Tải lại trang',
  },
  {
    name: 'add_new',
    type: ETypeButton.PRIMARY,
    label: 'Thêm',
    icon: './assets/images/icon/plus.svg',
    tooltip: 'Thêm mới tác vụ',
    children: [
      {
        name: 'importExcel',
        type: ETypeButton.DEFAULT,
        icon: './assets/images/icon/importExcel.svg',
        tooltip: 'Thêm từ file Excel',
      },
    ],
  },
  {
    name: 'other',
    type: ETypeButton.PRIMARY,
    label: 'Khác',
    // icon: './assets/images/icon/plus.svg',
    tooltip: 'Chức năng khác',
    children: [
      {
        name: 'drawTask',
        type: ETypeButton.DEFAULT,
        icon: './assets/images/icon/draw.svg',
        tooltip: 'Rút số',
        isActive: false,
      },
      {
        name: 'orderableTable',
        type: ETypeButton.DEFAULT,
        icon: './assets/images/icon/table.svg',
        tooltip: 'Tùy chỉnh bảng',
      },
    ],
  },
];

export const ranges: BsCustomDates[] = [
  {
    label: '30 ngày trước',
    value: [
      new Date(new Date().setDate(new Date().getDate() - 30)),
      new Date(),
    ],
  },
  {
    label: '15 ngày trước',
    value: [
      new Date(new Date().setDate(new Date().getDate() - 15)),
      new Date(),
    ],
  },
  {
    label: '7 ngày trước',
    value: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
  },
  {
    label: 'Hôm nay',
    value: [new Date(), new Date()],
  },
];

export const TASK_FIELD_GROUP_EXPORT_EXCEL = [
  {
    fields: [
      {
        label: 'Số thứ tự (STT)',
        code: 'stt',
      },
    ],
  },
  {
    titleGroup: 'Thông tin khách hàng',
    codeGroup: 'leadDeal',
    fields: [
      {
        label: 'Tên khách hàng',
        code: 'leadDeal_name',
      },
      {
        label: 'Id khách hàng',
        code: 'leadDeal_id',
      },
      {
        label: 'Số điện thoại khách hàng',
        code: 'leadDeal_phone',
      },
      {
        label: 'Địa chỉ khách hàng',
        code: 'leadDeal_address',
      },
    ],
  },
  {
    titleGroup: 'Thông tin tác vụ',
    codeGroup: 'task',
    fields: [
      {
        label: 'Tên tác vụ',
        code: 'name',
      },
      {
        label: 'Id tác vụ',
        code: 'id',
      },
      {
        label: 'Chi nhánh',
        code: 'branch_name',
      },
      {
        label: 'Trạng thái',
        code: 'hasTaskChains',
      },
      {
        label: 'Ngày tạo',
        code: 'createdAt',
      },
      {
        label: 'Người tạo',
        code: 'createdBy_name',
      },
      {
        label: 'Danh sách đơn hàng',
        code: 'orderCodes',
      },
      {
        label: 'Nguồn tác vụ của biz',
        code: 'platformSources',
      },
      {
        label: 'Danh sách tag',
        code: 'tags',
      },
      {
        label: 'Chuỗi hành động',
        code: 'taskChains',
      },
      {
        label: 'Các vai trò',
        code: 'teams',
      },
      {
        label: 'Ngày cập nhật cuối',
        code: 'updatedAt',
      },
      {
        label: 'Link cuộc hội thoại',
        code: 'chatLink',
      },
    ],
  },
];

export const FORM_EXPORT_EXCEL = {
  stt: null,
  leadDeal_name: null,
  leadDeal_phone: null,
  leadDeal_address: null,
  leadDeal_id: null,
  name: null,
  id: null,
  branch_name: null,
  hasTaskChains: null,
  createdAt: null,
  createdBy_name: null,
  orderCodes: null,
  platformSources: null,
  tags: null,
  taskChains: null,
  teams: null,
  updatedAt: null,
  chatLink: null,
};
