import {Component, OnDestroy, OnInit} from '@angular/core';
import {distinctUntilChanged, filter, finalize, Subject, takeUntil} from 'rxjs';
import {
  EBotherAdvanceBasicFilter,
  ETypeBulkUpdate,
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {
  IColumns,
  ICommonDataLazy,
  ICommonDataSource,
  IDateRange,
  IQueryBase,
  ITag,
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
  ITaskChain,
} from '@app/types/flow';
import moment from 'moment/moment';
import {cloneDeep, isEqual, uniqBy} from 'lodash';
import {AuthService} from '@app/services/api/auth.service';
import {
  EPerActFlow,
  EPerActSetting,
  EPerActTask,
  EPerActType,
  EScreens,
  ISource,
  IViewModeDto,
} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {ModalAssignTeamComponent} from './content-modal/multiple-action/modal-assign-team/modal-assign-team.component';
import {environment} from 'src/environments/environment';
import {OrderableTableComponent} from '@app/share/orderable-table/orderable-table.component';
import {listColumnsDashboardDefault} from '@app/variable';
import {ModalCloneComponent} from './content-modal/multiple-action/modal-clone/modal-clone.component';

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
      value: ETypeBulkUpdate.ASSIGN_TEAM,
    },
    {
      label: 'Bỏ nhân viên phụ trách',
      value: ETypeBulkUpdate.REMOVE_TEAM,
    },
  ];
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
    {
      type: ETypeFilter.POPOVER,
      name: 'sort',
      placeholder: 'Sắp xếp',
      options: [
        {
          label: 'Ngày tạo: Mới -> Cũ',
          value: '-createdAt',
        },
        {
          label: 'Ngày tạo: Cũ -> Mới',
          value: 'createdAt',
        },
        {
          label: 'Ngày cập nhật: Mới -> Cũ',
          value: '-updatedAt',
        },
        {
          label: 'Ngày cập nhật: Cũ -> Mới',
          value: 'updatedAt',
        },
        {
          label: 'Hành động: Trễ -> Cần thực hiện -> Đã thực hiện',
          value: 'deadlineDate',
        },
        {
          label: 'Hành động: Đã thực hiện -> Cần thực hiện -> Trễ',
          value: '-deadlineDate',
        },
      ],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      value: 'createdAt',
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
        // {
        //   label: 'Ẩn chuỗi đã đóng',
        //   value: EActionStates.HIDE_FULL_EXECUTED,
        // },
      ],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      multiple: true,
      minWidth: '200px',
      botherType: EBotherAdvanceBasicFilter.ADVANCE,
    },
    {
      type: ETypeFilter.SELECT,
      name: 'teamId',
      placeholder: 'Nhân sự phụ trách',
      options: [],
      bindLabel: 'name',
      bindValue: 'id',
      clearable: true,
      searchable: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE,
    },
    {
      type: ETypeFilter.DATE,
      name: 'createdAt',
      placeholder: 'Ngày tạo',
      subType: 'range',
      clearable: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE,
    },
    {
      type: ETypeFilter.DATE,
      name: 'updatedAt',
      placeholder: 'Ngày sửa',
      subType: 'range',
      clearable: true,
      botherType: EBotherAdvanceBasicFilter.ADVANCE,
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'isHideExecute',
      type: ETypeButton.TOGGLE,
      label: 'Ẩn chuỗi đã đóng',
      value: true,
    },
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm tác vụ',
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

  public currentActiveViewMode?: IViewModeDto;

  // public dataSource$ = interval(10000)
  //   .pipe(takeUntil(this.destroy$))
  //   .subscribe(() => {
  //     this.dataSource.rows = this.runTimer();
  //   });
  protected readonly EScreens = EScreens;
  public taskChecked: string[] = [];
  public headerCheckboxState: boolean[] = [];

  private startX: number = 0;
  private startWidth: number = 0;
  private resizing: boolean = false;
  private resizingColumn: HTMLElement | null = null;
  public dataColumnsShow!: IColumns[];
  public sort: any = {
    updatedAt: 0,
    createdAt: 0,
  };
  public permission = {
    add: false,
    edit: false,
    delete: false,
  };

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
          this.authService.getColleague();
          const configFilterStaff = this.configFilters.find(
            (filter) => filter.name === 'teamId',
          );
          if (configFilterStaff) {
            configFilterStaff.options = [
              {name: 'Chưa gán nhân sự phụ trách', id: 'NONE'},
            ].concat(this.authService.getColleague());
          }
        }
      });
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((q) => {
      if (q['id']) {
        this.handleUpdate(undefined, q['id']);
      }
    });
    const typeColumn = 'columnDashboardAutoTask';
    const defaultColumn = listColumnsDashboardDefault;
    const dataColumns = JSON.parse(localStorage.getItem(typeColumn) as string);
    if (
      !dataColumns ||
      !dataColumns.length ||
      typeof dataColumns[0] !== 'object'
    ) {
      localStorage.setItem(typeColumn, JSON.stringify(defaultColumn));
    }
    this.dataColumnsShow = dataColumns || defaultColumn;
  }

  ngOnInit() {
    this.handleCheckPermission();
    this.handleActiveViewMode();
    const permissions = this.authService.getUserPerByType(EPerActType.TASK);
    this.permission.edit = this.hasPermission(
      permissions,
      EPerActTask.UPDATE_TASK,
    );
    this.permission.add = this.hasPermission(
      permissions,
      EPerActTask.CREATE_TASK,
    );
    this.permission.delete = this.hasPermission(
      permissions,
      EPerActTask.DELETE_TASK,
    );
    if (!this.permission.add) {
      this.configButtons[2].hidden = true;
    }
  }

  handleCheckPermission() {
    const permissions = [
      ...this.authService.getUserPerByType(EPerActType.TASK),
      ...this.authService.getUserPerByType(EPerActType.SETTING),
      ...this.authService.getUserPerByType(EPerActType.FLOW),
    ];
    if (
      permissions.some((per) =>
        [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW].includes(
          per as EPerActFlow,
        ),
      )
    ) {
      this.getActionChain();
      this.getResult();
      this.getAction();
      this.configFilters = [
        ...this.configFilters,
        ...[
          {
            type: ETypeFilter.SELECT,
            name: 'chainActId',
            placeholder: 'Chuỗi hành động',
            options: [
              {
                id: 'NONE',
                name: 'Chưa gán chuỗi',
              },
            ],
            bindLabel: 'name',
            bindValue: 'id',
            clearable: true,
            searchable: true,
            multiple: false,
            onSearch: (event: any) => this.handleSearchActChain(event),
            botherType: EBotherAdvanceBasicFilter.ADVANCE,
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
            botherType: EBotherAdvanceBasicFilter.ADVANCE,
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
            botherType: EBotherAdvanceBasicFilter.ADVANCE,
          },
        ],
      ];
    }
    if (
      permissions.some((per) =>
        [
          EPerActSetting.VIEW_SOURCE_SETTING,
          EPerActSetting.UPDATE_SOURCE_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getSource();
      this.configFilters.push({
        type: ETypeFilter.SELECT,
        name: 'sourceIds',
        placeholder: 'Nguồn dữ liệu',
        options: [],
        bindLabel: 'name',
        bindValue: 'id',
        clearable: true,
        searchable: true,
        multiple: true,
        botherType: EBotherAdvanceBasicFilter.ADVANCE,
      });
    }
    if (
      permissions.some((per) =>
        [
          EPerActSetting.VIEW_TAG_SETTING,
          EPerActSetting.UPDATE_TAG_SETTING,
        ].includes(per as EPerActSetting),
      )
    ) {
      this.getTag();
      this.configFilters.push({
        type: ETypeFilter.SELECT,
        name: 'tagIds',
        placeholder: 'Tag',
        options: [],
        bindLabel: 'name',
        bindValue: 'id',
        clearable: true,
        searchable: true,
        multiple: true,
        botherType: EBotherAdvanceBasicFilter.ADVANCE,
      });
    }
  }

  private hasPermission(permissions: any[], permission: any): boolean {
    return permissions?.some((per) => per === permission);
  }

  showModalMultipleAction(action: {value: ETypeBulkUpdate}) {
    const modalRef = this.modalService.show(ModalAssignTeamComponent, {
      class: 'modal-dialog-centered',
      initialState: {
        action: action.value,
      },
    });
    modalRef.content?.assignTeams.subscribe((data) => {
      if (data) {
        const payload = {
          taskIds: this.taskChecked,
          teams: data.teams,
        };
        this.autoTaskService.task.bulkUpdate(payload).subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.toastrService.success('Gán nhân viên phụ trách thành công');
              this.getDataSource();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
      }
    });
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
            if (
              configFilter.type === ETypeFilter.SELECT ||
              configFilter.type === ETypeFilter.POPOVER ||
              configFilter.type === ETypeFilter.DATE
            ) {
              if (configFilter.name === 'sort') {
                configFilter.value =
                  currentActiveViewMode?.options[configFilter.name!] ||
                  '-createdAt';
                this.dataSource.paramsQuery.sort =
                  currentActiveViewMode?.options[configFilter.name!] ||
                  ('-createdAt' as string);
              } else {
                configFilter.value =
                  currentActiveViewMode?.options[configFilter.name!];
                objFilterQuery[configFilter.name!] = configFilter.value;
              }
            }
          });

          this.configButtons.forEach((configButton) => {
            if (configButton.type === ETypeButton.TOGGLE) {
              configButton.value =
                currentActiveViewMode?.options[configButton.name!];
              objFilterQuery[configButton.name!] = configButton.value;
            }
          });
          // update dataSource.paramsQuery.filter by objFilterQuery
          this.dataSource.paramsQuery.filter = JSON.stringify(objFilterQuery);
          this.getDataSource(true);
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

  calculateTimeLeft(date: Date, taskChain: ITaskChain) {
    let data = {
      timeLeft: '',
      typeOverDeadline: 'notOver',
    };
    const subDate = calculateTime(date, new Date(), 'metrics') as {
      days?: number;
      hours?: number;
      minutes?: number;
    };
    const isCloseTask = taskChain?.status === ETaskChainType.CLOSED;
    if (subDate.days === 0 && subDate.hours === 0 && subDate.minutes === 0) {
      data.typeOverDeadline = 'now';
    } else if (moment().isAfter(date)) {
      data.typeOverDeadline = 'over';

      data.timeLeft = calculateTime(
        isCloseTask ? taskChain.updatedAt : new Date(),
        date,
      ) as string;
    }
    if (data.typeOverDeadline !== 'over') {
      data.timeLeft = calculateTime(
        date,
        isCloseTask ? taskChain.updatedAt : new Date(),
      ) as string;
    }

    return data;
  }
  changeSort(type: string) {
    if (this.sort[type] == 0) {
      this.sort[type] = 1;
    } else if (this.sort[type] == 1) {
      this.sort[type] = -1;
    } else if (this.sort[type] == -1) {
      this.sort[type] = 0;
    }
    this.getDataSource();
  }
  getDataSource(isReset?: boolean) {
    if (isReset) {
      this.dataSource.paramsQuery.page = 1;
    }
    let params = {...this.dataSource.paramsQuery};

    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });
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
        takeUntil(this.destroy$),
        finalize(() => (this.sources.loading = false)),
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
        takeUntil(this.destroy$),
        finalize(() => (this.tags.loading = false)),
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
      if (!this.permission.edit) {
        return;
      }
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
  handleCopy(task: ITask) {
    const modalClone = this.modalService.show(ModalCloneComponent, {
      initialState: {
        task: task,
      },
      ignoreBackdropClick: true,
      keyboard: false,
    });
    modalClone.content?.submitEvent.subscribe((res) => {
      if (res) {
        modalClone.hide();
        this.cloneTask(task.id, res);
      }
    });
  }
  cloneTask(id: string, options: string[]) {
    this.autoTaskService.task
      .clone(id, {
        options: options,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.dataSource.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.commonService.handleResSuccess('clone');
          this.getDataSource();
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }
  handleToggleAction(data: {name?: string; value: boolean}) {
    const obj = JSON.parse(this.dataSource.paramsQuery.filter || '{}');
    obj[data.name!] = data.value;
    this.dataSource.paramsQuery.filter = JSON.stringify(obj);
    const configButton = this.configButtons.find((cf) => cf.name === data.name);
    configButton!.value = data.value;

    if (!isEqual(obj, this.currentActiveViewMode?.options)) {
      this.handleViewModeChange(true);
      return;
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
  handleViewCustomer(item: ITask) {
    let url = `${environment.urlDomain}/${this.currentBiz}/customers/${item.leadDeal?.id}`;
    window.open(url, '_blank');
  }
  onRemoveAssignCounselor(value: any) {
    const payload = {
      taskIds: this.taskChecked,
      teams: [],
    };
    this.autoTaskService.task
      .bulkUpdate(payload)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastrService.success('Bỏ gán nhân viên phụ trách thành công');
            this.getDataSource();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }
  startResizing(event: MouseEvent) {
    const header = event.currentTarget as HTMLElement;
    this.startX = event.pageX;
    this.startWidth = header.offsetWidth;
    this.resizing = true;
    this.resizingColumn = header;

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = (event: MouseEvent) => {
    if (this.resizing && this.resizingColumn) {
      const newWidth = this.startWidth + event.pageX - this.startX;
      this.resizingColumn.style.width = newWidth + 'px';
    }
  };

  handleMouseUp = () => {
    this.resizing = false;
    this.resizingColumn = null;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };
  showModalOrderableTable() {
    const modalRef = this.modalService.show(OrderableTableComponent, {
      initialState: {
        typeColumn: 'columnDashboardAutoTask',
      },
      class: 'modal-opacity-4 modal-lg modal-dialog-centered modal-default',
    });

    modalRef.content?.triggerColumnChange
      .pipe()
      .subscribe((sequenceColumns: IColumns[]) => {
        this.dataColumnsShow = [...sequenceColumns];
      });
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
      errorState:
        'Cẩn trọng với thao tác xoá bản ghi. Các module khác đang sử dụng dữ liệu\n' +
        '        của bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDelete(value);
    });
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.dataSource.paramsQuery.q = term;
    this.getDataSource(true);
  }
  onPopoverFilter(data: {value?: string | string[]; name: string}) {
    if (data.value) {
      this.dataSource.paramsQuery.sort = data.value;
    } else {
      delete this.dataSource.paramsQuery.sort;
    }
    const configFilterPopover = this.configFilters.find(
      (filter) => filter.name === 'sort',
    );
    if (configFilterPopover) {
      configFilterPopover.value = data.value;
    }
    if (data.value !== this.currentActiveViewMode?.options?.sort) {
      this.handleViewModeChange(true);
    }
  }
  onSelectFilter(data: {value?: string | string[]; name: string}) {
    try {
      const {value, name} = data;
      if (name !== 'sort') {
        const filter = this.dataSource.paramsQuery?.filter || '{}';
        let obj = JSON.parse(filter);
        if (Array.isArray(value) && value.length > 0) {
          obj[name] = value;
        } else if (
          typeof value === 'string' &&
          (!!value || Number(value) === 0)
        ) {
          obj[name] = value;
          // if (name === 'chainActId') {
          //   const selectedChains = this.actionChains.rows.filter((chain) =>
          //     value.includes(chain.id),
          //   );
          //   const actions = selectedChains?.reduce((acc: any[], chain) => {
          //     return uniqBy(
          //       [
          //         ...acc,
          //         ...chain?.actionResults?.map((chainActResult) => {
          //           return chainActResult.action;
          //         }),
          //       ],
          //       'id',
          //     );
          //   }, []);
          //   const configFilterAction = this.configFilters.find(
          //     (filter) => filter.name === 'actionIds',
          //   );
          //   if (configFilterAction) {
          //     configFilterAction.options = actions?.filter(
          //       (actions) => !!actions,
          //     );
          //   }
          // }
        } else {
          delete obj[name];
          if (name === 'chainActIds') {
            const configFilterAction = this.configFilters.find(
              (filter) => filter.name === 'actionIds',
            );
            if (configFilterAction) {
              configFilterAction.options = this.actions.rows;
            }
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
  onPickerDateFilter(data: {value?: IDateRange | Date; name: string}) {
    try {
      const {value, name} = data;
      const filter = this.dataSource.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      const hValue = value as IDateRange;
      if (name === name) {
        if (hValue?.fromDate && hValue?.toDate) {
          obj[name] = [
            moment(hValue.fromDate).startOf('day').toISOString(),
            moment(hValue.toDate).endOf('day').toISOString(),
          ];
        } else {
          delete obj[name];
        }

        this.dataSource.paramsQuery.filter = JSON.stringify(obj);
        if (
          !isEqual(obj?.[name], this.currentActiveViewMode?.options?.[name])
        ) {
          this.handleViewModeChange(true);
          return;
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
