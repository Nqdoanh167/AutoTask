import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  distinctUntilChanged,
  filter,
  finalize,
  interval,
  Subject,
  takeUntil,
} from 'rxjs';
import {
  EBotherAdvanceBasicFilter,
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {CommonService} from '@app/services/common/common.service';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {calculateTime} from '@app/utils/common';
import {ModalUpdateTaskComponent} from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import {
  EActionStates,
  ETaskChainType,
  IAction,
  IActResult,
  IChainAct,
  ITask,
} from '@app/types/flow';
import moment from 'moment/moment';
import {cloneDeep, isEqual, uniqBy} from 'lodash';
import {AuthService} from '@app/services/api/auth.service';
import {EScreens, IViewModeDto} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {ModalAssignCounselorComponent} from './content-modal/multiple-action/modal-assign-counselor/modal-assign-counselor.component';
import {environment} from 'src/environments/environment';

@Component({
  selector: 'app-task',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  public currentBiz: string = '';
  protected readonly ETaskChainType = ETaskChainType;
  public multipleAction = [
    {
      label: 'Gán nhân viên phụ trách',
      value: 'ASSIGN_COUNSELOR',
    },
    {
      label: 'Bỏ nhân viên phụ trách',
      value: 'REMOVE_COUNSELOR',
    },
  ];
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
    {
      type: ETypeFilter.SELECT,
      name: 'actionStates',
      placeholder: 'Trạng thái hành động',
      options: [
        {
          label: 'Hành động đã trễ',
          value: EActionStates.OVERDUE,
        },
        {
          label: 'Hành động hẹn giờ',
          value: EActionStates.DUE_SOON,
        },
        {
          label: 'Hành động hoàn thành',
          value: EActionStates.EXECUTED,
        },
        {
          label: 'Ẩn chuỗi đã đóng',
          value: EActionStates.HIDE_FULL_EXECUTED,
        },
      ],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      multiple: true,
      minWidth: '200px',
    },
    {
      type: ETypeFilter.SELECT,
      name: 'chainActIds',
      placeholder: 'Chuỗi',
      options: [],
      bindLabel: 'name',
      bindValue: 'id',
      clearable: true,
      searchable: true,
      multiple: true,
      onSearch: (event: any) => this.handleSearchActChain(event),
      botherType: EBotherAdvanceBasicFilter.ADVANCE

    },
    {
      type: ETypeFilter.SELECT,
      name: 'actionIds',
      placeholder: 'Hành động',
      options: [],
      bindLabel: 'name',
      bindValue: 'id',
      clearable: true,
      searchable: true,
      multiple: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE

    },
    {
      type: ETypeFilter.SELECT,
      name: 'resultIds',
      placeholder: 'Kết quả',
      options: [],
      bindLabel: 'name',
      bindValue: 'id',
      clearable: true,
      searchable: true,
      multiple: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE

    },
    {
      type: ETypeFilter.SELECT,
      name: 'counselorId',
      placeholder: 'Nv Phụ trách',
      options: [],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      searchable: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE
    },
    {
      type: ETypeFilter.SELECT,
      name: 'sort',
      placeholder: 'Sắp xếp',
      options: [
        {
          label: 'Thời gian gần nhất',
          value: 'deadlineDate',
        },
        {
          label: 'Thời gian xa nhất',
          value: '-deadlineDate',
        },
      ],
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
    },
    total: 0,
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

  public currentActiveViewMode?: IViewModeDto;

  // public dataSource$ = interval(10000)
  //   .pipe(takeUntil(this.destroy$))
  //   .subscribe(() => {
  //     this.dataSource.rows = this.runTimer();
  //   });
  protected readonly EScreens = EScreens;
  public taskChecked: string[] = [];
  public headerCheckboxState: boolean[] = [];
  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly autoTaskService: AutoTaskService,
    private readonly authService: AuthService,
    private route: ActivatedRoute,
    private readonly toastrService: ToastrService,
    private router: Router,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          this.currentBiz = biz.alias || '';
          this.configFilters[5].options = biz?.users?.map((user) => ({
            label: user.name,
            value: user.id,
          }));
        }
      });
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((q) => {
      if (q['id']) {
        this.handleUpdate(undefined, q['id']);
      }
    });
  }

  ngOnInit() {
    this.getActionChain();
    this.getResult();
    this.getAction();
    this.handleActiveViewMode();
  }
  showModalMultipleAction(action: any) {
    if (action.value === 'ASSIGN_COUNSELOR') {
      const modalRef = this.modalService.show(ModalAssignCounselorComponent, {
        class: 'modal-dialog-centered',
      });
      modalRef.content?.assignCounselor.subscribe((counselorId) => {
        if (counselorId) {
          this.toastrService.success('Gán nhân viên phụ trách thành công');
        }
      });
    } else if (action.value === 'REMOVE_COUNSELOR') {
      const title = 'Bỏ gán nhân viên phụ trách';
      const description = `Bạn sắp xóa nhân viên phụ trách, hành động này không thể hoàn tác.`;
      const okText = 'Đồng ý';

      const modalContent: IModalConfirmContent = {
        title,
        description,
        okText,
        type: 'warning',
        modalType: 'advance',
      };

      this.modalConfirmService.openModal(
        modalContent,
        'remove-assign-counselor',
      );
    }
  }
  stateChecked(item: ITask, event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.taskChecked.push(item.id);
    } else {
      this.taskChecked = this.taskChecked.filter((id) => id !== item.id);
    }

    this.headerCheckboxState[this.dataSource.paramsQuery.page] =
      this.dataSource.rows.every((tId) => this.taskChecked.includes(tId.id));
  }
  toggleAllRows(event: any): void {
    const checked = event.target.checked;

    this.headerCheckboxState[this.dataSource.paramsQuery.page] = checked;

    this.dataSource.rows.forEach((row) => {
      if (checked) {
        if (!this.taskChecked.includes(row.id)) {
          this.taskChecked.push(row.id);
        }
      } else {
        const index = this.taskChecked.indexOf(row.id);
        if (index > -1) {
          this.taskChecked.splice(index, 1);
        }
      }
    });
  }
  handleActiveViewMode() {
    try {
      this.autoTaskService.currentActiveViewMode
        .pipe(
          takeUntil(this.destroy$),
          distinctUntilChanged(isEqual),
          filter((currentActiveViewMode) => currentActiveViewMode),
        )
        .subscribe((currentActiveViewMode) => {
          this.currentActiveViewMode = currentActiveViewMode;
          const objFilterQuery = JSON.parse(
            this.dataSource.paramsQuery.filter || '{}',
          );
          // loop configFilters and update by value of object options in currentActiveViewMode
          this.configFilters.forEach((configFilter) => {
            if (configFilter.type === ETypeFilter.SELECT) {
              configFilter.value =
                currentActiveViewMode?.options[configFilter.name!];
              if (configFilter.name === 'sort') {
                this.dataSource.paramsQuery.sort = currentActiveViewMode
                  ?.options[configFilter.name!] as string;
              } else {
                objFilterQuery[configFilter.name!] = configFilter.value;
              }
            }
          });
          // update dataSource.paramsQuery.filter by objFilterQuery
          this.dataSource.paramsQuery.filter = JSON.stringify(objFilterQuery);
          this.getDataSource();
        });
    } catch (e) {
      console.log(e);
    }
  }

  handleViewModeChange(hasChanged: boolean) {
    // change hasChanged of currentActiveViewMode to true and update currentActiveViewMode to dashboardViewModes by emit new value
    const changedTab = {
      ...this.currentActiveViewMode,
      hasChanged: hasChanged,
      options: {
        ...JSON.parse(this.dataSource.paramsQuery.filter || '{}'),
        sort: this.dataSource.paramsQuery.sort,
      },
    };
    this.autoTaskService.setCurrentActiveViewMode(changedTab);
  }

  handleSearchActChain(event: any) {}

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

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.actionChains.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actionChains.rows = uniqBy(
              this.actionChains.rows.concat(res.data),
              'id',
            );
            this.configFilters[2].options = this.actionChains.rows;
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
        takeUntil(this.destroy$),
        finalize(() => (this.results.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.results.rows = uniqBy(
              this.results.rows.concat(res.data),
              'id',
            );
            this.configFilters[4].options = this.results.rows;
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
        takeUntil(this.destroy$),
        finalize(() => (this.actions.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actions.rows = uniqBy(
              this.actions.rows.concat(res.data),
              'id',
            );
            this.configFilters[3].options = this.actions.rows;
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

  handleClearQueryParams() {
    this.router.navigate([], {
      queryParams: {
        id: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  handleUpdate(value?: any, taskId?: string) {
    if (value) {
      this.handleClearQueryParams();
    }
    try {
      const modalUpdate = this.modalService.show(ModalUpdateTaskComponent, {
        initialState: {
          sourceData: value,
          taskId,
        },
        class: 'modal-xl',
        ignoreBackdropClick: true,
        keyboard: false,
      });
      modalUpdate?.content?.updateSuccess
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.getDataSource();
        });
      modalUpdate?.onHidden?.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.handleClearQueryParams();
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
  handleViewCreatedOrder(item: ITask) {
    let url = `${environment.urlDomain}/${this.currentBiz}/sale-center/?sourceId=${item.id}`;
    window.open(url, '_blank');
  }
  onRemoveAssignCounselor(value: any) {
    this.toastrService.success('Bỏ gán nhân viên phụ trách thành công');
    // this.autoTaskService.task
    //   .update(value.id, {counselorId: null})
    //   .pipe()
    //   .subscribe({
    //     next: (res) => {
    //       if (res.status === 200) {
    //         this.commonService.handleResSuccess('update');
    //         this.getDataSource();
    //       } else {
    //         this.commonService.handleResErr(res);
    //       }
    //     },
    //     error: (err) => this.commonService.handleErr(err),
    //   });
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

  onSelectFilter(data: {value?: string | string[]; name: string}) {
    try {
      const {value, name} = data;
      if (name !== 'sort') {
        const filter = this.dataSource.paramsQuery?.filter || '{}';
        let obj = JSON.parse(filter);
        if (Array.isArray(value) && value.length > 0) {
          obj[name] = value;
          if (name === 'chainActIds') {
            const selectedChains = this.actionChains.rows.filter((chain) =>
              value.includes(chain.id),
            );
            const actions = selectedChains?.reduce((acc: any[], chain) => {
              return uniqBy(
                [
                  ...acc,
                  ...chain?.actionResults?.map((chainActResult) => {
                    return chainActResult.action;
                  }),
                ],
                'id',
              );
            }, []);
            this.configFilters[3].options = actions?.filter(
              (actions) => !!actions,
            );
          }
        } else if (
          typeof value === 'string' &&
          (!!value || Number(value) === 0)
        ) {
          obj[name] = value;
        } else {
          delete obj[name];
          if (name === 'chainActIds') {
            this.configFilters[3].options = this.actions.rows;
          }
        }
        this.dataSource.paramsQuery.filter = JSON.stringify(obj);
        if (!isEqual(obj, this.currentActiveViewMode?.options)) {
          this.handleViewModeChange(true);
          return;
        }
      } else {
        if (value) {
          this.dataSource.paramsQuery.sort = value;
        } else {
          delete this.dataSource.paramsQuery.sort;
        }
        if (value !== this.currentActiveViewMode?.options?.sort) {
          this.handleViewModeChange(true);
        }
      }
      this.getDataSource(true);
    } catch (e) {
      console.log(e);
    }
  }

  handleLoadMoreData(key: 'action' | 'result' | 'actionChain' | string) {
    if (key === 'actionIds') {
      if (this.actions.isAllowLoadMore) {
        this.actions.paramsQuery!.page! += 1;
        this.getAction();
      }
    }
    if (key === 'chainActIds') {
      if (this.actionChains.isAllowLoadMore) {
        this.actionChains.paramsQuery!.page! += 1;
        this.getActionChain();
      }
    }
    if (key === 'resultIds') {
      if (this.results.isAllowLoadMore) {
        this.results.paramsQuery!.page! += 1;
        this.getResult();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
