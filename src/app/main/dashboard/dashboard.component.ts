import {Component, OnDestroy, OnInit} from '@angular/core';
import {distinctUntilChanged, filter, finalize, takeUntil} from 'rxjs';
import {ETypeBulkUpdate, ETypeButton, ETypeFilter} from '@app/types/common';
import {IColumns, IDateRange} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {calculateTime} from '@app/utils/common';
import {ModalUpdateTaskComponent} from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import {
  ETaskChainType,
  ITask,
  ITaskChain,
  ModifiedUserUnit,
} from '@app/types/flow';
import moment from 'moment/moment';
import {cloneDeep, isEqual} from 'lodash';
import {
  EPerActTask,
  EPerActType,
  EScreens,
  IViewModeDto,
} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {ModalAssignTeamComponent} from './content-modal/multiple-action/modal-assign-team/modal-assign-team.component';
import {environment} from 'src/environments/environment';
import {OrderableTableComponent} from '@app/share/orderable-table/orderable-table.component';
import {listColumnsDashboardDefault} from '@app/variable';
import {ModalCloneComponent} from './content-modal/multiple-action/modal-clone/modal-clone.component';
import {
  ESpecialQueryTaskKey,
  TASK_MULTIPLE_ACTIONS,
} from '@main/dashboard/dashboard-variables';
import {DashboardCheckPermission} from '@main/dashboard/dashboard-check-permission';

@Component({
  selector: 'app-task',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent
  extends DashboardCheckPermission
  implements OnInit, OnDestroy
{
  private startX: number = 0;
  private startWidth: number = 0;
  private resizing: boolean = false;
  private resizingColumn: HTMLElement | null = null;

  public currentBiz: string = '';
  public multipleAction = TASK_MULTIPLE_ACTIONS;
  public currentActiveViewMode?: IViewModeDto;
  // public dataSource$ = interval(10000)
  //   .pipe(takeUntil(this.destroy$))
  //   .subscribe(() => {
  //     this.dataSource.rows = this.runTimer();
  //   });
  public taskChecked: string[] = [];
  public headerCheckboxState: boolean[] = [];
  public dataColumnsShow!: IColumns[];
  public units = this.autoTaskService.getUserUnits(false);
  public selectedUnits: ModifiedUserUnit[] = [];

  protected readonly EScreens = EScreens;
  protected readonly ETaskChainType = ETaskChainType;

  constructor(
    private readonly modalService: BsModalService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly route: ActivatedRoute,
    private readonly toastrService: ToastrService,
    private readonly router: Router,
  ) {
    super();
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
      if (q['code']) {
        this.handleUpdate(undefined, undefined, q['code']);
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

  override ngOnInit() {
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

  showModalMultipleAction(action: {value: ETypeBulkUpdate}) {
    try {
      const modalRef = this.modalService.show(ModalAssignTeamComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          action: action?.value,
        },
      });
      this.cdr.markForCheck();
      modalRef.content?.assignTeams.subscribe((data) => {
        if (data) {
          const payload = {
            taskIds: this.taskChecked,
            teams: data.teams,
          };
          this.autoTaskService.task.bulkUpdate(payload).subscribe({
            next: (res) => {
              if (res.status === 200) {
                this.toastrService.success(
                  'Gán nhân viên phụ trách thành công',
                );
                this.getDataSource();
              } else {
                this.commonService.handleResErr(res);
              }
            },
            error: (err) => this.commonService.handleErr(err),
          });
        }
      });
      this.selectBatchActions?.handleClearClick();
    } catch (e) {
      console.log(e);
    }
  }

  stateChecked(item: ITask, event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.taskChecked.push(item.id);
    } else {
      this.taskChecked = this.taskChecked.filter((id) => id !== item.id);
    }

    this.headerCheckboxState[this.item.paramsQuery.page] = this.item.rows.every(
      (tId) => this.taskChecked.includes(tId.id),
    );
  }

  toggleAllRows(event: any): void {
    const checked = event.target.checked;

    this.headerCheckboxState[this.item.paramsQuery.page] = checked;

    this.item.rows.forEach((row) => {
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
            this.item.paramsQuery.filter || '{}',
          );
          if (currentActiveViewMode?.options?.branchIds) {
            objFilterQuery.branchIds = currentActiveViewMode?.options.branchIds;
            this.selectedUnits = this.autoTaskService.findUnitsByIds(
              currentActiveViewMode?.options.branchIds || [],
            );
          }
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
                this.item.paramsQuery.sort =
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
          this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
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
        ...JSON.parse(this.item.paramsQuery.filter || '{}'),
        sort: this.item.paramsQuery.sort,
      },
    };
    this.autoTaskService.setCurrentActiveViewMode(changedTab);
  }

  runTimer() {
    return cloneDeep(this.item.rows);
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

  handleClearQueryParams() {
    this.router.navigate([], {
      queryParams: {
        id: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  handleUpdate(value?: any, taskId?: string, code?: string) {
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
          code,
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
        finalize(() => (this.item.loading = false)),
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

  override handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  handleToggleAction(data: {name?: string; value: boolean}) {
    const obj = JSON.parse(this.item.paramsQuery.filter || '{}');
    obj[data.name!] = data.value;
    this.item.paramsQuery.filter = JSON.stringify(obj);
    const configButton = this.configButtons.find((cf) => cf.name === data.name);
    configButton!.value = data.value;

    if (!isEqual(obj, this.currentActiveViewMode?.options)) {
      this.handleViewModeChange(true);
      return;
    }
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

  onPopoverFilter(data: {value?: string | string[]; name: string}) {
    if (data.value) {
      this.item.paramsQuery.sort = data.value;
    } else {
      delete this.item.paramsQuery.sort;
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

  override onSelectFilter(data: {value?: string | string[]; name: string}) {
    try {
      const {value, name} = data;
      if (name !== 'sort') {
        const filter = this.item.paramsQuery?.filter || '{}';
        let obj = JSON.parse(filter);
        if (Array.isArray(value) && value.length > 0) {
          obj[name] = value;
        } else if (
          typeof value === 'string' &&
          (!!value || Number(value) === 0)
        ) {
          obj[name] = value;
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
        this.item.paramsQuery.filter = JSON.stringify(obj);
        if (!isEqual(obj, this.currentActiveViewMode?.options)) {
          this.handleViewModeChange(true);
          return;
        }
      } else {
        if (value) {
          this.item.paramsQuery.sort = value;
        } else {
          delete this.item.paramsQuery.sort;
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
      const filter = this.item.paramsQuery?.filter || '{}';
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

        this.item.paramsQuery.filter = JSON.stringify(obj);
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

  handleChangeUnits(event: any) {
    const ids: string[] = [];
    this.selectedUnits.forEach((unit) => {
      ids.push(unit?.team || unit?.department || unit?.id || '');
    });
    this.onSelectFilter({
      name: ESpecialQueryTaskKey.BRANCH_IDS,
      value: ids.filter((id) => !!id),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
