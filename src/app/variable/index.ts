import {
  EFlowTab,
  EModule,
  ESettingTab,
  ELeadTab,
  ELeadSettingTab,
  ESocialPlatform,
  IColumns,
  IDataColumns,
  ISidebar,
} from '../types/viewmodels';
import {
  EPerActFlow,
  EPerActSetting,
  EPerActTask,
  EPerActLead,
} from '@app/types/setting';
import {EOptionCloneTask} from '@app/types/flow';
import {EStringeeErrorCode} from '@app/types/sms-ott-call';

export const listColumns: IDataColumns = {
  columnDashboardAutoTask: [
    {
      name: 'Tác vụ',
      value: 'name',
      tooltip: 'Tác vụ',
    },
    {
      name: 'Chuỗi chăm sóc',
      value: 'taskChains',
      tooltip: 'Chuỗi chăm sóc',
    },
    {
      name: 'Khách hàng',
      value: 'leadDeal',
      tooltip: 'Khách hàng',
    },
    {
      name: 'Chi nhánh',
      value: 'branch',
      tooltip: 'Chi nhánh/Phòng ban/Nhóm',
    },
    {
      name: 'Sản phẩm',
      value: 'cart',
      tooltip: 'Sản phẩm quan tâm',
    },
    {
      name: 'Đơn hàng',
      value: 'orderIds',
      tooltip: 'Đơn hàng',
    },
    {
      name: 'Nhân viên',
      value: 'teams',
      tooltip: 'Nhân viên phụ trách',
    },
    {
      name: 'Facebook Ads ID',
      value: 'fbAdId',
      tooltip: 'Facebook Ads ID',
    },
    {
      name: 'Thông tin UTM',
      value: 'utm',
      tooltip: 'Thông tin UTM',
    },
    {
      name: 'Ngày tạo',
      value: 'createdAt',
      tooltip: 'Ngày tạo',
      // fieldSort: 'createdAt',
    },
    {
      name: 'Ngày cập nhật cuối',
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
      name: 'Người cập nhật cuối',
      value: 'updatedBy',
      tooltip: 'Người cập nhật',
    },
  ],
  columnLeadDashboard: [
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
      name: 'Tổng tiền',
      value: 'totalPrice',
      fieldSort: 'totalPrice',
      tooltip: 'Tổng tiền',
    },
    {
      name: 'Trạng thái Leads',
      value: 'status',
      tooltip: 'Trạng thái hiện tại của lead',
    },
    {
      name: 'Tác vụ',
      value: 'taskId',
      tooltip: 'Tác vụ liên quan',
    },
    {
      name: 'Đơn hàng',
      value: 'orderId',
      tooltip: 'Đơn hàng liên quan',
    },
    {
      name: 'Ngày tạo',
      value: 'createdAt',
      fieldSort: 'createdAt',
      tooltip: 'Ngày tạo',
    },
    {
      name: 'Ngày cập nhật',
      value: 'updatedAt',
      fieldSort: 'updatedAt',
      tooltip: 'Ngày cập nhật',
    },
    {
      name: 'Người tạo',
      value: 'createdBy',
      tooltip: 'Người tạo',
    },
  ],
};

export const listColumnsLead: IColumns[] = [
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
    name: 'Tổng tiền',
    value: 'totalPrice',
    fieldSort: 'totalPrice',
    tooltip: 'Tổng tiền',
  },
  {
    name: 'Trạng thái Leads',
    value: 'status',
    tooltip: 'Trạng thái hiện tại của lead',
  },
  {
    name: 'Tác vụ',
    value: 'taskId',
    tooltip: 'Tác vụ liên quan',
  },
  {
    name: 'Đơn hàng',
    value: 'orderId',
    tooltip: 'Đơn hàng liên quan',
  },
  {
    name: 'Ngày tạo',
    value: 'createdAt',
    fieldSort: 'createdAt',
    tooltip: 'Ngày tạo',
  },
  {
    name: 'Ngày cập nhật',
    value: 'updatedAt',
    fieldSort: 'updatedAt',
    tooltip: 'Ngày cập nhật',
  },
  {
    name: 'Người tạo',
    value: 'createdBy',
    tooltip: 'Người tạo',
  },
];

