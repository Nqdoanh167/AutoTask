import {Component} from '@angular/core';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';
import {ICommonDataSource} from '@app/types/viewmodels';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./rule.component.scss'],
})
export class RuleComponent {
  private destroy$ = new Subject();
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
  ];
  public dataSource: ICommonDataSource<any, any> = {
    rows: [
      {
        name: 'CSKH',
        isExpand: false,
        children: [
          {
            name: 'Gọi lần đầu',
          },
        ],
      },
      {
        name: 'HDSD',
        isExpand: false,
        children: [
          {
            name: 'Gọi chào hàng',
          },
        ],
      },
    ],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };

  constructor() {}

  onSearch(value: any) {}

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
  }

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

  handleExpandRow(value: any) {}

  handleUpdateAction(value: any, index: number) {}
  handleToggleAction(value: any, index: number) {}

  dropRow(value: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
