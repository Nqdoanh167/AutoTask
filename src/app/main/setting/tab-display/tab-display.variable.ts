import {ETabDetail} from '@app/types/lead';
import {ISettingTabItem} from '@app/types/setting';
import {ETabTaskDetail} from '@app/types/task';

export const LEAD_TABS: ISettingTabItem[] = [
  {
    key: ETabDetail.DISCUSS,
    name: 'Thảo luận',
    icon: 'attribute',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabDetail.TASK,
    name: 'Tác vụ',
    icon: 'order',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabDetail.ATTRIBUTE,
    name: 'Attribute',
    icon: 'attribute',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabDetail.PRODUCT,
    name: 'Sản phẩm',
    icon: 'user',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabDetail.PACKAGE,
    name: 'Gói dịch vụ',
    icon: 'connections',
    active: true,
    position: 'left',
    isDefault: true,
  },
];

export const TASK_TABS: ISettingTabItem[] = [
  {
    key: ETabTaskDetail.INFO,
    name: 'Thông tin',
    icon: 'attribute',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabTaskDetail.ORDER,
    name: 'Đơn hàng',
    icon: 'order',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabTaskDetail.BOOKING,
    name: 'Booking',
    icon: 'connections',
    active: true,
    position: 'left',
    isDefault: true,
  },
  {
    key: ETabTaskDetail.HISTORY,
    name: 'Lịch sử',
    icon: 'user',
    active: true,
    position: 'left',
    isDefault: true,
  },
];
