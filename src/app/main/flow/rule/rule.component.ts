import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {IChainAct, IChainActRule} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./rule.component.scss'],
})
export class RuleComponent implements OnDestroy, OnInit {
  private destroy$ = new Subject();
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
  ];
  public dataSource: ICommonDataSource<IChainActRule, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };

  constructor(private readonly autoTaskService: AutoTaskService) {}

  onSearch(value: any) {}

  ngOnInit() {
    this.getDataSource();
  }

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.dataSource.loading = true;
    this.autoTaskService.chainAction
      .get(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.dataSource.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.dataSource.rows = res.data?.map((chain) => {
              return {
                ...chain,
                isExpand: false,
              };
            });
            this.dataSource.total = res.total;
          }
        },
      });
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
      };
    }
    this.getDataSource();
  }

  handleExpandRow(value: any) {}
  handleToggleAction(value: any, index: number) {}

  dropRow(value: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
