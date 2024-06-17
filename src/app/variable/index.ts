import {
  EFlowTab,
  EModule,
  ESettingTab,
  ESocialPlatform,
  IColumns,
  IDataColumns,
  ISidebar,
} from '../types/viewmodels';
import {EPerActFlow, EPerActSetting, EPerActTask} from '@app/types/setting';
import {EOptionCloneTask} from '@app/types/flow';

export const listColumns: IDataColumns = {
  columnDashboardAutoTask: [
    {
      name: 'Task',
      value: 'name',
      tooltip: 'Task',
    },
    {
      name: 'Hành động - Kết quả',
      value: 'taskChains',
      tooltip: 'Hành động - Kết quả',
    },
    {
      name: 'Khách hàng',
      value: 'leadDeal',
      tooltip: 'Khách hàng',
    },
    {
      name: 'Sản phẩm quan tâm',
      value: 'cart',
      tooltip: 'Sản phẩm quan tâm',
    },
    {
      name: 'Số lượng đơn hàng',
      value: 'orderIds',
      tooltip: 'Số lượng đơn hàng',
    },
    {
      name: 'Nhân viên phụ trách',
      value: 'teams',
      tooltip: 'Nhân viên phụ trách',
    },
    {
      name: 'Ngày tạo',
      value: 'createdAt',
      tooltip: 'Ngày tạo',
      // fieldSort: 'createdAt',
    },
    {
      name: 'Ngày cập nhật',
      value: 'updatedAt',
      tooltip: 'Ngày cập nhật',
      // fieldSort: 'updatedAt',
    },
    {
      name: 'Người tạo',
      value: 'createdBy',
      tooltip: 'Người tạo',
    },
    {
      name: 'Người cập nhật',
      value: 'updatedBy',
      tooltip: 'Người cập nhật',
    },
  ],
};
export const listColumnsDashboardDefault: IColumns[] =
  listColumns.columnDashboardAutoTask.filter((el) =>
    [
      'name',
      'taskChains',
      'teams',
      'cart',
      'orderIds',
      'leadDeal',
      'createdAt',
    ].includes(el.value),
  );

export const listSettingNavItems: ISidebar[] = [
  {
    link: `/${EModule.SETTING}/${ESettingTab.SOURCE}`,
    alias: ESettingTab.SOURCE,
    name: 'Nguồn dữ liệu',
    isActive: true,
    permissions: [
      EPerActSetting.VIEW_SOURCE_SETTING,
      EPerActSetting.UPDATE_SOURCE_SETTING,
    ],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.TAG}`,
    alias: ESettingTab.TAG,
    name: 'Tag',
    isActive: true,
    permissions: [
      EPerActSetting.VIEW_TAG_SETTING,
      EPerActSetting.UPDATE_TAG_SETTING,
    ],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.DECENTRALIZATION}`,
    alias: ESettingTab.DECENTRALIZATION,
    name: 'Phân quyền',
    isActive: true,
    permissions: [
      EPerActSetting.VIEW_USER_ACCESS_BIZ,
      EPerActSetting.VIEW_USER_ACCESS,
      EPerActSetting.UPDATE_USER_ACCESS,
      EPerActSetting.VIEW_PERMISSION_SETTING_ACCESS,
      EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
    ],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.ROLE}`,
    alias: ESettingTab.ROLE,
    name: 'Vai trò',
    isActive: true,
    permissions: [
      EPerActSetting.VIEW_ROLE_SETTING,
      EPerActSetting.UPDATE_ROLE_SETTING,
    ],
  },
];

export const listDashboardNavItems: ISidebar[] = [
  {
    link: `/${EModule.DASHBOARD}`,
    alias: '',
    name: 'Quản lý Task',
    isActive: true,
    permissions: [EPerActTask.VIEW_TASK, EPerActTask.VIEW_TASK_BIZ],
  },
];

export const listConfigNavItems: ISidebar[] = [
  {
    link: `/${EModule.CONFIG}/${EFlowTab.RULE}`,
    alias: EFlowTab.RULE,
    name: 'Cấu hình quy tắc',
    isActive: true,
    permissions: [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW],
  },
  {
    link: `/${EModule.CONFIG}/${EFlowTab.DATA}`,
    alias: EFlowTab.DATA,
    name: 'Cấu hình dữ liệu',
    isActive: true,
    permissions: [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW],
  },
];
export const optionToCloneTask = [
  {
    label: 'Nguồn dữ liệu',
    value: EOptionCloneTask.SOURCE,
  },
  {
    label: 'Ghi chú',
    value: EOptionCloneTask.NOTE,
  },
  {
    label: 'Nhân sự phụ trách',
    value: EOptionCloneTask.TEAM,
  },
  {
    label: 'TAG',
    value: EOptionCloneTask.TAG,
  },
  {
    label: 'Chuỗi hiện tại',
    value: EOptionCloneTask.CURRENT_CHAIN,
  },
  {
    label: 'Thông tin khách hàng',
    value: EOptionCloneTask.LEADDEAL,
  },
  {
    label: 'Sản phẩm quan tâm',
    value: EOptionCloneTask.PRODUCT,
  },
  {
    label: 'Chi nhánh/Phòng ban/Nhóm',
    value: EOptionCloneTask.BRANCH,
  },
];

export const socialPlatforms: {
  label: string;
  value: ESocialPlatform;
  image?: string;
}[] = [
  {
    label: 'Facebook',
    value: ESocialPlatform.FACEBOOK,
    image: './assets/images/socials/facebook.svg',
  },
  {
    label: 'Zalo',
    value: ESocialPlatform.ZALO,
    image: './assets/images/socials/zalo.svg',
  },
  {
    label: 'LadiPage',
    value: ESocialPlatform.LADIPAGE,
    image: './assets/images/socials/landipage.svg',
  },
  {
    label: 'Other',
    value: ESocialPlatform.OTHER,
  },
];
