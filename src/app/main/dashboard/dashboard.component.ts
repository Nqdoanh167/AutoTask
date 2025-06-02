import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { ETypeBulkUpdate, ETypeButton, ETypeFilter } from '@app/types/common';
import { Biz, BizRole, ERole, IColumns, IDateRange, ITag, Order, User } from '@app/types/viewmodels';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalUpdateTaskComponent } from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import { ETaskChainType, ITask, ModifiedUserUnit } from '@app/types/flow';
import { isEqual } from 'lodash';
import { EPerActTask, EPerActType, EScreens, ISetting } from '@app/types/setting';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ModalAssignTeamComponent } from './content-modal/multiple-action/modal-assign-team/modal-assign-team.component';
import { environment } from 'src/environments/environment';
import { OrderableTableComponent } from '@app/share/orderable-table/orderable-table.component';
import { listColumnsDashboardDefault } from '@app/variable';
import {
  ranges,
  TASK_MULTIPLE_ACTIONS,
} from '@main/dashboard/dashboard-variables';
import { DashboardCheckPermission } from '@main/dashboard/dashboard-check-permission';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ModalAssignTeamV2Component } from './content-modal/multiple-action/modal-assign-team-v2/modal-assign-team-v2.component';
import moment from 'moment';
import { ETabTaskDetail } from '@app/types/task';

