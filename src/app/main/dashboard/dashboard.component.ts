import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {distinctUntilChanged, filter, finalize, takeUntil} from 'rxjs';
import {ETypeBulkUpdate, ETypeButton, ETypeFilter} from '@app/types/common';
import {IColumns, IDateRange, Order} from '@app/types/viewmodels';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalUpdateTaskComponent} from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import {ETaskChainType, ITask, ModifiedUserUnit} from '@app/types/flow';
import moment from 'moment/moment';
import {isEqual} from 'lodash';
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
import {NgSelectComponent} from '@ng-select/ng-select';
import {ModalAssignTeamV2Component} from './content-modal/multiple-action/modal-assign-team-v2/modal-assign-team-v2.component';

@Component({
  selector: 'app-task',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent
  extends DashboardCheckPermission
  implements OnInit, OnDestroy
{
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;

  private startX: number = 0;
  private startWidth: number = 0;
  private resizing: boolean = false;
  private resizingColumn: HTMLElement | null = null;

  public isOpenBackDrop: boolean = false;
  public multipleAction = TASK_MULTIPLE_ACTIONS;
  public currentActiveViewMode?: IViewModeDto;
  public dataColumnsShow!: IColumns[];
  public units = this.autoTaskService.getUserUnits(false);
  public selectedUnits: ModifiedUserUnit[] = [];
  public selectedTasks: ITask[] = [];

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
    // this.handleCheckPermission();
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
    if (!action) return;
    try {
      const modalRef = this.modalService.show(ModalAssignTeamComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          action: action?.value,
        },
      });

      modalRef.content?.assignTeams.subscribe((data) => {
        if (data) {
          const payload = {
            taskIds: this.getRowIds(),
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
            error: (err: any) => this.commonService.handleErr(err),
          });
        }
      });
      this.selectBatchActions?.handleClearClick();
    } catch (e) {
      console.log(e);
    }
  }

  handleActiveViewMode() {
    try {
      this.autoTaskService.currentActiveViewMode
        .pipe(
          distinctUntilChanged(isEqual),
          filter((currentActiveViewMode) => !!currentActiveViewMode),
          takeUntil(this.destroy$),
        )
        .subscribe((currentActiveViewMode) => {
          this.item.paramsQuery.filter = '{}';
          this.selectedUnits = [];
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

            if (configButton.type === ETypeButton.DEFAULT) {
              configButton.isActive =
                currentActiveViewMode?.options[configButton.name!];
              objFilterQuery[configButton.name!] = configButton.isActive;
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

  onApply(e: any) {
    this.handleViewModeChange(true);
  }

  onReset(e: any) {
    this.item.paramsQuery.filter = '{}';
    this.getDataSource(true);
    this.handleViewModeChange(true);
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
    console.log('changedTab', changedTab);
    this.autoTaskService.setCurrentActiveViewMode(changedTab);
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
        code: null,
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
      this.isOpenBackDrop = true;
      const modalUpdate = this.modalService.show(ModalUpdateTaskComponent, {
        initialState: {
          sourceData: value,
          taskId,
          code,
        },
        class: 'modal-xl',
        ignoreBackdropClick: true,
        keyboard: true,
        backdrop: false,
      });
      modalUpdate?.content?.updateSuccess
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.getDataSource();
        });
      modalUpdate?.onHidden?.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.isOpenBackDrop = false;
        this.handleClearQueryParams();
      });
    } catch (e) {
      console.log(e);
    }
  }

  // handleCopy(task: ITask) {
  //   const modalClone = this.modalService.show(ModalCloneComponent, {
  //     initialState: {
  //       task: task,
  //     },
  //     ignoreBackdropClick: true,
  //     keyboard: false,
  //   });
  //   modalClone.content?.submitEvent.subscribe((res) => {
  //     if (res) {
  //       modalClone.hide();
  //       this.cloneTask(task.id, res);
  //     }
  //   });
  // }

  // cloneTask(id: string, options: string[]) {
  //   this.autoTaskService.task
  //     .clone(id, {
  //       options: options,
  //     })
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => (this.item.loading = false)),
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         if (res.status === 200) {
  //           this.toastrService.success('Sao chép tác vụ thành công');
  //           this.getDataSource();
  //         } else {
  //           this.commonService.handleResErr(res);
  //         }
  //       },
  //     });
  // }

  override handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
    if (name === 'orderableTable') {
      this.showModalOrderableTable();
    }
    if (name === 'isHideExecute') {
      const configButton = this.configButtons.find(
        (cf) => cf.name === 'isHideExecute',
      );
      const obj = JSON.parse(this.item.paramsQuery.filter || '{}');
      obj['isHideExecute'] = !configButton?.isActive;
      this.item.paramsQuery.filter = JSON.stringify(obj);
      configButton!.isActive = !configButton?.isActive;
      if (!isEqual(obj, this.currentActiveViewMode?.options)) {
        this.handleViewModeChange(true);
        return;
      }
    }
  }

  // handleToggleAction(data: {name?: string; value: boolean}) {
  //   const obj = JSON.parse(this.item.paramsQuery.filter || '{}');
  //   obj[data.name!] = data.value;
  //   this.item.paramsQuery.filter = JSON.stringify(obj);
  //   const configButton = this.configButtons.find((cf) => cf.name === data.name);
  //   configButton!.value = data.value;

  //   if (!isEqual(obj, this.currentActiveViewMode?.options)) {
  //     this.handleViewModeChange(true);
  //     return;
  //   }
  // }

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
    this.getDataSource();
  }

  handleViewCreatedOrder(order: Pick<Order, 'id' | 'code'>) {
    let url = `${environment.urlDomain}/${this.bizAlias}/sale-center/?code=${order.code}`;
    window.open(url, '_blank');
  }

  handleViewCustomer(item: ITask) {
    let url = `${environment.urlDomain}/${this.bizAlias}/customers/${item.leadDeal?.id}`;
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

  // onDelete(value: any) {
  //   this.autoTaskService.task
  //     .delete(value.id)
  //     .pipe()
  //     .subscribe({
  //       next: (res) => {
  //         if (res.status === 200) {
  //           this.commonService.handleResSuccess('delete');
  //           this.getDataSource();
  //         } else {
  //           this.commonService.handleResErr(res);
  //         }
  //       },
  //       error: (err) => this.commonService.handleErr(err),
  //     });
  // }

  // handleDeleteAction(value: any) {
  //   const title = 'Xóa Tác Vụ';
  //   const description = `Bạn sắp xóa Tác Vụ <b>${
  //     value.name || ''
  //   }</b>, hành động này không thể hoàn tác.`;
  //   const okText = 'Xóa';

  //   const modalContent: IModalConfirmContent = {
  //     title,
  //     description,
  //     okText,
  //     type: 'warning',
  //     modalType: 'advance',
  //     context: value,
  //     errorState:
  //       'Cẩn trọng với thao tác xoá bản ghi. Các module khác đang sử dụng dữ liệu\n' +
  //       '        của bản ghi cũng sẽ bị ảnh hưởng.',
  //   };

  //   this.modalConfirmService.openModal(modalContent, undefined, () => {
  //     this.onDelete(value);
  //   });
  // }

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
      // this.handleViewModeChange(true);
    }

    this.getDataSource(true);
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
        // console.log('filter', this.item.paramsQuery.filter);
        if (!isEqual(obj, this.currentActiveViewMode?.options)) {
          // this.handleViewModeChange(true);
          return;
        }
      } else {
        if (value) {
          this.item.paramsQuery.sort = value;
        } else {
          delete this.item.paramsQuery.sort;
        }
        if (value !== this.currentActiveViewMode?.options?.sort) {
          // this.handleViewModeChange(true);
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
          // this.handleViewModeChange(true);
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

  showModalAssignTeamV2() {
    // Sort rows by createdAt descending
    const rows = this.getCheckRows().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const taskCodes = rows.map((row) => row.code).filter(Boolean) as string[];
    const taskIds = rows.map((row) => row.id);

    const modalRef = this.modalService.show(ModalAssignTeamV2Component, {
      class: 'modal-dialog-centered modal-lg',
      initialState: {
        action: ETypeBulkUpdate.ASSIGN_TEAM,
        selectedTaskIds: taskIds,
        selectedTaskCodes: taskCodes,
        selectedTasks: rows,
      },
      backdrop: 'static',
    });

    modalRef.content?.assignTeams.subscribe((data) => {
      if (data) {
        this.getDataSource();
      }
    });
    modalRef.onHide?.pipe(takeUntil(this.destroy$));
  }
}
