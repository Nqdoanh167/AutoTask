import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, interval, Subject, takeUntil} from 'rxjs';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {ICommonDataSource} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {CommonService} from '@app/services/common/common.service';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {calculateTime, sortBy, sortIcon} from '@app/utils/common';
import {ModalUpdateTaskComponent} from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import {ETaskChainResultType, ITask} from '@app/types/flow';
import moment from 'moment/moment';
import {cloneDeep} from 'lodash';

@Component({
  selector: 'app-task',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
    {
      type: ETypeFilter.SELECT,
      name: 'chain',
      placeholder: 'Chuỗi',
      options: [],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm task',
      icon: './assets/images/icon/plus.svg',
    },
  ];
  public dataSource: ICommonDataSource<ITask, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };
  private sortProperty: string = 'createdAt';
  private sortOrder = 1;
  public dataSource$ = interval(10000)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.dataSource.rows = this.runTimer();
    });
  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  ngOnInit() {
    this.getDataSource();
  }

  runTimer() {
    return cloneDeep(this.dataSource.rows);
  }

  calculateTimeLeft(date: Date) {
    let data = {
      timeLeft: '',
      typeOverDeadline: 'notOver',
    };
    const subDate = calculateTime(date, new Date(), 'metrics') as {
      days?: number;
      hours?: number;
      minutes?: number;
    };
    if (subDate.days === 0 && subDate.hours === 0 && subDate.minutes === 0) {
      data.typeOverDeadline = 'now';
    } else if (moment().isAfter(date)) {
      data.typeOverDeadline = 'over';
      data.timeLeft = calculateTime(new Date(), date) as string;
    }
    if (data.typeOverDeadline !== 'over') {
      data.timeLeft = calculateTime(date, new Date()) as string;
    }
    return data;
  }

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.dataSource.loading = true;
    this.autoTaskService.task
      .get(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.dataSource.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.dataSource.rows = res.data;
            this.dataSource.total = res.total;
          }
        },
      });
  }

  handleUpdate(value?: any) {
    try {
      const modalUpdate = this.modalService.show(ModalUpdateTaskComponent, {
        initialState: {
          sourceData: value,
        },
        class: 'modal-xl',
        ignoreBackdropClick: true,
        keyboard: false,
      });
      modalUpdate?.content?.updateSuccess.pipe().subscribe(() => {
        this.getDataSource();
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
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
      };
    }
    this.getDataSource();
  }

  onDelete(value: any) {
    this.autoTaskService.task
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.getDataSource();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleDeleteAction(value: any) {
    const title = 'Xóa hành động';
    const description = `Bạn sắp xóa hành động <b>${
      value.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: value,
    };

    this.modalConfirmService.openModal(modalContent, 'delete');
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }

  onSelectFilter(data: {value?: string; name: string}) {
    try {
      const {value, name} = data;
      const filter = this.dataSource.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      if (value || Number(value) === 0) {
        obj[name] = value;
      } else {
        delete obj[name];
      }
      this.dataSource.paramsQuery.filter = JSON.stringify(obj);
      this.getDataSource(true);
    } catch (e) {
      console.log(e);
    }
  }

  sortBy(property: string): void {
    const {sortProperty, sortOrder, sortQuery} = sortBy(
      this.sortOrder,
      this.sortProperty,
      property,
    );
    [this.sortProperty, this.sortOrder] = [sortProperty, sortOrder];
    this.dataSource.paramsQuery = {
      ...this.dataSource.paramsQuery,
      sort: sortQuery ? sortQuery : undefined,
    };
    this.getDataSource(true);
  }

  sortIcon(property: string) {
    return sortIcon(property, this.sortProperty, this.sortOrder);
  }

  ngOnDestroy(): void {
    this.dataSource$.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  protected readonly ETaskChainResultType = ETaskChainResultType;
}
