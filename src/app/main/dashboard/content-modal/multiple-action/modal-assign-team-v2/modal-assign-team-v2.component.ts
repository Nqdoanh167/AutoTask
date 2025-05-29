import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {Biz, BizRole, IBranch, IDateRange, User} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {Router} from '@angular/router';
import {ETypeBulkUpdate} from '@app/types/common';
import {ITask, ModifiedUserUnit} from '@app/types/flow';
import {distributeTasksToUsers as coreDistributeTasksToUsers} from './helper';
import {ToastrService} from 'ngx-toastr';
import {ProgressbarType} from 'ngx-bootstrap/progressbar';
import {BsCustomDates} from 'ngx-bootstrap/datepicker/themes/bs/bs-custom-dates-view.component';
import moment from 'moment';
import { BaseComponentsComponent } from '@app/share/common/base-components/base-components.component';

interface IFilterCanSplitTask {
  roleId: string;
  createdAt?: string[];
  branchId?: string;
  departmentId?: string;
  teamId?: string;
}

interface IAssignToUser {
  roleId: string;
  roleIcon: string;
  roleName: string;
  userId: string;
  userName: string;
  userPicture: string;
  userEmail: string;
}

interface ITaskAssignment {
  taskIds: string[];
  assignTo: IAssignToUser;
}

export interface ISubmitPayload {
  tasks: ITaskAssignment[];
}

interface IUserSelection {
  user: Pick<User, 'id' | 'name' | 'picture' | 'email'>;
  selected: boolean;
  count: number;
}

