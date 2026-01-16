import {ISettingTabItem} from '@app/types/setting';

export const DEFAULT_LEAD_TABS: ISettingTabItem[] = [
  {
    key: 'discuss',
    name: 'Thảo luận',
    icon: 'attribute',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'task',
    name: 'Tác vụ',
    icon: 'order',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'attribute',
    name: 'Attribute',
    icon: 'attribute',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'product',
    name: 'Sản phẩm',
    icon: 'user',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'package',
    name: 'Gói dịch vụ',
    icon: 'connections',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'history',
    name: 'Lịch sử',
    icon: 'user',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'right',
        label: 'Cột phải',
      },
    ],
  },
  {
    key: 'customer',
    name: 'Khách hàng',
    icon: 'user',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột phải',
      },
    ],
  },
];

export const DEFAULT_TASK_TABS: ISettingTabItem[] = [
  {
    key: 'task',
    name: 'Tác vụ',
    icon: 'order',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },
  {
    key: 'customer',
    name: 'Khách hàng',
    icon: 'user',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
      {
        value: 'right',
        label: 'Cột phải',
      },
    ],
  },
  {
    key: 'order',
    name: 'Đơn hàng',
    icon: 'order',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'left',
        label: 'Cột trái',
      },
    ],
  },

  {
    key: 'history',
    name: 'Lịch sử',
    icon: 'user',
    active: true,
    positions: ['left'],
    isDefault: true,
    positionOptions: [
      {
        value: 'right',
        label: 'Cột phải',
      },
    ],
  },
];