export const listColumnsDashboardDefault: IColumns[] =
  listColumns.columnDashboardAutoTask.filter((el) =>
    [
      'name',
      'taskChains',
      'teams',
      'cart',
      'orderIds',
      'leadDeal',
      'fbAdId',
      'utm',
      'createdAt',
    ].includes(el.value),
  );

export const listColumnsLeadDefault: IColumns[] = listColumnsLead.filter((el) =>
  [
    'name',
    'phone',
    'email',
    'totalPrice',
    'status',
    'taskId',
    'orderId',
    'createdAt',
  ].includes(el.value),
);

export const listSettingNavItems: ISidebar[] = [
  {
    link: `/${EModule.SETTING}/${ESettingTab.SOURCE}`,
    alias: ESettingTab.SOURCE,
    name: 'Nguồn dữ liệu',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.TAG}`,
    alias: ESettingTab.TAG,
    name: 'Thẻ tag',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.DECENTRALIZATION}`,
    alias: ESettingTab.DECENTRALIZATION,
    name: 'Phân quyền',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.ROLE}`,
    alias: ESettingTab.ROLE,
    name: 'Cấu hình tác vụ',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.DIVIDE}`,
    alias: ESettingTab.DIVIDE,
    name: 'Chia số',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
  {
    link: `/${EModule.SETTING}/${ESettingTab.STATUS_LEAD}`,
    alias: ESettingTab.STATUS_LEAD,
    name: 'Cấu hình trạng thái lead',
    isActive: true,
    permissions: [EPerActSetting.VIEW_MASTER_DATA],
  },
];

export const listDashboardNavItems: ISidebar[] = [
  {
    link: `/${EModule.DASHBOARD}`,
    alias: '',
    name: 'Quản lý tác vụ',
    isActive: true,
    permissions: [EPerActTask.VIEW_TASK, EPerActTask.VIEW_TASK_SAME_LEVEL],
  },
];

export const listLeadNavItems: ISidebar[] = [
  {
    link: `/${EModule.LEAD}/${ELeadTab.DASHBOARD}`,
    alias: ELeadTab.DASHBOARD,
    name: 'Danh sách Leads',
    isActive: true,
  },
  {
    link: `/${EModule.LEAD}/${ELeadTab.SETTING}`,
    alias: ELeadTab.SETTING,
    name: 'Cấu hình',
    isActive: true,
  },
];

export const listLeadSettingNavItems: ISidebar[] = [
  {
    link: `/${EModule.LEAD}/${ELeadTab.SETTING}?tab=STATUS`,
    alias: 'STATUS',
    name: 'Trạng thái',
    isActive: true,
    permissions: [
      EPerActLead.VIEW_LEAD_STATUS_SETTING,
      EPerActLead.UPDATE_LEAD_STATUS_SETTING,
    ],
  },
  {
    link: `/${EModule.LEAD}/${ELeadTab.SETTING}?tab=TAG`,
    alias: 'TAG',
    name: 'Tags',
    isActive: true,
    permissions: [
      EPerActLead.VIEW_LEAD_TAG_SETTING,
      EPerActLead.UPDATE_LEAD_TAG_SETTING,
    ],
  },
];

export const listConfigNavItems: ISidebar[] = [
  {
    link: `/${EModule.CONFIG}/${EFlowTab.RULE}`,
    alias: EFlowTab.RULE,
    name: 'Cấu hình quy tắc',
    isActive: true,
    permissions: [EPerActFlow.VIEW_FLOW],
  },
  {
    link: `/${EModule.CONFIG}/${EFlowTab.DATA}`,
    alias: EFlowTab.DATA,
    name: 'Cấu hình dữ liệu',
    isActive: true,
    permissions: [EPerActFlow.VIEW_FLOW],
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
    image: './assets/images/platform_facebook.png',
  },
  {
    label: 'Shopee',
    value: ESocialPlatform.SHOPEE,
    image: './assets/images/platform_shopee.png',
  },
  {
    label: 'TikTok',
    value: ESocialPlatform.TIKTOK,
    image: './assets/images/platform_tiktok.png',
  },
  {
    label: 'Lazada',
    value: ESocialPlatform.LAZADA,
    image: './assets/images/platform_lazada.png',
  },
  {
    label: 'LadiPage',
    value: ESocialPlatform.LADIPAGE,
    image: './assets/images/platform_ladipage.png',
  },
  {
    label: 'Tiki',
    value: ESocialPlatform.TIKI,
    image: './assets/images/platform_tiki.png',
  },

  {
    label: 'Zalo',
    value: ESocialPlatform.ZALO,
    image: './assets/images/platform_zalo.png',
  },

  {
    label: 'Other',
    value: ESocialPlatform.OTHER,
  },
];