@Component({
  selector: 'app-modal-assign-team-v2',
  templateUrl: './modal-assign-team-v2.component.html',
  styleUrls: ['./modal-assign-team-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ModalAssignTeamV2Component extends BaseComponentsComponent implements OnInit, OnDestroy {
  @Input() action!: ETypeBulkUpdate;
  @Input() selectedTaskIds: string[] = []; // Limit 1000
  @Input() selectedTaskCodes: string[] = [];
  @Input() selectedTasks: ITask[] = [];
  @Output() assignTeams = new EventEmitter<ISubmitPayload>();
  public _cachedSelectedTasks: ITask[] = [];
  public selectedTaskCount: number = 0; // hiển thị
  public ETypeBulkUpdate = ETypeBulkUpdate;
  public usersFilter!: User[];
  protected loading = {
    modal: false,
  };
  public selectAll = false;
  // public totalDistributed = 0;
  public currentRole: BizRole | null = null;
  public availableRoles: BizRole[] = [];
  public userSelections: IUserSelection[] = [];
  public modalOpenByTaskSelection!: boolean; // Check if there are any tasks selected (not empty)
  public currentBranch: IBranch | null = null;
  public branches = this.autoTaskService.getUserUnits(false);
  public selectedBranch: ModifiedUserUnit | null = null;

  public currentSelectedUserCount!: number; // Count of users selected -> Used for toggle all

  public actualSplitTaskCount: number = 0; // Actual Task count used
  // public actualSplitTaskCount = 0;

  public progressStatus: string | 'progressing' | 'success' | 'error' = '';
  public progressValue = 0;
  public progressMax = 100;
  public progressType: ProgressbarType = 'info';

  public onDistributeTasksClick() {
    this.distributeTasksToUsers();
    // this.selectAll = true;
    // this.toggleSelectAll();
    // this.calculateTotalDistributed();
  }

  public filter: IFilterCanSplitTask = {
    roleId: '',
    createdAt: [],
    branchId: undefined,
    departmentId: undefined,
    teamId: undefined,
  };

  public roleError: boolean = false;

  public ranges: BsCustomDates[] = [
    {
      label: '30 ngày trước',
      value: [
        new Date(new Date().setDate(new Date().getDate() - 30)),
        new Date(),
      ],
    },
    {
      label: '15 ngày trước',
      value: [
        new Date(new Date().setDate(new Date().getDate() - 15)),
        new Date(),
      ],
    },
    {
      label: '7 ngày trước',
      value: [
        new Date(new Date().setDate(new Date().getDate() - 7)),
        new Date(),
      ],
    },
    {
      label: 'Hôm nay',
      value: [new Date(), new Date()],
    },
  ];

  constructor(
    private readonly modalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly router: Router,
    private readonly toastService: ToastrService,
  ) {
    super()
    this.usersFilter = this.bizUsers || []
    
  }

  ngOnInit() {
    this.loading.modal = true;
    this._cachedSelectedTasks = [...this.selectedTasks];
    this.selectedTaskCount = this.selectedTasks.length;
    this.modalOpenByTaskSelection = this.selectedTaskIds.length > 0;
    this.getRole();
    this.initUserSelections();
    setTimeout(() => {
      this.loading.modal = false;
    }, 500);
  }

  initUserSelections() {
    this.selectAll = true;
    this.currentSelectedUserCount = this.usersFilter.length;

    this.userSelections = this.usersFilter.map((user) => ({
      user: {
        id: user.id,
        name: user.name,
        picture: user.picture,
        email: user.email,
      },
      selected: true,
      count: 0,
    }));
  }

  getRole() {
    this.autoTaskService.setting
      .retrieve({bizId: this.currentBiz!.id})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            const fRoles = this.currentBiz!.roles.filter((role) => {
              return res.data.roles?.includes(role.id);
            });
            this.availableRoles = [...fRoles];
            if (!fRoles.length) {
              this.toastService.warning('Không có vai trò nào để chia');
              return;
            }
            if (this.modalOpenByTaskSelection) {
              this.onRoleChange(fRoles[0]);
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  /*
   * Lấy danh sách tác vụ có thể chia theo điều kiện lọc
   */
  private getTasksCanSplit() {
    const params: IFilterCanSplitTask = {
      roleId: this.filter.roleId,
      branchId: this.filter.branchId,
      departmentId: this.filter.departmentId,
      teamId: this.filter.teamId,
      createdAt: this.filter.createdAt?.length
        ? this.filter.createdAt
        : undefined,
    };

    this.autoTaskService.task
      .canSplit(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            const taskIds = res.data.taskIds;

            this.selectedTaskIds = taskIds;

            this.actualSplitTaskCount = taskIds.length;
            this.selectedTaskCount = taskIds.length;

            if (taskIds.length) {
              this.distributeTasksToUsers();
            }
            // this.calculateTotalDistributed();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  get isFormValid(): boolean {
    return this.calculateTotalDistributed > 0 || !this.userSelections.length;
  }

  /**
   * Tính tổng số tác vụ được chia
   */
  get calculateTotalDistributed(): number {
    return this.userSelections
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + (item.count || 0), 0);
  }

  /*
   * Hàm này được gọi khi người dùng thay đổi số lượng tác vụ thực tế đã chia
   * @param {number} value - Số lượng tác vụ thực tế đã chia
   * @returns {void}
   * @description
   * - Nếu số lượng tác vụ thực tế đã chia lớn hơn số lượng tác vụ đã chọn, hiển thị thông báo cảnh báo
   * - Nếu không, cập nhật số lượng tác vụ thực tế đã chia và danh sách ID của các tác vụ thực tế đã chia
   */
  public handleChangeActualSplitTask(value: number) {
    this.actualSplitTaskCount = value;
    // this.actualSplitTaskCount = this.selectedTasks
    //   .slice(0, value)
    //   .map((task) => task.id);

    this.distributeTasksToUsers();
    // this.calculateTotalDistributed();
  }

  public distributeTasksToUsers() {
    this.userSelections = this.userSelections.filter((item) =>
      this.usersFilter.some((user) => user.id === item.user.id),
    );

    const {
      hasUnevenDistribution,
      higherTaskCount,
      higherTaskUserCount,
      lowerTaskCount,
      lowerTaskUserCount,
    } = coreDistributeTasksToUsers(
      this.actualSplitTaskCount,
      this.userSelections.filter((item) => item.selected).length,
    );

    if (hasUnevenDistribution) {
      let idx = 0
      this.userSelections.forEach((item, index) => {
        if(item.selected) idx++;
        item.count = item.selected ? (idx <= higherTaskUserCount ? higherTaskCount : lowerTaskCount) : 0;
      })
    } else {
      let idx= 0
      this.userSelections.forEach((item, index) => {
        if(item.selected) idx++;
        item.count = item.selected ? higherTaskCount : 0;
      })
    }
  }

  navigateSetting() {
    this.hideModal();
    this.router.navigate(['/setting/role']);
  }

  onSubmit() {
    if (this.calculateTotalDistributed > this.selectedTaskIds.length) {
      this.toastService.warning(
        'Số lượng tác đã chia vượt quá tổng số lượng cho phép',
      );
      return;
    }

    this.progressStatus = 'processing';
    this.progressValue = 0;
    this.progressType = 'info';

    const selectedUsers = this.userSelections
      .filter((item) => item.selected && item.count > 0)
      .sort((a, b) => 0); // Maintain order

    let remainingTaskIds = [...this.selectedTaskIds];
    const totalTasks = remainingTaskIds.length;
    const allAssignments: ITaskAssignment[] = [];

    for (const userSelection of selectedUsers) {
      if (remainingTaskIds.length === 0) break;

      const count = Math.min(userSelection.count, remainingTaskIds.length);
      const assignTaskIds = remainingTaskIds.slice(0, count);
      remainingTaskIds = remainingTaskIds.slice(count);

      const user = userSelection.user;
      allAssignments.push({
        taskIds: assignTaskIds,
        assignTo: {
          roleId: this.currentRole!.id,
          roleIcon: this.currentRole!.icon,
          roleName: this.currentRole!.name,
          userId: user.id,
          userName: user.name,
          userPicture: user.picture || '',
          userEmail: user.email,
        },
      });
    }

    this.processAssignments(allAssignments, totalTasks);
  }

  private processAssignments(
    allAssignments: ITaskAssignment[],
    totalTasks: number,
  ) {
    let processedTasks = 0;

    const processBatch = () => {
      const batchAssignments: ITaskAssignment[] = [];
      let batchTaskCount = 0;
      let i = 0;
      const maxBatchSize = 50; // Maximum number of tasks per batch

      while (i < allAssignments.length && batchTaskCount < maxBatchSize) {
        const assignment = allAssignments[i];

        if (assignment.taskIds.length + batchTaskCount <= maxBatchSize) {
          batchAssignments.push(assignment);
          batchTaskCount += assignment.taskIds.length;
          allAssignments.splice(i, 1);
        } else {
          const remainingSpace = maxBatchSize - batchTaskCount;
          const tasksForThisBatch = assignment.taskIds.slice(0, remainingSpace);
          const tasksForNextBatch = assignment.taskIds.slice(remainingSpace);

          batchAssignments.push({
            ...assignment,
            taskIds: tasksForThisBatch,
          });

          allAssignments[i].taskIds = tasksForNextBatch;
          batchTaskCount += remainingSpace;
        }
      }

      if (batchAssignments.length === 0) {
        this.progressValue = 100;
        this.progressType = 'success';
        this.toastService.success('Gán tác vụ thành công');
        setTimeout(() => {
          this.progressStatus = 'success';
          // this.modalRef.hide();
        }, 1000);
        return;
      }

      const payload: ISubmitPayload = {tasks: batchAssignments};
      const tasksInThisBatch = batchAssignments.reduce(
        (sum, a) => sum + a.taskIds.length,
        0,
      );

      let requestTimedOut = false;
      const timeoutId = setTimeout(() => {
        requestTimedOut = true;
        this.progressStatus = 'error';
        this.progressType = 'danger';
        this.toastService.warning('Quá thời gian xử lý yêu cầu');
      }, 5000);

      this.autoTaskService.task
        .bulkAssignTeam(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            clearTimeout(timeoutId);
            if (requestTimedOut) return;
            if (res && res.status === 200) {
              processedTasks += tasksInThisBatch;
              this.progressValue = Math.round(
                (processedTasks / totalTasks) * 100,
              );
              processBatch();
            } else {
              this.progressStatus = 'error';
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => {
            clearTimeout(timeoutId);
            if (requestTimedOut) return;
            this.progressStatus = 'error';
            this.commonService.handleErr(err);
          },
        });
    };

    processBatch();
  }

  private _filterLackOfRoleInTasks() {
    this.selectedTasks = this._cachedSelectedTasks.filter((task) => {
      const teams = task.teams || [];
      return teams.every(
        (team) =>
          team.roleId !== this.currentRole!.id ||
          (team.roleId === this.currentRole!.id && team.userId === null),
      );
    });
  }

  /**
   * Mảng user được lọc theo vai trò khả dụng hiện tại của biz và của loại vai trò được chọn
   */
  onRoleChange(role: BizRole): void {
    this.currentRole = role;
    this.roleError = false;

    // Filter out users whom lack of current role in their roleIds
    this.usersFilter = this.currentBiz!.users.filter((user) =>
      user.roleIds!.includes(this.currentRole!.id),
    );

    if (this.modalOpenByTaskSelection) {
      this._filterLackOfRoleInTasks();
      this.actualSplitTaskCount = this.selectedTasks.length;
      this.selectedTaskIds = this.selectedTasks.map((task) => task.id);
      // this.actualSplitTaskCount = this.actualSplitTaskCount.length;
      this.distributeTasksToUsers();
      // this.calculateTotalDistributed();

      return;
    }

    this.filter.roleId = this.currentRole!.id;

    this.getTasksCanSplit();
  }

  toggleSelectAll(): void {
    this.currentSelectedUserCount = this.selectAll ? this.usersFilter.length : 0;

    // Update existing objects in place
    this.userSelections.forEach((item) => {
      item.selected = this.selectAll;
      if (!this.selectAll) {
        item.count = 0; // Reset count when deselecting
      }
    });

    // this.calculateTotalDistributed();
  }

  onUserSelectionChange(event: any): void {
    // this.calculateTotalDistributed();
    if (event === true) {
      this.currentSelectedUserCount++;
    } else {
      this.currentSelectedUserCount--;
    }
    if (this.currentSelectedUserCount === this.usersFilter.length) {
      this.selectAll = true;
    } else {
      this.selectAll = false;
    }
  }

  handleChangeValueRangeNumber(value: number, index: number): void {
    if (this.userSelections[index]) {
      this.userSelections[index].count = value;
      // this.calculateTotalDistributed();
    }
  }

  onTimeChange(event: Date | IDateRange): void {
    const hValue = event as IDateRange;

    if (hValue?.fromDate && hValue?.toDate) {
      this.filter.createdAt = [
        moment(hValue.fromDate).startOf('day').toISOString(),
        moment(hValue.toDate).endOf('day').toISOString(),
      ];
    }

    if (!this.filter.createdAt?.length) {
      return;
    }

    if (this.filter.roleId === '') {
      this.roleError = true;
      return;
    }

    this.getTasksCanSplit();
  }

  handleChangeBranch(event: any) {
    if (event?.node?.team) {
      this.filter.teamId =
        this.filter.teamId === event.node.data ? undefined : event.node.data;
      this.filter.departmentId = undefined;
      this.filter.branchId = undefined;
    } else if (event?.node?.department) {
      this.filter.departmentId =
        this.filter.departmentId === event.node.data
          ? undefined
          : event.node.data;
      this.filter.teamId = undefined;
      this.filter.branchId = undefined;
    } else if (event?.node) {
      this.filter.branchId =
        this.filter.branchId == event.node.data ? undefined : event.node.data;
      this.filter.departmentId = undefined;
      this.filter.teamId = undefined;
    }

    if (this.filter.roleId === '') {
      this.roleError = true;
      return;
    }

    this.getTasksCanSplit();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

}
