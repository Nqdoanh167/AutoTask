import {Component} from '@angular/core';
import {ETypeButton, ETypeFilter, IFilterTopTable} from '@app/types/common';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss'],
})
export class ActionComponent {
  public typeActions = [
    {
      value: 'call',
      label: 'Gọi điện',
    },
    {
      value: 'sendSMS',
      label: 'Nhắn tin',
    },
    {
      value: 'createRecord',
      label: 'Tạo bản ghi Khách hàng',
    },
    {
      value: 'callBlock',
      label: 'Gọi Block Automation',
    },
    {
      value: 'othor',
      label: 'Khác',
    },
    {
      value: 'closeChain',
      label: 'Đóng chuỗi',
    },
    {
      value: 'move',
      label: 'Chuyển sang Hành động khác',
    },
    {
      value: 'addChainAction',
      label: 'Thêm Chuỗi hành động khác',
    },
  ];
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên hành động...',
    },
    {
      type: ETypeFilter.SELECT,
      placeholder: 'Loại',
      options: this.typeActions,
      bindLabel: 'label',
      bindValue: 'value',
    },
  ];
  public configButtons = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add',
      type: ETypeButton.PRIMARY,
      label: 'Thêm mới',
      icon: './assets/images/icon/plus.svg',
    },
  ];
  constructor() {}
}
