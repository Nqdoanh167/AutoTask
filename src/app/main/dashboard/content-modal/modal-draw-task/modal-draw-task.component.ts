import {Component, EventEmitter, inject, Output} from '@angular/core';
import {DashboardData} from '../../dashboard-data';
import {ITask} from '@app/types/flow';
import {
  IChangePage,
  ICommonDataSource,
  ITag,
} from '@app/types/viewmodels';
import {finalize, shareReplay, takeUntil} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {cloneDeep} from 'lodash';

@Component({
  selector: 'modal-draw-task',
  templateUrl: './modal-draw-task.component.html',
  styleUrls: ['./modal-draw-task.component.scss'],
})
export class ModalDrawTaskComponent extends DashboardData {
  @Output() drawSuccess = new EventEmitter<ITask>();
  protected readonly toastrService = inject(ToastrService);
  public override item: ICommonDataSource<ITask, any> = {
    rows: [],
    loading: false,
    isFirstRequest: true,
    paramsQuery: {
      limit: 20,
      page: 1,
      q: '',
      sort: '-createdAt',
      filter: {
        branchIds: [],
        tags: [],
        sourceIds: null,
      },
    },
    total: 0,
    after: '',
  };

  public afterHistory: string[] = [];
  public currentAfterIndex: number = -1;

  public isOpenBackDrop: boolean = false;

  override ngOnInit() {
    this.getItems(true);
  }

  getItems(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }

    console.log('getItems', this.item.paramsQuery);

    const params = cloneDeep(this.item.paramsQuery);

    Object.keys(params.filter).forEach((key) => {
      if (
        params.filter[key] === null ||
        params.filter[key] === undefined ||
        (Array.isArray(params.filter[key]) && params.filter[key].length === 0)
      ) {
        delete params.filter[key];
      }
    });

    if (params.filter.branchIds && !Array.isArray(params.filter.branchIds)) {
      params.filter.branchIds = [params.filter.branchIds];
    }

    if (params.filter.tags && !Array.isArray(params.filter.tags)) {
      params.filter.tags = [params.filter.tags];
    }

    if (params.filter.sourceIds && !Array.isArray(params.filter.sourceIds)) {
      params.filter.sourceIds = [params.filter.sourceIds];
    }

    params.filter = JSON.stringify(params.filter);

    this.autoTaskService.task
      .drawable(params)
      .pipe(
        finalize(() => {
          this.item = {...this.item, loading: false};
        }),
        shareReplay(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.meta?.total || 0;
            if (res.meta?.after) this.item.after = res.meta.after;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  getTagById(id: string) {
    if (id) return this.tags.rows.find((tag: ITag) => tag.id === id);
    return null;
  }

  getBranch(branch: any): any {
    if (branch?.name) return branch;
    return this.bizBranches?.find((b) => b.id === branch?.id) || null;
  }

  getSourceById(sourceId: string | undefined): any {
    if (sourceId) return this.sources.rows.find((s) => s.id === sourceId);
    return null;
  }

  drawTask(task: ITask) {
    if (!task || !task.id) {
      return;
    }
    this.autoTaskService.task
      .drawTask(task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastrService.success('Rút số thành công');
            this.item.rows = this.item.rows.filter((t) => t.id !== task.id);
            this.item.total -= 1;
            this.drawSuccess.emit(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleChangePageLazy(direction: IChangePage): void {
    if (this.item.loading) return;

    const currentPage = this.item.paramsQuery.page;

    if (direction === 'after') {
      this.item.paramsQuery.page = currentPage + 1;

      if (this.item.after && !this.afterHistory.includes(this.item.after)) {
        this.afterHistory.push(this.item.after);
      }
      this.currentAfterIndex = this.afterHistory.length - 1;

      this.item.paramsQuery.after = this.item.after;
    } else if (direction === 'before') {
      this.item.paramsQuery.page = currentPage - 1;

      if (this.currentAfterIndex > 0) {
        this.currentAfterIndex--;
        this.item.paramsQuery.after = this.afterHistory[this.currentAfterIndex];
      } else {
        delete this.item.paramsQuery.after;
        this.currentAfterIndex = -1;
      }
    }
    this.getItems();
  }

  override pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
        limit: Number(limit),
      };
    }
    delete this.item.paramsQuery.after;
    this.getItems();
  }
}