export const mappingStringeeCallStatus: Record<EStringeeErrorCode, string> = {
  [EStringeeErrorCode.NOT_INIT]: 'Chưa khởi tạo kết nối đến server',
  [EStringeeErrorCode.SUCCESS]: 'Thành công',
  [EStringeeErrorCode.ANSWER_URL_EMPTY]: 'Answer URL trống',
  [EStringeeErrorCode.ANSWER_URL_SCCO_INCORRECT_FORMAT]:
    'Chưa khởi tạo kết nối đến server',
  [EStringeeErrorCode.TO_TYPE_IS_NOT_INTERNAL_OR_EXTERNAL]:
    'To type không phải là Internal hoặc External',
  [EStringeeErrorCode.FROM_NUMBER_NOT_FOUND]:
    'Không tìm thấy số điện thoại người gọi',
  [EStringeeErrorCode.FROM_NUMBER_NOT_BELONG_YOUR_ACCOUNT]:
    'Số điện thoại người gọi không thuộc tài khoản của bạn',
  [EStringeeErrorCode.SIP_TRUNK_NOT_FOUND]: 'Không tìm thấy SIP Trunk',
  [EStringeeErrorCode.SIP_TRUNK_NOT_BELONG_YOUR_ACCOUNT]:
    'SIP Trunk không thuộc tài khoản của bạn',
  [EStringeeErrorCode.NOT_ENOUGH_MONEY]:
    'Không đủ tiền trong tài khoản để thực hiện cuộc gọi',
  [EStringeeErrorCode.UNKNOW_ERROR_1]: 'Lỗi không xác định',
  [EStringeeErrorCode.FROM_NUMBER_OR_TO_NUMBER_INVALID_FORMAT]:
    'Số điện thoại người gọi hoặc người nhận không đúng định dạng',
  [EStringeeErrorCode.CALL_NOT_ALLOWED_BY_YOUR_SERVER]:
    'Cuộc gọi không được phép bởi server của bạn',
  [EStringeeErrorCode.MAX_CONCURRENT_CALL]:
    'Số cuộc gọi đồng thời đã đạt giới hạn',
  [EStringeeErrorCode.WAIT_TEXT_TO_SPEECH]: 'Đang chờ Text to Speech',
  [EStringeeErrorCode.TO_NUMBER_INVALID]:
    'Số điện thoại người nhận không hợp lệ',
  [EStringeeErrorCode.FROM_NUMBER_NOT_BELONG_YOUR_PROJECT]:
    'Số điện thoại người gọi không thuộc Stringee Project của bạn',
  [EStringeeErrorCode.NOT_ALLOW_CHAT_USER]:
    'Không cho phép chat với người dùng',
  [EStringeeErrorCode.NOT_ALLOW_CALLOUT]:
    'Không cho phép thực hiện cuộc gọi ra',
  [EStringeeErrorCode.REQUEST_ANSWER_URL_ERROR]: 'Lỗi khi yêu cầu Answer URL',
  [EStringeeErrorCode.ACCOUNT_LOCKED]: 'Tài khoản bị khóa',
  [EStringeeErrorCode.CREATE_PEER_CONNECTION_ERROR]:
    'Lỗi khi tạo Peer Connection',
  [EStringeeErrorCode.GET_USER_MEDIA_ERROR]:
    'Quyền sử dụng Camera /Mic or WebRTC chưa được kích hoạt',
};
