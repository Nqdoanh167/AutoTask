import {ETabDetail} from '@app/types/lead';
import {ISettingTabItem} from '@app/types/setting';
import {ETabTaskDetail} from '@app/types/task';

export const LEAD_TABS: ISettingTabItem[] = [
  {
    key: ETabDetail.DISCUSS,
    name: 'Thảo luận',
    icon: 'attribute',
    active: true,
    position: 'center',
  },
  {
    key: ETabDetail.TASK,
    name: 'Tác vụ',
    icon: 'order',
    active: true,
    position: 'center',
  },
  {
    key: ETabDetail.ATTRIBUTE,
    name: 'Attribute',
    icon: 'attribute',
    active: true,
    position: 'center',
  },
  {
    key: ETabDetail.PRODUCT,
    name: 'Sản phẩm',
    icon: 'user',
    active: true,
    position: 'center',
  },
  {
    key: ETabDetail.PACKAGE,
    name: 'Gói dịch vụ',
    icon: 'connections',
    active: true,
    position: 'center',
  },
];

export const TASK_TABS: ISettingTabItem[] = [
  {
    key: ETabTaskDetail.INFO,
    name: 'Thông tin',
    icon: 'attribute',
    active: true,
    position: 'center',
  },
  {
    key: ETabTaskDetail.ORDER,
    name: 'Đơn hàng',
    icon: 'order',
    active: true,
    position: 'center',
  },
  {
    key: ETabTaskDetail.BOOKING,
    name: 'Booking',
    icon: 'connections',
    active: true,
    position: 'center',
  },
  {
    key: ETabTaskDetail.HISTORY,
    name: 'Lịch sử',
    icon: 'user',
    active: true,
    position: 'center',
  },
];
