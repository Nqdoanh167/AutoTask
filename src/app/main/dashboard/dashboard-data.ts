import {ICommonDataLazy, IQueryBase, ITag} from '@app/types/viewmodels';
import {IAction, IActResult, IChainAct, ITask} from '@app/types/flow';
import {ISource} from '@app/types/setting';
import {finalize, Subject, takeUntil} from 'rxjs';
import {uniqBy} from 'lodash';
import {CommonService} from '@app/services/common/common.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {IFilterTopButton, IFilterTopTable} from '@app/types/common';
import {
  TASK_CONFIG_BUTTON,
  TASK_CONFIG_FILTERS,
} from '@main/dashboard/dashboard-variables';
import {inject} from '@angular/core';
import {CheckboxSortTableComponent} from '@share/common/checkbox-table/checkbox-sort-table.component';

export class DashboardData extends CheckboxSortTableComponent<
  ITask,
  IQueryBase
> {
  protected readonly commonService = inject(CommonService);
  protected readonly autoTaskService = inject(AutoTaskService);

  public override configFilters: IFilterTopTable[] = TASK_CONFIG_FILTERS;
  public override configButtons: IFilterTopButton[] = TASK_CONFIG_BUTTON;
  public sort: any = {
    updatedAt: 0,
    createdAt: 0,
  };
  public actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      filter: JSON.stringify({isActive: true}),
    },
    isAllowLoadMore: false,
  };
  public results: ICommonDataLazy<IActResult, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public actions: ICommonDataLazy<IAction, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public tags: ICommonDataLazy<ITag, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
    },
    isAllowLoadMore: false,
  };
  public sources: ICommonDataLazy<ISource, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
    },
    isAllowLoadMore: false,
  };

  constructor() {
    super();
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};

    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });
    this.autoTaskService.task
      .get(params)
      .pipe(
        finalize(() => {
          this.item.loading = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.total;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        finalize(() => {
          this.actionChains.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actionChains.rows = uniqBy(
              this.actionChains.rows.concat(res.data),
              'id',
            );
            const configFilterChain = this.configFilters.find(
              (filter) => filter.name === 'chainActId',
            );
            if (configFilterChain) {
              configFilterChain.options = [
                {id: 'NONE', name: 'Chưa gán chuỗi'},
              ].concat(this.actionChains.rows);
            }
            this.actionChains.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.actionChains.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actionChains.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getResult() {
    this.results.loading = true;
    this.autoTaskService.actionResult
      .get(this.results.paramsQuery)
      .pipe(
        finalize(() => {
          this.results.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.results.rows = uniqBy(
              this.results.rows.concat(res.data),
              'id',
            );
            const configFilterResult = this.configFilters.find(
              (filter) => filter.name === 'resultIds',
            );
            if (configFilterResult) {
              configFilterResult.options = this.results.rows;
            }
            this.results.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.results.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.results.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getAction() {
    this.actions.loading = true;
    this.autoTaskService.action
      .get(this.actions.paramsQuery)
      .pipe(
        finalize(() => (this.actions.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actions.rows = uniqBy(
              this.actions.rows.concat(res.data),
              'id',
            );
            const configFilterAction = this.configFilters.find(
              (filter) => filter.name === 'actionIds',
            );
            if (configFilterAction) {
              configFilterAction.options = this.actions.rows;
            }
            this.actions.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.actions.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actions.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getSource() {
    this.sources.loading = true;
    this.autoTaskService.source
      .get(this.sources.paramsQuery)
      .pipe(
        finalize(() => (this.sources.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sources.rows = uniqBy(
              this.sources.rows.concat(res.data),
              'id',
            );
            const configFilterSource = this.configFilters.find(
              (filter) => filter.name === 'sourceIds',
            );
            if (configFilterSource) {
              configFilterSource.options = this.sources.rows;
            }
            this.sources.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.sources.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.sources.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getTag() {
    this.tags.loading = true;
    this.autoTaskService.tag
      .get(this.tags.paramsQuery)
      .pipe(
        finalize(() => (this.tags.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tags.rows = uniqBy(this.tags.rows.concat(res.data), 'id');
            const configFilterTag = this.configFilters.find(
              (filter) => filter.name === 'tagIds',
            );
            if (configFilterTag) {
              configFilterTag.options = this.tags.rows;
            }
            this.tags.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.tags.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.tags.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }
}
