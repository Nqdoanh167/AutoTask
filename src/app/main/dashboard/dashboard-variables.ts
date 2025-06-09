import {
  EBotherAdvanceBasicFilter,
  ETypeBulkUpdate,
  ETypeButton,
  ETypeFilter,
} from '@app/types/common';
import {EActionStates, EEditedDateState} from '@app/types/flow';
import { BsCustomDates } from 'ngx-bootstrap/datepicker/themes/bs/bs-custom-dates-view.component';

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
  {
    type: ETypeFilter.SEARCH,
    placeholder: 'Tìm kiếm...',
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
  {
    type: ETypeFilter.DATE,
    name: 'createdAt',
    placeholder: 'Ngày tạo',
    subType: 'range',
    clearable: true,
    botherType: EBotherAdvanceBasicFilter.ADVANCE,
  },
  {
    type: ETypeFilter.DATE,
    name: 'updatedAt',
    placeholder: 'Ngày cập nhật cuối',
    subType: 'range',
    clearable: true,
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
    name: 'reload',
    type: ETypeButton.DEFAULT,
    icon: './assets/images/icon/reload.svg',
    tooltip: 'Tải lại trang',
  },
  {
    name: 'orderableTable',
    type: ETypeButton.DEFAULT,
    // label: 'Thêm tác vụ',
    icon: './assets/images/icon/table.svg',
    tooltip: 'Tùy chỉnh bảng',
  },
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
    name: 'add_new',
    type: ETypeButton.PRIMARY,
    label: 'Thêm',
    icon: './assets/images/icon/plus.svg',
    tooltip: 'Thêm mới tác vụ',
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
      value: [
        new Date(new Date().setDate(new Date().getDate() - 7)),
        new Date(),
      ],
    },
    {
      label: 'Hôm nay',
      value: [new Date(), new Date()],
    },
  ];