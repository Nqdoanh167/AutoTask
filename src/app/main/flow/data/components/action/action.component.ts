import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETypeButton, ETypeFilter, IFilterTopTable} from '@app/types/common';
import {ICommonDataSource} from '@app/types/viewmodels';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss'],
})
export class ActionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

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
  public dataSource: ICommonDataSource<any, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };
  constructor() {}

  ngOnInit() {}

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    console.log(this.dataSource.paramsQuery);
  }

  handleUpdate(value: any) {}
  handleDelete(value: any) {}

  pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        limit: Number(limit),
        page: 1,
      };
    }
    this.getDataSource();
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