@Component({
  selector: 'app-task',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent extends DashboardCheckPermission implements OnInit, OnDestroy {
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;
  @ViewChild('virtualScroll') virtualScroll?: CdkVirtualScrollViewport;

  private startX: number = 0;
  private startWidth: number = 0;
  private resizing: boolean = false;
  private resizingColumn: HTMLElement | null = null;

  public isOpenBackDrop: boolean = false;
  public multipleAction = TASK_MULTIPLE_ACTIONS;
  public dataColumnsShow!: IColumns[];
  public selectedTasks: ITask[] = [];

  protected readonly EScreens = EScreens;
  protected readonly ETaskChainType = ETaskChainType;
  protected readonly ranges = ranges;

  filter = {
    tag: null
  }

  checkbox: any = {
    branchId: null,
    branchIds: [],
    receiverAllBranchIds: [],   // Danh sách id của tất cả các bộ phận nhận đơn hàng từ SOcket
    branchDisplayInputText: '',
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
  };
  setting!: ISetting;
  constructor(
    private readonly modalService: BsModalService,
    private readonly route: ActivatedRoute,
    private readonly toastrService: ToastrService,
    private readonly router: Router,
  ) {
    super();
    this.autoTaskService.currentSetting.pipe(takeUntil(this.destroy$)).subscribe((setting) => { this.setting = setting; });

    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          this.currentBiz = biz;
          const configFilterStaff = this.configFilters.find(
            (filter) => filter.name === 'teamId',
          );
          if (configFilterStaff) {
            configFilterStaff.options = [
              { name: 'Chưa gán nhân sự phụ trách', id: 'NONE' },
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
    console.log('ngOnInit');
    this.setupCheckbox();

    this.clickLoadData('tags');
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

  setupCheckbox() {
    if (this.currentBiz) {
      this.checkbox.listRoles = this.currentBiz.user.roles?.filter((r: BizRole) => this.setting?.roles?.includes(r.id) && r.isActive) || [];
      this.checkbox.listUsers = this.currentBiz.users.filter(u => u.isActive);
      this.checkbox.listBranches = this.authService.getBranchPer();
    }
  }


  setupCheckboxBranch(isChangeTab: boolean = false) {
    console.log('setupCheckboxBranch');
    this.checkbox.branchIds = [];

    this.checkbox.listBranches = this.authService.getBranchPer().map(branch => {
      this.checkbox.branchIds.push(branch.id);
      if (branch.departments?.length) {
        branch.children = branch.departments.map(department => {
          if (branch.role !== 'OWNER') {
            this.checkbox.branchIds.push(department.id);
          }
          if (department.teams?.length) {
            if (department.role !== 'OWNER') {
              this.checkbox.branchIds.push(...department.teams.map(t => t.id));
            }
            department.children = department.teams;
          }
          return department;
        })
      }
      return branch;
    });

    this.checkbox.listRoles = this.currentBiz?.user.roles?.filter((r: BizRole) => this.setting.roles.includes(r.id) && r.isActive) || [];
    if (!this.currentBiz?.user.branchIds?.length) {
      this.toastrService.warning('Bạn chưa ở trong chi nhánh nào. Vui lòng liên hệ chủ Biz để được cấp quyền vào chi nhánh quản lý đơn hàng của mình!')
      return;
    }
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    console.log('objFilterQuery', objFilterQuery);

    if (objFilterQuery.branchIds && objFilterQuery.branchIds.length) {
      // Ví dụ có nhiều id chi nhánh thì hàm detectFilterBranchIds sẽ trả về danh sách các chi nhánh, phòng ban, đội nhóm mà user thỏa mãn
      const detectBranchFilter = this.authService.detectFilterBranchIds(objFilterQuery.branchIds);
      // console.log('detectBranchFilter', detectBranchFilter);
      if (detectBranchFilter.nestedIds?.length)
        this.checkbox.branchIds = detectBranchFilter.nestedIds.flat();
    } else if (isChangeTab && this.isViewAllTask()) {
      this.checkbox.branchIds = []
    }


    // console.log('this.checkbox', this.checkbox);
    this.changeBranch({
      branchIds: this.checkbox.branchIds,
      isReload: true,
      isChangeTab
    });

  }

  changeBranch({ branchIds = [], isReload = false, isChangeTab = false }: { branchIds: string[], isReload?: boolean, isChangeTab?: boolean }) {
    this.checkbox.branchIds = branchIds;
    this.checkbox.receiverAllBranchIds = [];   // Chỉ dùng cho trường hợp tạo đơn hàng, toàn bộ ID sẽ tiếp nhận đơn hàng
    this.checkbox.userIds = [];
    this.checkbox.roleIds = [];
    if (isChangeTab) {
      const filterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
      if (filterQuery.teamRoles?.length) this.checkbox.roleIds = (filterQuery.teamRoles || []).filter((r: string) => this.currentBiz?.user?.roleIds?.includes(r)) || [];
      if (filterQuery.teamId?.length) this.checkbox.userIds = filterQuery.teamId || [];
    }

    let detectFilter: any = {};
    if (!this.isViewAllTask()) {
      // Nếu không chọn chi nhánh nào thì gắn mặc định toàn chi nhánh
      if (!branchIds?.length) {
        // branchIds = this.currentBiz?.user.branchIds || [];
        // this.checkbox.branchIds = branchIds;
        this.setupCheckboxBranch();
        return
      }

      let userIds = [this.currentUser?.id];
      let checkboxUserIds = [this.currentUser?.id];
      let isFullPerBranches = true;

      detectFilter = this.authService.detectFilterBranchIds(branchIds);

      detectFilter.rows.forEach((row: any) => {
        if (this.authService.isPerBranch(row.id, 'VIEW_TASK_SAME_LEVEL')) {
          this.currentBiz?.users.filter(u => {
            if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id)) checkboxUserIds.push(u.id)
          });
        } else {
          isFullPerBranches = false;
        }
      });
      // Nếu có quyền View_all trên toàn bộ branch => k lọc userId mặc định nữua
      if (isFullPerBranches) userIds = [];
      else checkboxUserIds = [this.currentUser?.id];
      checkboxUserIds = Array.from(new Set(checkboxUserIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) => checkboxUserIds.includes(u.id));
      // Nếu filter có userIds thì lọc lại danh sách user có ko thì cho vào danh sách cho phép truy vấn
      if (this.checkbox.userIds?.length) {
        this.checkbox.userIds.forEach((uId: string) => {
          const hasUser = this.checkbox.listUsers.some((u: User) => u.id === uId);
          if (hasUser) {
            userIds.push(uId);
          }
        });
      }
      this.checkbox.userIds = Array.from(new Set(userIds));
    } else if (branchIds.length) {
      let userIds: string[] = [];
      detectFilter = this.authService.detectFilterBranchIds(branchIds);
      console.log('detectFilter', detectFilter);
      detectFilter.rows.forEach((row: any) => {
        this.currentBiz?.users.forEach((u: User) => {
          if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id)) userIds.push(u.id);
        });
      })
      userIds = Array.from(new Set(userIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) => userIds.includes(u.id));
    }

    // Gán ID mặc định khi tạo đơn sẽ ăn theo branch này
    if (this.checkbox.branchIds.length) {
      this.checkbox.branchId = this.checkbox.branchIds[0];
    }
    // Detect toàn bộ ID của chi nhánh, phòng ban, đội nhóm sẽ nhận đơn hàng từ SOCKET
    detectFilter.rows?.forEach((row: any) => {
      this.checkbox.receiverAllBranchIds.push(row.id);
      if (row.departments?.length) {
        row.departments.forEach((department: any) => {
          this.checkbox.receiverAllBranchIds.push(department.id);
          if (department.teams?.length) {
            department.teams.forEach((team: any) => {
              this.checkbox.receiverAllBranchIds.push(team.id);
            })
          }
        }
        )
      }
      if (row.teams?.length) {
        row.teams.forEach((team: any) => {
          this.checkbox.receiverAllBranchIds.push(team.id);
        })
      }
    })


    // Cập nhật text hiển thị của checkbox chi nhánh, phòng ban, đội nhóm => X CN, Y PB, Z ĐN
    this.checkbox.branchDisplayInputText = 'Lựa chọn';
    const lengthBranch = detectFilter.branchIds?.length;
    const lengthDepartment = detectFilter.departmentIds?.length;
    const lengthTeam = detectFilter.teamIds?.length;
    if (lengthBranch && lengthDepartment && lengthTeam) {
      this.checkbox.branchDisplayInputText = `${lengthBranch} CN, ${lengthDepartment} PB, ${lengthTeam} ĐN`;
    }
    else if ([lengthBranch, lengthDepartment, lengthTeam].filter(t => t > 0).length > 1) {
      const strValue = [];
      if (lengthBranch) strValue.push(`${lengthBranch} CN`);
      if (lengthDepartment) strValue.push(`${lengthDepartment} PB`);
      if (lengthTeam) strValue.push(`${lengthTeam} ĐN`);
      this.checkbox.branchDisplayInputText = strValue.join(', ');

    } else {
      this.checkbox.branchDisplayInputText = '';
      if (lengthBranch) this.checkbox.branchDisplayInputText += `${lengthBranch} chi nhánh`;
      if (lengthDepartment) this.checkbox.branchDisplayInputText += `${lengthDepartment} phòng ban`;
      if (lengthTeam) this.checkbox.branchDisplayInputText += `${lengthTeam} đội nhóm`;
    }
    // End check text hiể thị
    // if (isReload) {
    //   this.getDataSource(true)
    // } else {
    // }
    this.handleChangeCheckbox(isReload);
  }
  isViewAllTask() {
    return (
      this.currentBiz?.user?.role === ERole.OWNER ||
      [ERole.OWNER].includes(this.currentViewer?.role!)
    );
  }
  changeRole(roleIds: string[]) {
    console.log('changẻRole', roleIds);
    this.checkbox.roleIds = roleIds;
    let isFullPerBranches = true;
    let isFullPermission = this.isViewAllTask();
    if (this.checkbox.branchIds.length) {
      let checkboxUserIds = [this.currentUser?.id];
      this.authService.detectFilterBranchIds(this.checkbox.branchIds).rows.forEach(row => {
        if (this.authService.isPerBranch(row.id, 'VIEW_TASK_SAME_LEVEL') || isFullPermission) {
          this.currentBiz?.users.forEach((u: User) => {
            if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id)) checkboxUserIds.push(u.id);
          });
        } else {
          isFullPerBranches = false;
        }
      })
      checkboxUserIds = Array.from(new Set(checkboxUserIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) => checkboxUserIds.includes(u.id));
    }

    let userIds: string[] = [];
    if (!isFullPermission) {
      userIds = [this.currentUser?.id!]
      if (isFullPerBranches) userIds = [];
    }

    if (roleIds.length) {
      this.checkbox.listUsers = this.checkbox.listUsers.filter((u: User) => roleIds.some(rId => u.roleIds?.includes(rId)) || (isFullPermission && u.role === 'OWNER'));
    }
    this.checkbox.userIds = userIds;
    this.handleChangeCheckbox();
  }
  changeUser(userIds: string[]) {
    this.checkbox.userIds = userIds;

    if (!this.checkbox.userIds.length && !this.isViewAllTask()) {
      let isFullPerBranches = true;
      this.checkbox.branchIds.forEach((branchId: string) => {
        if (!this.authService.isPerBranch(branchId, 'VIEW_TASK_SAME_LEVEL')) {
          isFullPerBranches = false;
        }
      })
      if (!isFullPerBranches) {
        this.checkbox.userIds = [this.currentUser?.id];
      }
    }
    this.handleChangeCheckbox();
  }
  handleChangeCheckbox(isReload: boolean = false) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    // console.log('handleChangeCheckbox objFilterQuery', objFilterQuery);
    delete objFilterQuery.branchIds
    delete objFilterQuery.teamRoles
    delete objFilterQuery.teamId
    if (this.checkbox.branchIds?.length) objFilterQuery.branchIds = this.checkbox.branchIds || [];
    if (this.checkbox.roleIds?.length) objFilterQuery.teamRoles = this.checkbox.roleIds || [];
    if (this.checkbox.userIds?.length) objFilterQuery.teamId = this.checkbox.userIds || [];

    if (isReload) {
      this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
      this.getDataSource(true);
      return;
    }

    if (
      isEqual(objFilterQuery.branchIds, this.currentActiveViewMode?.options?.branchIds)
      && isEqual(objFilterQuery.teamRoles, this.currentActiveViewMode?.options?.teamRoles)
      && isEqual(objFilterQuery.teamId, this.currentActiveViewMode?.options?.teamId)
    ) {
      return;
    }
    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);

    this.handleViewModeChange(true);
  }

  getTagById(id: string) {
    if (id) return this.tags.rows.find((tag: ITag) => tag.id === id);
    return null;
  }

  showModalMultipleAction(action: { value: ETypeBulkUpdate }) {
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

  // isInit: Khi load
  handleActiveViewMode() {
    try {
      // Subscribe to currentActiveViewMode to handle changes
      this.autoTaskService.currentActiveViewMode
        .pipe(
          distinctUntilChanged(isEqual),
          filter((currentActiveViewMode) => !!currentActiveViewMode),
          takeUntil(this.destroy$),
        )
        .subscribe((currentActiveViewMode) => {
          console.log('currentActiveViewMode', currentActiveViewMode);
          this.currentActiveViewMode = currentActiveViewMode;
          if (this.currentActiveViewMode?.isChangeTab) {
            this.item.isFirstRequest = true;
            this.item.paramsQuery.page = 1;
            this.item.rows = [];
          }
          this.item.paramsQuery.filter = '{}';
          const objFilterQuery = JSON.parse(
            this.item.paramsQuery.filter || '{}',
          );
          Object.keys(this.currentActiveViewMode?.options || {}).forEach((key) => {
            if (this.currentActiveViewMode?.options[key]) {
              objFilterQuery[key] = this.currentActiveViewMode?.options[key];
            }
          });

          this.filter.tag = this.currentActiveViewMode?.options?.tags?.[0] || null;

          // loop configFilters and update by value of object options in currentActiveViewMode
          this.configFilters.forEach((configFilter) => {
            if (
              configFilter.type === ETypeFilter.SELECT ||
              configFilter.type === ETypeFilter.POPOVER ||
              configFilter.type === ETypeFilter.DATE
            ) {
              if (configFilter.name === 'sort') {
                configFilter.value = this.currentActiveViewMode?.options[configFilter.name!] || '-createdAt';
                this.item.paramsQuery.sort = this.currentActiveViewMode?.options[configFilter.name!] || ('-createdAt' as string);
              } else {
                configFilter.value = this.currentActiveViewMode?.options[configFilter.name!];
                objFilterQuery[configFilter.name!] = configFilter.value;
              }
            }
          });

          this.configButtons.forEach((configButton) => {
            if (configButton.type === ETypeButton.TOGGLE) {
              configButton.value =
                this.currentActiveViewMode?.options[configButton.name!];
              objFilterQuery[configButton.name!] = configButton.value;
            }

            if (configButton.type === ETypeButton.DEFAULT) {
              configButton.isActive =
                this.currentActiveViewMode?.options[configButton.name!];
              objFilterQuery[configButton.name!] = configButton.isActive;
            }
          });

          // update dataSource.paramsQuery.filter by objFilterQuery
          this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
          if ((this.item.isFirstRequest || this.currentActiveViewMode?.isChangeTab)) {
            this.setupCheckboxBranch(this.currentActiveViewMode?.isChangeTab);
          } else {
            this.getDataSource(true);

          }
          this.item.isFirstRequest = false;
        });
    } catch (e) {
      console.log(e);
    }
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

  handleQueryParam(data: any, name: string) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    if (name === 'tags') {
      console.log('data', data);
      if (data) objFilterQuery[name] = [data];
      else delete objFilterQuery[name];
    }

    if (name === 'createdAt') {
      const hValue = data as IDateRange;
      if (hValue?.fromDate && hValue?.toDate) {
        objFilterQuery.createdAt = [
          moment(hValue.fromDate).startOf('day').toISOString(),
          moment(hValue.toDate).endOf('day').toISOString(),
        ];
      } else delete objFilterQuery.createdAt;
    }

    if (name === 'branchIds' || name === 'teamRoles' || name === 'teamId') {
      if (data?.length) {
        objFilterQuery[name] = data;
      } else delete objFilterQuery[name];
    }
    if (
      isEqual(
        objFilterQuery?.[name],
        this.currentActiveViewMode?.options?.[name],
      )
    ) {
      return;
    }

    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
    console.log('this.item.paramsQuery.filter', this.item.paramsQuery.filter);

    this.handleViewModeChange(true);
    // this.getDataSource(true);
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
  }

  override pageChanged(dataPage: { page: number; limit: number }): void {
    const { page, limit } = dataPage;
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
    let url = `${environment.urlDomain}/${this.currentBiz?.alias}/sale-center/?code=${order.code}`;
    window.open(url, '_blank');
  }

  handleViewCustomer(item: ITask) {
    let url = `${environment.urlDomain}/${this.currentBiz?.alias}/customers/${item.leadDeal?.id}`;
    window.open(url, '_blank');
  }

  handleViewTabOrder(item: ITask) {
    const currentQueryParams = this.route.snapshot.queryParams;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...currentQueryParams,
        id: item.id,
      },
      fragment: ETabTaskDetail.ORDER,
      replaceUrl: true,
    });
  }

  startResizing(event: MouseEvent) {
    console.log('event', event);
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

    modalRef.content?.assignTeams.subscribe(() => {
      this.getDataSource();
    });
    modalRef.onHide?.pipe(takeUntil(this.destroy$));
  }

  handleGetData(data: any) {
    console.log({ data });
  }
}
