import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs';
import {
  EBotherAdvanceBasicFilter,
  ETypeBulkUpdate,
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
} from '@app/types/common';
import {
  AccountPublic,
  BizRole,
  ERole,
  IChangePage,
  IColumns,
  IDateRange,
  ITag,
  Order,
  OrderPlatformSource,
  User,
} from '@app/types/viewmodels';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalUpdateTaskComponent} from '@main/dashboard/content-modal/modal-update-task/modal-update-task.component';
import {
  EChainNextActionType,
  ETaskChainType,
  ITask,
  ITaskChain,
  ITaskChainResult,
  ITeam,
} from '@app/types/flow';
import {cloneDeep, isEqual} from 'lodash';
import {
  EPerActTask,
  EPerActType,
  EScreens,
  ISetting,
  UserAcl,
} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {ModalAssignTeamComponent} from './content-modal/multiple-action/modal-assign-team/modal-assign-team.component';
import {environment} from 'src/environments/environment';
import {OrderableTableComponent} from '@app/share/orderable-table/orderable-table.component';
import {listColumnsDashboardDefault} from '@app/variable';
import {
  FORM_EXPORT_EXCEL,
  ranges,
  TASK_FIELD_GROUP_EXPORT_EXCEL,
  TASK_MULTIPLE_ACTIONS,
  TASK_SORT_OPTIONS,
} from '@main/dashboard/dashboard-variables';
import {DashboardCheckPermission} from '@main/dashboard/dashboard-check-permission';
import {NgSelectComponent} from '@ng-select/ng-select';
import {ModalAssignTeamV2Component} from './content-modal/multiple-action/modal-assign-team-v2/modal-assign-team-v2.component';
import moment from 'moment';
import {ETabTaskDetail} from '@app/types/task';
import {ModalCreateOrderComponent} from './content-modal/modal-create-order/modal-create-order.component';
import {ModalExportExcelComponent} from '@app/share/common/modal-export-excel/modal-export-excel.component';
import {ModalImportExcelComponent} from '@app/share/common/modal-import-excel/modal-import-excel.component';
import {ModalDrawTaskComponent} from './content-modal/modal-draw-task/modal-draw-task.component';
import {SocketService} from '@app/services/api/socket.service';
import {ModalDeleteMultiComponent} from './content-modal/multiple-action/modal-delete-multi/modal-delete-multi.component';
import {ModalStopReceiveComponent} from '@app/share/common/modal-stop-receive/modal-stop-receive.component';
import {calculateTime} from '@app/utils/common';
import {ModalCloseMultiTasksComponent} from './content-modal/modal-close-multi-tasks/modal-close-multi-tasks.component';
import {ModalCheckDuplicatedPhoneComponent} from './content-modal/modal-check-duplicated-phone/modal-check-duplicated-phone.component';
import {ModalCloneComponent} from './content-modal/multiple-action/modal-clone/modal-clone.component';

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
  @ViewChild('virtualScroll') virtualScroll?: CdkVirtualScrollViewport;

  private startX: number = 0;
  private startWidth: number = 0;
  private resizing: boolean = false;
  private resizingColumn: HTMLElement | null = null;

  public isOpenBackDrop: boolean = false;
  public multipleAction!: typeof TASK_MULTIPLE_ACTIONS;
  public dataColumnsShow!: IColumns[];
  public selectedTasks: ITask[] = [];

  protected readonly EScreens = EScreens;
  protected readonly ETaskChainType = ETaskChainType;
  protected readonly ranges = ranges;
  public readonly sortOptions = TASK_SORT_OPTIONS;
  public readonly taskConfigButton: IFilterTopButton = {
    name: 'add_new',
    type: ETypeButton.PRIMARY,
    label: 'Thêm',
    icon: './assets/icons/add.svg',
    tooltip: 'Thêm mới tác vụ',
    children: [
      {
        name: 'importExcel',
        type: ETypeButton.DEFAULT,
        icon: './assets/images/icon/importExcel.svg',
        tooltip: 'Thêm từ file Excel',
      },
      {
        name: 'drawTask',
        type: ETypeButton.DEFAULT,
        icon: './assets/images/icon/draw.svg',
        tooltip: 'Rút số',
        isActive: false,
      },
    ],
  };

  filter = {
    tag: null,
    sort: null,
  };

  checkbox: any = {
    branchId: null,
    branchIds: [],
    receiverAllBranchIds: [], // Danh sách id của tất cả các bộ phận nhận đơn hàng từ SOcket
    branchDisplayInputText: '',
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
    branchIcon: './assets/icons/location.svg',
    roleIcon: './assets/icons/role.svg',
    userIcon: './assets/icons/member.svg',
  };
  setting!: ISetting;

  public afterHistory: string[] = [];
  public currentAfterIndex: number = -1;
  public userAcl!: UserAcl;

  get calculateTimeStopReceive() {
    return calculateTime(this.userAcl.nextReceiveTaskDate, new Date());
  }

  get isStopReceive(): boolean {
    return (
      (this.userAcl?.stopReceiveTaskDuration !== 0 &&
        new Date(this.userAcl?.nextReceiveTaskDate!) > new Date()) ||
      this.userAcl?.stopReceiveTaskDuration === -1
    );
  }

  constructor(
    private readonly modalService: BsModalService,
    private readonly route: ActivatedRoute,
    private readonly toastrService: ToastrService,
    private readonly router: Router,
    private readonly socketService: SocketService,
  ) {
    super();
    this.socketService.connect();

    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.setting = setting || {};
      });

    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          this.currentBiz = biz;
          const configFilterStaff = this.configFilters.find(
            (filter) => filter.name === 'createdBy',
          );
          if (configFilterStaff) {
            configFilterStaff.options = [
              {name: 'Hệ thống', id: 'system'},
            ].concat(this.authService.getColleague());
          }
          const configFilterLastExecutedBy = this.configFilters.find(
            (filter) => filter.name === 'lastExecutedBy',
          );
          if (configFilterLastExecutedBy) {
            configFilterLastExecutedBy.options = [
              {name: 'Hệ thống', id: 'system'},
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
      if (q['leadId']) {
        this.handleCreateTaskFromLead(q['leadId']);
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

    //socket
    this.socketService.listen('task/SYNCHRONIZED').subscribe((data) => {
      const taskData = cloneDeep(data.task) as ITask;

      if (this.checkTaskFilter(taskData)) {
        // Những filter sẽ không thêm hoặc cập nhật task
        if (this.item.paramsQuery.q) {
          return;
        }
        const sort = this.item.paramsQuery.sort || '-createdAt';
        if (
          !['createdAt', '-createdAt', '-updatedAt', 'updatedAt'].includes(sort)
        ) {
          return;
        }

        switch (data.actionType) {
          case 'CREATE':
            if (sort === 'createdAt' || sort === 'updatedAt') {
              break;
            }
            this.item.rows = [taskData, ...this.item.rows];
            this.item.total! += 1;
            break;

          case 'UPDATE':
            const task = this.item.rows.find((row) => row.id === taskData.id);
            if (task) {
              Object.assign(task, taskData);
            } else {
              if (sort === 'updatedAt') {
                break;
              }

              if (!this.item.rows.length || sort === '-updatedAt') {
                this.item.rows = [taskData, ...this.item.rows];
                this.item.total! += 1;
                break;
              }

              const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
              const taskTime = new Date(taskData.createdAt);

              const firstTime = new Date(this.item.rows[0].createdAt);
              const lastTime = new Date(
                this.item.rows[this.item.rows.length - 1].createdAt,
              );

              const isBetween =
                sortDirection === 'asc'
                  ? taskTime >= firstTime && taskTime <= lastTime
                  : taskTime <= firstTime && taskTime >= lastTime;

              if (isBetween) {
                const insertIndex = this.item.rows.findIndex((row) => {
                  const rowDate = new Date(row.createdAt);
                  return sortDirection === 'asc'
                    ? rowDate > taskTime
                    : rowDate < taskTime;
                });

                if (insertIndex !== -1) {
                  this.item.rows.splice(insertIndex, 0, taskData);
                  this.item.rows = [...this.item.rows];
                  this.item.total! += 1;
                }
              }
            }
            break;

          default:
            break;
        }
      } else {
        const taskIndex = this.item.rows.findIndex(
          (row) => row.id === taskData.id,
        );
        if (taskIndex !== -1) {
          this.item.rows = this.item.rows.filter(
            (row) => row.id !== taskData.id,
          );
          this.item.total! -= 1;
        }
      }
    });

    this.socketService.listen('app/ACTIVITY_CHECK').subscribe((data) => {
      console.log('app/ACTIVITY_CHECK', data);
    });

    this.socketService.listen('task/DELETED').subscribe((data) => {
      const taskIndex = this.item.rows.findIndex(
        (row) => row.id === data.taskId,
      );
      if (taskIndex !== -1) {
        this.item.rows = this.item.rows.filter((row) => row.id !== data.taskId);
        this.item.total! -= 1;
      }
    });

    this.socketService.listen('task/BULK_DELETED').subscribe((data) => {
      setTimeout(() => {
        this.toastrService.success(
          `Xóa thành công ${data.deletedTasksLength} tác vụ.`,
        );
        this.getDataSource(true);
      }, 1000);
    });
  }

  override ngOnInit() {
    this.setupSocketListeners();
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
    this.permission.viewDuplicatedPhoneConfig = this.hasPermission(
      permissions,
      EPerActTask.VIEW_DUPLICATED_PHONE_CONFIG,
    );
    if (!this.permission.add) {
      this.configButtons[2].hidden = true;
    }
    this.loadUserAclData();

    this.multipleAction = TASK_MULTIPLE_ACTIONS.filter((action) => {
      if (action.value === ETypeBulkUpdate.CLOSE_MULTI_TASK) {
        return this.authService.isOwner();
      }

      return true;
    });
  }

  setupCheckbox() {
    if (this.currentBiz) {
      this.checkbox.listRoles =
        this.currentBiz.user.roles?.filter(
          (r: BizRole) => this.setting?.roles?.includes(r.id) && r.isActive,
        ) || [];
      this.checkbox.listUsers = this.currentBiz.users.filter((u) => u.isActive);
      this.checkbox.listBranches = this.authService.getBranchPer();
    }
  }

  setupCheckboxBranch(isChangeTab: boolean = false) {
    this.checkbox.branchIds = [];

    this.checkbox.listBranches = this.authService
      .getBranchPer()
      .map((branch) => {
        this.checkbox.branchIds.push(branch.id);
        if (branch.departments?.length) {
          branch.children = branch.departments.map((department) => {
            if (branch.role !== 'OWNER') {
              this.checkbox.branchIds.push(department.id);
            }
            if (department.teams?.length) {
              if (department.role !== 'OWNER') {
                this.checkbox.branchIds.push(
                  ...department.teams.map((t) => t.id),
                );
              }
              department.children = department.teams;
            }
            return department;
          });
        }
        return branch;
      });

    this.checkbox.listRoles =
      this.currentBiz?.user.roles?.filter(
        (r: BizRole) => this.setting?.roles?.includes(r.id) && r.isActive,
      ) || [];
    if (!this.currentBiz?.user.branchIds?.length) {
      this.toastrService.warning(
        'Bạn chưa ở trong chi nhánh nào. Vui lòng liên hệ chủ Biz để được cấp quyền vào chi nhánh quản lý đơn hàng của mình!',
      );
      return;
    }
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');

    if (objFilterQuery.branchIds && objFilterQuery.branchIds.length) {
      // Ví dụ có nhiều id chi nhánh thì hàm detectFilterBranchIds sẽ trả về danh sách các chi nhánh, phòng ban, đội nhóm mà user thỏa mãn
      const detectBranchFilter = this.authService.detectFilterBranchIds(
        objFilterQuery.branchIds,
      );
      // console.log('detectBranchFilter', detectBranchFilter);
      if (detectBranchFilter.nestedIds?.length)
        this.checkbox.branchIds = detectBranchFilter.nestedIds.flat();
    } else if (isChangeTab && this.isViewAllTask()) {
      this.checkbox.branchIds = [];
    }

    // console.log('this.checkbox', this.checkbox);
    this.changeBranch({
      branchIds: this.checkbox.branchIds,
      isReload: true,
      isChangeTab,
    });
  }

  changeBranch({
    branchIds = [],
    isReload = false,
    isChangeTab = false,
  }: {
    branchIds: string[];
    isReload?: boolean;
    isChangeTab?: boolean;
  }) {
    this.checkbox.branchIds = branchIds;
    this.checkbox.receiverAllBranchIds = []; // Chỉ dùng cho trường hợp tạo đơn hàng, toàn bộ ID sẽ tiếp nhận đơn hàng
    this.checkbox.userIds = [];
    this.checkbox.roleIds = [];
    if (isChangeTab) {
      const filterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
      if (filterQuery.teamRoles?.length)
        this.checkbox.roleIds =
          (filterQuery.teamRoles || []).filter(
            (r: string) => this.currentBiz?.user?.roleIds?.includes(r),
          ) || [];
      if (filterQuery.teamId?.length)
        this.checkbox.userIds = filterQuery.teamId || [];
    }

    let detectFilter: any = {};
    if (!this.isViewAllTask()) {
      // Nếu không chọn chi nhánh nào thì gắn mặc định toàn chi nhánh
      if (!branchIds?.length) {
        // branchIds = this.currentBiz?.user.branchIds || [];
        // this.checkbox.branchIds = branchIds;
        this.setupCheckboxBranch();
        return;
      }

      let userIds = [this.currentUser?.id];
      let checkboxUserIds = [this.currentUser?.id];
      let isFullPerBranches = true;

      detectFilter = this.authService.detectFilterBranchIds(branchIds);

      detectFilter.rows.forEach((row: any) => {
        if (this.authService.isPerBranch(row.id, 'VIEW_TASK_SAME_LEVEL')) {
          this.currentBiz?.users.filter((u) => {
            if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id))
              checkboxUserIds.push(u.id);
          });
        } else {
          isFullPerBranches = false;
        }
      });
      // Nếu có quyền View_all trên toàn bộ branch => k lọc userId mặc định nữua
      if (isFullPerBranches) userIds = [];
      else checkboxUserIds = [this.currentUser?.id];
      checkboxUserIds = Array.from(new Set(checkboxUserIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) =>
        checkboxUserIds.includes(u.id),
      );
      // Nếu filter có userIds thì lọc lại danh sách user có ko thì cho vào danh sách cho phép truy vấn
      if (this.checkbox.userIds?.length) {
        this.checkbox.userIds.forEach((uId: string) => {
          const hasUser = this.checkbox.listUsers.some(
            (u: User) => u.id === uId,
          );
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
          if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id))
            userIds.push(u.id);
        });
      });
      userIds = Array.from(new Set(userIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) =>
        userIds.includes(u.id),
      );
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
            });
          }
        });
      }
      if (row.teams?.length) {
        row.teams.forEach((team: any) => {
          this.checkbox.receiverAllBranchIds.push(team.id);
        });
      }
    });

    // Cập nhật text hiển thị của checkbox chi nhánh, phòng ban, đội nhóm => X CN, Y PB, Z ĐN
    this.checkbox.branchDisplayInputText = 'Lựa chọn';
    const lengthBranch = detectFilter.branchIds?.length;
    const lengthDepartment = detectFilter.departmentIds?.length;
    const lengthTeam = detectFilter.teamIds?.length;
    if (lengthBranch && lengthDepartment && lengthTeam) {
      this.checkbox.branchDisplayInputText = `${lengthBranch} CN, ${lengthDepartment} PB, ${lengthTeam} ĐN`;
    } else if (
      [lengthBranch, lengthDepartment, lengthTeam].filter((t) => t > 0).length >
      1
    ) {
      const strValue = [];
      if (lengthBranch) strValue.push(`${lengthBranch} CN`);
      if (lengthDepartment) strValue.push(`${lengthDepartment} PB`);
      if (lengthTeam) strValue.push(`${lengthTeam} ĐN`);
      this.checkbox.branchDisplayInputText = strValue.join(', ');
    } else {
      this.checkbox.branchDisplayInputText = '';
      if (lengthBranch)
        this.checkbox.branchDisplayInputText += `${lengthBranch} chi nhánh`;
      if (lengthDepartment)
        this.checkbox.branchDisplayInputText += `${lengthDepartment} phòng ban`;
      if (lengthTeam)
        this.checkbox.branchDisplayInputText += `${lengthTeam} đội nhóm`;
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
      this.authService
        .detectFilterBranchIds(this.checkbox.branchIds)
        .rows.forEach((row) => {
          if (
            this.authService.isPerBranch(row.id, 'VIEW_TASK_SAME_LEVEL') ||
            isFullPermission
          ) {
            this.currentBiz?.users.forEach((u: User) => {
              if (u.role === 'OWNER' || u.flatBranchIds?.includes(row.id))
                checkboxUserIds.push(u.id);
            });
          } else {
            isFullPerBranches = false;
          }
        });
      checkboxUserIds = Array.from(new Set(checkboxUserIds));
      this.checkbox.listUsers = this.currentBiz?.users.filter((u: User) =>
        checkboxUserIds.includes(u.id),
      );
    }

    let userIds: string[] = [];
    if (!isFullPermission) {
      userIds = [this.currentUser?.id!];
      if (isFullPerBranches) userIds = [];
    }

    if (roleIds.length) {
      this.checkbox.listUsers = this.checkbox.listUsers.filter(
        (u: User) =>
          roleIds.some((rId) => u.roleIds?.includes(rId)) ||
          (isFullPermission && u.role === 'OWNER'),
      );
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
      });
      if (!isFullPerBranches) {
        this.checkbox.userIds = [this.currentUser?.id];
      }
    }
    this.handleChangeCheckbox();
  }
  handleChangeCheckbox(isReload: boolean = false) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    // console.log('handleChangeCheckbox objFilterQuery', objFilterQuery);
    delete objFilterQuery.branchIds;
    delete objFilterQuery.teamRoles;
    delete objFilterQuery.teamId;
    if (this.checkbox.branchIds?.length)
      objFilterQuery.branchIds = this.checkbox.branchIds || [];
    if (this.checkbox.roleIds?.length)
      objFilterQuery.teamRoles = this.checkbox.roleIds || [];
    if (this.checkbox.userIds?.length)
      objFilterQuery.teamId = this.checkbox.userIds || [];

    if (isReload) {
      this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
      this.getDataSource(true);
      return;
    }

    if (
      isEqual(
        objFilterQuery.branchIds,
        this.currentActiveViewMode?.options?.branchIds,
      ) &&
      isEqual(
        objFilterQuery.teamRoles,
        this.currentActiveViewMode?.options?.teamRoles,
      ) &&
      isEqual(
        objFilterQuery.teamId,
        this.currentActiveViewMode?.options?.teamId,
      )
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

  getBranch(branch: any): any {
    if (branch?.name) return branch;
    return this.bizBranches?.find((b) => b.id === branch?.id) || null;
  }

  showModalMultipleAction(action: {value: ETypeBulkUpdate}) {
    if (!action) return;
    switch (action.value) {
      case ETypeBulkUpdate.DELETE_MULTI_TASK:
        // if (!this.hasPerDelMultipleTasks()) {
        //   this.toastrService.warning(
        //     'Bạn không có quyền thực hiện thao tác này!',
        //   );
        //   this.selectBatchActions?.handleClearClick();
        //   break;
        // }
        this.showModalDeleteMultiTask(action);
        break;
      case ETypeBulkUpdate.CLOSE_MULTI_TASK:
        if (!this.authService.isOwner()) {
          this.toastrService.warning(
            'Bạn không có quyền thực hiện thao tác này!',
          );
          break;
        }
        this.showModalCloseMultiTask(action);
        break;
      case ETypeBulkUpdate.ASSIGN_TEAM:
        if (!this.hasPerAssignTasks()) {
          this.toastrService.warning(
            'Bạn không có quyền thực hiện thao tác này!',
          );
          break;
        }
        this.showModalAssignTeam(action);
        break;

      case ETypeBulkUpdate.REMOVE_TEAM:
        if (!this.hasPerAssignTasks()) {
          this.toastrService.warning(
            'Bạn không có quyền thực hiện thao tác này!',
          );
          break;
        }
        this.showModalAssignTeam(action);
        break;

      case ETypeBulkUpdate.CLONE_MULTI_TASK:
        this.showModalCloneMultiTask(action);
        break;

      default:
        break;
    }
  }

  showModalCloseMultiTask(action: {value: ETypeBulkUpdate}) {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    if (!action) return;

    const rows = this.getCheckRows();
    const tasksNotClosed = rows.filter((row) => !row.isTaskClosed);

    try {
      const modalRef = this.modalService.show(ModalCloseMultiTasksComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          taskIds: tasksNotClosed.map((row) => row.id),
          selectedTasks: tasksNotClosed,
        },
      });

      modalRef.content?.closeTaskSuccess.subscribe(async (resp) => {
        if (resp?.success && resp?.successIds?.length > 0) {
          await sleep(2000);
          await this.getDataSource();
        }
      });
      this.selectBatchActions?.handleClearClick();
    } catch (e) {
      console.log(e);
    }
  }

  showModalAssignTeam(action: {value: ETypeBulkUpdate}) {
    if (!action) return;
    try {
      const modalRef = this.modalService.show(ModalAssignTeamComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          action: action?.value,
          taskIds: this.getRowIds(),
          selectedTasks: this.getCheckRows(),
        },
      });

      modalRef.content?.assignTeams.subscribe(() => {
        this.getDataSource();
      });
      this.selectBatchActions?.handleClearClick();
    } catch (e) {
      console.log(e);
    }
  }

  showModalCloneMultiTask(action: {value: ETypeBulkUpdate}) {
    if (!action) return;

    try {
      const selectedTaskIds = this.getRowIds();
      if (selectedTaskIds.length > 100) {
        this.toastrService.warning(
          'Bạn chỉ có thể sao chép tối đa 100 tác vụ cùng lúc.',
        );
        this.selectBatchActions?.handleClearClick();
        return;
      }

      const modalRef = this.modalService.show(ModalCloneComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          taskIds: selectedTaskIds,
        },
      });

      modalRef.content?.submitEvent.subscribe((options: string[]) => {
        if (options?.length && selectedTaskIds.length) {
          this.cloneMultiTask(selectedTaskIds, options);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  showModalDeleteMultiTask(action: {value: ETypeBulkUpdate}) {
    if (!action) return;
    if (this.getRowIds().length > 1000) {
      this.toastrService.warning(
        'Bạn chỉ có thể xóa tối đa 1000 tác vụ cùng lúc.',
      );
      this.selectBatchActions?.handleClearClick();
      return;
    }
    try {
      const modalRef = this.modalService.show(ModalDeleteMultiComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          taskIds: this.getRowIds(),
          taskCodes: this.getRowCodes(),
        },
      });
      modalRef.content?.success.subscribe(() => {
        this.handleRefreshRow();
        modalRef.hide();
      });
      this.selectBatchActions?.handleClearClick();
    } catch (e) {
      console.log(e);
    }
  }

  cloneMultiTask(taskIds: string[], options: string[]) {
    if (!taskIds?.length || !options?.length) return;

    this.autoTaskService.task
      .cloneMultiTask(taskIds, options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            const successCount = res.data?.clonedTaskIds?.length;
            if (successCount > 0) {
              this.toastrService.success(
                `Đã sao chép thành công ${successCount} tác vụ`,
              );
            } else {
              this.toastrService.warning('Không có tác vụ nào được sao chép');
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
          this.toastrService.warning('Đã có lỗi xảy ra!');
        },
      });
  }

  // isInit: Khi load
  handleActiveViewMode() {
    try {
      // Subscribe to currentActiveViewMode to handle changes
      this.autoTaskService.currentActiveViewMode
        .pipe(
          distinctUntilChanged(),
          filter((currentActiveViewMode) => !!currentActiveViewMode),
          takeUntil(this.destroy$),
        )
        .subscribe((currentActiveViewMode) => {
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
          Object.keys(this.currentActiveViewMode?.options || {}).forEach(
            (key) => {
              if (this.currentActiveViewMode?.options[key]) {
                objFilterQuery[key] = this.currentActiveViewMode?.options[key];
              }
            },
          );

          this.filter.tag =
            this.currentActiveViewMode?.options?.tags?.[0] || null;

          this.filter.sort = this.currentActiveViewMode?.options?.sort || null;

          this.checkbox.roleIds =
            this.currentActiveViewMode?.options?.teamRoles || [];
          this.checkbox.userIds =
            this.currentActiveViewMode?.options?.teamId || [];

          // loop configFilters and update by value of object options in currentActiveViewMode
          this.configFilters.forEach((configFilter) => {
            if (
              configFilter.type === ETypeFilter.SELECT ||
              configFilter.type === ETypeFilter.POPOVER ||
              configFilter.type === ETypeFilter.DATE
            ) {
              if (configFilter.name === 'sort') {
                configFilter.value =
                  this.currentActiveViewMode?.options[configFilter.name!] ||
                  '-createdAt';
                this.item.paramsQuery.sort =
                  this.currentActiveViewMode?.options[configFilter.name!] ||
                  ('-createdAt' as string);
              } else {
                configFilter.value =
                  this.currentActiveViewMode?.options[configFilter.name!];
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
          if (
            this.item.isFirstRequest ||
            this.currentActiveViewMode?.isChangeTab
          ) {
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

  getSortLabel(): string {
    const currentSort = this.filter.sort || '-createdAt';
    const selectedOption = this.sortOptions.find(
      (option) => option.value === currentSort,
    );
    return selectedOption?.label || '';
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
        leadId: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  handleQueryParam(data: any, name: string) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    if (name === 'tags') {
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

  handleCreateTaskFromLead(leadId: string) {
    // Fetch lead detail and open task creation modal
    this.autoTaskService.lead.getById(leadId).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.openTaskCreationModalWithLeadData(res.data);
        } else {
          this.toastrService.error('Không thể lấy thông tin lead');
        }
      },
      error: (err: any) => {
        this.toastrService.error('Không thể lấy thông tin lead');
      },
    });
  }

  private openTaskCreationModalWithLeadData(lead: any) {
    this.isOpenBackDrop = true;
    const modalUpdate = this.modalService.show(ModalUpdateTaskComponent, {
      initialState: {
        leadData: lead, // Pass lead data separately
      },
      class: 'modal-dialog-centered modal-medium',
      keyboard: true,
      backdrop: false,
    });

    // modalUpdate.content?.createdTask.subscribe((createdTask: any) => {
    //   this.toastrService.success('Tạo task thành công');
    //   this.getDataSource(true);
    // });

    // modalUpdate.content?.updatedTask.subscribe((updatedTask: any) => {
    //   this.getDataSource(true);
    // });

    modalUpdate?.onHidden?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOpenBackDrop = false;
      this.handleClearQueryParams();
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
        class: 'modal-dialog-centered modal-medium',
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
    if (name === 'reload' && !this.item.loading) {
      this.getDataSource();
    }
    if (name === 'add_new') {
      this.handleUpdate();
    }
    if (name === 'orderableTable') {
      this.showModalOrderableTable();
    }
    if (name === 'hideClosedTask') {
      const configButton = this.configButtons.find(
        (cf) => cf.name === 'hideClosedTask',
      );

      const currentBtnActiveState = configButton?.isActive || false;
      const incomingBtnActiveState = !currentBtnActiveState; // Next state of btn activation

      const obj = JSON.parse(this.item.paramsQuery.filter || '{}');
      obj['hideClosedTask'] = incomingBtnActiveState;

      configButton!.isActive = incomingBtnActiveState;
      this.item.paramsQuery.filter = JSON.stringify(obj);

      if (!isEqual(obj, this.currentActiveViewMode?.options)) {
        this.handleViewModeChange(true);
        return;
      }
    }
    if (name == 'importExcel') {
      this.handleImportExcel();
    }

    if (name === 'drawTask') {
      if (!this.autoTaskSetting.drawAndDropConfig?.isEnabled) {
        this.toastrService.warning(
          'Bạn vui lòng bật tính năng rút số ở mục cấu hình trong phần cài đặt.',
        );
        return;
      }
      this.showModalDrawTask();
    }
  }

  handleImportExcel() {
    const modalRef = this.modalService.show(ModalImportExcelComponent, {
      initialState: {},
      class: 'modal-dialog-centered modal-xl',
      backdrop: 'static',
    });
  }

  handleFilterAdvance(filter: any) {
    const objFilterQuery = {
      ...JSON.parse(this.item.paramsQuery.filter || '{}'),
      ...filter,
    };
    const configFilterAdvance = this.configFilters.filter(
      (item) => item.botherType === EBotherAdvanceBasicFilter.ADVANCE,
    );

    // Xóa những field có trong configFilterAdvance mà không có trong filter
    configFilterAdvance.forEach((item) => {
      if (!Object.keys(filter).includes(item.name!)) {
        delete objFilterQuery[item.name!];
      }
    });

    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);

    this.handleViewModeChange(true);
  }

  handleViewModeChange(hasChanged: boolean) {
    const changedTab = {
      ...this.currentActiveViewMode,
      hasChanged: hasChanged,
      options: {
        ...JSON.parse(this.item.paramsQuery.filter || '{}'),
        sort: this.item.paramsQuery.sort,
        q: this.item.paramsQuery.q,
      },
    };
    this.autoTaskService.setCurrentActiveViewMode(changedTab);
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
    this.getDataSource();
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
    const rows = this.getCheckRows()
      .filter((row) => !row.isTaskClosed)
      .sort(
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
      setTimeout(() => {
        this.getDataSource();
      }, 3000);
    });
    modalRef.onHide?.pipe(takeUntil(this.destroy$));
  }

  hasPerSplitTasks() {
    return this.authService.checkUserPer(EPerActType.TASK, [
      EPerActTask.SPLIT_TEAM_TASK,
    ]);
  }
  hasPerAssignTasks() {
    return this.authService.checkUserPer(EPerActType.TASK, [
      EPerActTask.REMOVE_TEAM_TASK,
    ]);
  }
  hasPerDelMultipleTasks() {
    return this.authService.checkUserPer(EPerActType.TASK, [
      EPerActTask.DELETE_MULTI_TASK,
    ]);
  }

  handleCreateOrder(orderId: string | null = null) {
    const modal = this.modalService.show(ModalCreateOrderComponent, {
      class: 'modal-xl modal-dialog-centered',
      initialState: {
        orderId,
      },
    });
  }

  showModalExportExcel() {
    if (!this.getCheckRows().length) {
      this.toastrService.warning('Vui lòng chọn ít nhất 1 tác vụ để xuất file');
      return;
    }
    const rows = this.getCheckRows()
      .map((item, index) => {
        const baseData = {
          stt: index + 1,
          ...item,
          hasTaskChains: item.hasTaskChains ? 'Đang mở' : 'Đã đóng chuỗi',
          createdAt: new Date(item.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
          updatedAt: new Date(item.updatedAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
          orderCodes: (item.orderCodes || []).join(', '),
          tags: (item.tags || [])
            .map((tag: string) => this.getTagById(tag)?.name)
            .join(', '),
          platformSources: (item.platformSources || [])
            .map((source: OrderPlatformSource) => source.name)
            .join(', '),
        };

        if (!item.taskChains?.length) {
          return baseData;
        }

        return item.taskChains.map((chain: ITaskChain, i: number) => {
          const shared =
            i === 0
              ? baseData
              : Object.fromEntries(
                  Object.keys(baseData).map((key) => [key, '']),
                );

          //Lấy thông tin nguyên nhân - kết quả
          const reasonResults = (chain.taskChainResults || [])
            .map((result: ITaskChainResult) => {
              return `${result.result?.name || ''}${
                result.reason?.name ? ` (${result.reason.name})` : ''
              }`;
            })
            .filter((s) => s.trim())
            .join(', ');
          return {
            ...shared,
            taskChains: {
              name: chain.name || '-',
              id: chain.id || '-',
              status: chain.status || '-',
              reasonResults: reasonResults || '-',
            },
          };
        });
      })
      .flat();

    const modal = this.modalService.show(ModalExportExcelComponent, {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        sheetName: 'danh sách tác vụ',
        rows,
        fieldGroupExportExcel: TASK_FIELD_GROUP_EXPORT_EXCEL,
        formExportExcel: FORM_EXPORT_EXCEL,
        roles: this.currentUser?.roles || [],
      },
    });
  }

  showModalCheckDuplicatedPhone() {
    this.modalService.show(ModalCheckDuplicatedPhoneComponent, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static',
      keyboard: false,
    });
  }

  showModalDrawTask() {
    if (!this.autoTaskSetting?.viewDrawConfig) {
      this.toastrService.warning(
        'Bạn vui lòng bật tính năng rút số ở mục cấu hình trong phần cài đặt.',
      );
      return;
    }
    const modal = this.modalService.show(ModalDrawTaskComponent, {
      class: 'modal-dialog-centered modal-xl',
      backdrop: 'static',
      keyboard: true,
    });

    modal.content?.drawSuccess.subscribe((task) => {
      if (task) {
        if (!this.checkTaskFilter(task)) {
          this.item.rows = this.item.rows.filter((row) => row.id !== task.id);
          this.item.total! -= 1;
          return;
        }
        const item = this.item.rows.find((row) => row.id === task.id);
        if (item) {
          Object.assign(item, task);
        }
      }
    });
  }

  /* 
  1. branch
  2. teamRoles
  3. teamId
  4. tags
  5. createdAt
  6. updatedAt
  7. sourceIds
  8. createdBy
  9. chainActId
  10. actionIds
  11. resultIds
  12. unassignedRoleId
  13. isHideExecute
  14. executedDateAt
  15. lastExecutedBy
  * Mục đích: Filter task theo socket realtime
  */
  checkTaskFilter(task: ITask): boolean {
    try {
      const filterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');

      // branch
      if (filterQuery.branchIds && filterQuery.branchIds.length > 0) {
        if (
          !task.branch?.id ||
          !filterQuery.branchIds.includes(task.branch.id)
        ) {
          return false;
        }

        const filterBranchIds = [task.branch.id];
        if (task.branch.department) {
          filterBranchIds.push(task.branch.department);
        }
        if (task.branch.team) {
          filterBranchIds.push(task.branch.team);
        }

        // Phân quyền theo branch
        const {branchIds, departmentIds, teamIds, rows} =
          this.authService.detectFilterBranchIds(filterBranchIds) || {};
        const rowIds = rows?.map((row: any) => row.id);
        if (!branchIds.length && !departmentIds.length && !teamIds.length) {
          return false;
        }

        let hasPermission = false;
        if (branchIds.length && !departmentIds.length && !teamIds.length) {
          hasPermission = branchIds.some((branchId: string) =>
            rowIds.includes(branchId),
          );
        } else if (
          !branchIds.length &&
          departmentIds.length &&
          !teamIds.length
        ) {
          hasPermission = departmentIds.some((departmentId: string) =>
            rowIds.includes(departmentId),
          );
        } else if (
          !branchIds.length &&
          !departmentIds.length &&
          teamIds.length
        ) {
          hasPermission = teamIds.some((teamId: string) =>
            rowIds.includes(teamId),
          );
        } else if (branchIds.length || departmentIds.length || teamIds.length) {
          hasPermission = rowIds.some(
            (rowId: string) =>
              branchIds.includes(rowId) ||
              departmentIds.includes(rowId) ||
              teamIds.includes(rowId),
          );
        }
        if (!hasPermission) {
          return false;
        }
      }

      // teamRoles
      if (filterQuery.teamRoles && filterQuery.teamRoles.length > 0) {
        const taskTeamRoleIds =
          task.teams
            ?.map((team) => {
              if (team.userId) return team.roleId;
              return null;
            })
            .filter(Boolean) || [];
        const hasMatchingRole = filterQuery.teamRoles.some((roleId: string) =>
          taskTeamRoleIds.includes(roleId),
        );
        if (!hasMatchingRole) {
          return false;
        }
      }

      // teamId
      if (filterQuery.teamId && filterQuery.teamId.length > 0) {
        const taskUserIds = task.teams?.map((team) => team.userId) || [];
        const hasMatchingUser = filterQuery.teamId.some((userId: string) =>
          taskUserIds.includes(userId),
        );
        if (!hasMatchingUser) {
          return false;
        }
      }

      // tag
      if (filterQuery.tags && filterQuery.tags.length > 0) {
        const taskTagIds = task.tags || [];
        const hasMatchingTag = filterQuery.tags.some((tagId: string) =>
          taskTagIds.includes(tagId),
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // sourceIds
      if (filterQuery.sourceIds && filterQuery.sourceIds.length > 0) {
        const taskPlatformSourceIds = task.platformSourceIds || [];
        const hasMatchingPlatformSource = filterQuery.sourceIds.some(
          (sourceId: string) => taskPlatformSourceIds.includes(sourceId),
        );
        if (!hasMatchingPlatformSource) {
          return false;
        }
      }

      // createdAt
      if (filterQuery.createdAt && filterQuery.createdAt.length === 2) {
        const taskCreatedAt = new Date(task.createdAt);
        const startDate = new Date(filterQuery.createdAt[0]);
        const endDate = new Date(filterQuery.createdAt[1]);

        if (taskCreatedAt < startDate || taskCreatedAt > endDate) {
          return false;
        }
      }

      //updatedAt
      if (filterQuery.updatedAt && filterQuery.updatedAt.length === 2) {
        const taskUpdatedAt = new Date(task.updatedAt);
        const startDate = new Date(filterQuery.updatedAt[0]);
        const endDate = new Date(filterQuery.updatedAt[1]);

        if (taskUpdatedAt < startDate || taskUpdatedAt > endDate) {
          return false;
        }
      }

      // createdBy
      if (filterQuery.createdBy) {
        if (task.createdBy.id !== filterQuery.createdBy) {
          return false;
        }
      }

      // chainActId
      if (filterQuery.chainActId) {
        const hasMatchingChain = task.taskChains?.some(
          (chain) => chain.chainActId === filterQuery.chainActId,
        );
        if (!hasMatchingChain) {
          return false;
        }
      }

      // actionIds
      if (filterQuery.actionIds && filterQuery.actionIds.length > 0) {
        const actionIds = task.taskChains.flatMap((chain) =>
          chain.taskChainResults.flatMap((result) => {
            const ids = [];
            if (result.action?.id) ids.push(result.action.id);
            if (result.subActions?.length) {
              ids.push(...result.subActions.map((sa) => sa.id));
            }
            return ids;
          }),
        );
        const hasMatchingAction = filterQuery.actionIds.some(
          (actionId: string) => actionIds.includes(actionId),
        );
        if (!hasMatchingAction) {
          return false;
        }
      }

      // resultIds
      if (filterQuery.resultIds && filterQuery.resultIds.length > 0) {
        const resultIds = task.taskChains
          .flatMap((chain) =>
            chain.taskChainResults.map(
              (taskChainResult) => taskChainResult.result.id,
            ),
          )
          .filter(Boolean);
        const hasMatchingResult = filterQuery.resultIds.some(
          (resultId: string) => resultIds.includes(resultId),
        );
        if (!hasMatchingResult) {
          return false;
        }
      }

      // unassignedRoleId
      if (filterQuery.unassignedRoleId) {
        const hasMatchingUnassignedRole = task.teams?.some(
          (team) =>
            team.roleId === filterQuery.unassignedRoleId && !team.userId,
        );
        if (hasMatchingUnassignedRole) {
          return false;
        }
      }
      //isHideExecute
      if (filterQuery.isHideExecute) {
        let taskChains = task.taskChains || [];
        const hasOpenTaskChains =
          !taskChains.length ||
          taskChains.some((chain) => chain.status === 'ACTIVE');
        if (!hasOpenTaskChains) {
          return false;
        }
        taskChains = taskChains.filter(
          (t: ITaskChain) => t.status !== ETaskChainType.CLOSED,
        );
        task.taskChains = cloneDeep(taskChains);
      }

      // executedDateAt
      // Điều kiện thỏa mãn: có ít nhất 1 tcr có executedDate thỏa mãn trong range filter
      if (
        filterQuery.executedDateAt &&
        filterQuery.executedDateAt.length === 2
      ) {
        const executedDateList = task.taskChains.flatMap((chain) => {
          return (
            chain.taskChainResults
              // Chỉ lấy tcr có executedDate và type là MANUAL
              .filter(
                (tcr) =>
                  tcr.executedDate && tcr.type === EChainNextActionType.MANUAL,
              )
              .map((tcr) => tcr.executedDate)
          );
        });

        if (!executedDateList.length) return false;

        const someMatch = executedDateList.some((d) => {
          const execDate = new Date(d);
          const startDate = new Date(filterQuery.executedDateAt[0]);
          const endDate = new Date(filterQuery.executedDateAt[1]);

          return execDate >= startDate && execDate <= endDate;
        });

        if (!someMatch) return false;
      }

      // lastExecutedBy
      // Điều kiện thỏa mãn: có ít nhất 1 tcr có executedBy?.id match với filter
      if (filterQuery.lastExecutedBy) {
        const lastExecutedByIdList = task.taskChains.flatMap((chain) => {
          return chain.taskChainResults
            .filter(
              (tcr) =>
                tcr.executedBy?.id &&
                tcr.executedBy?.id === filterQuery.lastExecutedBy &&
                tcr.type === EChainNextActionType.MANUAL,
            )
            .map((tcr) => tcr.executedBy?.id)
            .filter(Boolean) as string[];
        });

        if (!lastExecutedByIdList.length) return false;

        const someMatch = lastExecutedByIdList.some(
          (id) => id === filterQuery.lastExecutedBy,
        );
        if (!someMatch) return false;
      }

      return true;
    } catch (error) {
      console.error('Error in checkTaskFilter:', error);
      return true;
    }
  }

  loadUserAclData(): void {
    this.autoTaskService.userAcl
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const user = response.data.find(
            (user) => user.userId === this.currentUser?.id,
          );
          if (user) {
            this.userAcl = user;
          }
        },
      });
  }

  handleContinueOrStopReceive() {
    if (!this.userAcl) return;
    if (this.isStopReceive) {
      this.autoTaskService.userAcl
        .upsert({
          ...this.userAcl,
          stopReceiveTaskDuration: 0,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.toastrService.success('Cập nhật trạng thái thành công');
              Object.assign(this.userAcl, res.data);
            } else {
              this.toastrService.error('Cập nhật trạng thái thất bại');
            }
          },
        });
      return;
    }
    const bsModalRef = this.modalService.show(ModalStopReceiveComponent, {
      initialState: {
        userAcl: this.userAcl,
      },
      class: 'modal-xs',
      ignoreBackdropClick: true,
      backdrop: 'static',
      keyboard: false,
    });

    bsModalRef?.content?.updateSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            Object.assign(this.userAcl, user);
          }
        },
      });
  }

  private async setupSocketListeners(): Promise<void> {
    try {
      // Chờ socket sẵn sàng trước khi listen
      await this.socketService.waitForSocket();

      //socket
      this.socketService.listen('task/SYNCHRONIZED').subscribe((data) => {
        const taskData = cloneDeep(data.task) as ITask;

        if (this.checkTaskFilter(taskData)) {
          // Những filter sẽ không thêm hoặc cập nhật task
          if (this.item.paramsQuery.q) {
            return;
          }
          const sort = this.item.paramsQuery.sort || '-createdAt';
          if (
            !['createdAt', '-createdAt', '-updatedAt', 'updatedAt'].includes(
              sort,
            )
          ) {
            return;
          }

          switch (data.actionType) {
            case 'CREATE':
              if (sort === 'createdAt' || sort === 'updatedAt') {
                break;
              }
              this.item.rows.unshift(taskData);
              this.item.total! += 1;
              break;
            case 'UPDATE':
              const taskIndex = this.item.rows.findIndex(
                (row) => row.id === taskData.id,
              );
              if (taskIndex !== -1) {
                this.item.rows[taskIndex] = taskData;
              }
              break;
          }
        }
      });

      this.socketService.listen('app/ACTIVITY_CHECK').subscribe((data) => {
        console.log('app/ACTIVITY_CHECK', data);
      });

      this.socketService.listen('task/DELETED').subscribe((data) => {
        const taskIndex = this.item.rows.findIndex(
          (row) => row.id === data.taskId,
        );
        if (taskIndex !== -1) {
          this.item.rows = this.item.rows.filter(
            (row) => row.id !== data.taskId,
          );
          this.item.total! -= 1;
        }
      });

      this.socketService.listen('task/BULK_DELETED').subscribe((data) => {
        setTimeout(() => {
          this.toastrService.success(
            `Xóa thành công ${data.deletedTasksLength} tác vụ.`,
          );
          this.getDataSource(true);
        }, 1000);
      });
    } catch (error) {
      console.error('Failed to setup socket listeners:', error);
    }
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }
}
