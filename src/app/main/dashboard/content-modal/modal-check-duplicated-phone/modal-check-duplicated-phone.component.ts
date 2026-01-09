import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {SocketService} from '@app/services/api/socket.service';
import {CommonService} from '@app/services/common/common.service';
import {ILeadDealDto, ITask} from '@app/types/flow';
import {Biz, EntityPagination} from '@app/types/viewmodels';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';

interface ITaskInfo
  extends Pick<ITask, 'id' | 'code' | 'isTaskClosed' | 'createdAt'> {
  leadDeal: {
    name: ILeadDealDto['name'];
  };
}

@Component({
  selector: 'app-modal-check-duplicated-phone',
  templateUrl: './modal-check-duplicated-phone.component.html',
  styleUrls: ['./modal-check-duplicated-phone.component.scss'],
})
export class ModalCheckDuplicatedPhoneComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public currentBiz?: Biz;

  constructor(
    private readonly modalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly toastr: ToastrService,
    private readonly socketService: SocketService,
    private readonly authService: AuthService,
  ) {
    this.socketService
      .listen('task/BULK_DELETED')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.getDupPhoneList();
        }, 1000);
      });
  }

  // === State Properties ===
  public dupPhoneList: EntityPagination<{phone: string; count: number}> = {
    rows: [],
    after: null,
    loading: false,
  };

  public tasksByPhone: Record<
    string,
    {rows: ITaskInfo[]; loading: boolean; loaded: boolean}
  > = {};
  public accordionStates: Record<string, boolean> = {};

  // Selection state - chỉ 1 accordion được phép có selections
  public activeAccordionPhone: string | null = null;
  public selectedTasks: string[] = [];
  public selectedOriginalTask: string | null = null;
  public selectedAction: string | null = null;
  public validOriginalTasks: ITaskInfo[] = [];

  // Processing state
  public isProcessing: boolean = false;

  // === Lifecycle ===
  ngOnInit(): void {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz;
      });
    this.getDupPhoneList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  // === Data Fetching ===
  getDupPhoneList(after?: string): void {
    if (this.dupPhoneList.loading) return;

    this.dupPhoneList.loading = true;

    this.autoTaskService.task.getListDuplicatedPhone({after}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dupPhoneList.rows = res.data;
          this.dupPhoneList.after = res.meta?.after || null;
        } else {
          this.commonService.handleResErr(res);
        }
        this.dupPhoneList.loading = false;
      },
      error: (err) => {
        this.dupPhoneList.loading = false;
        this.commonService.handleErr(err);
      },
    });
  }

  loadTasksForPhone(phone: string): void {
    const current = this.tasksByPhone[phone];
    if (current?.loading || current?.loaded) return;

    this.tasksByPhone[phone] = {rows: [], loading: true, loaded: false};

    this.autoTaskService.task.getListDuplicatedPhoneTask({phone}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.tasksByPhone[phone] = {
            rows: (res.data || []) as ITaskInfo[],
            loading: false,
            loaded: true,
          };
          if (this.activeAccordionPhone === phone) {
            this.updateValidOriginalTasks();
          }
        } else {
          this.tasksByPhone[phone] = {rows: [], loading: false, loaded: false};
          this.commonService.handleResErr(res);
        }
      },
      error: (err) => {
        this.tasksByPhone[phone] = {rows: [], loading: false, loaded: false};
        this.commonService.handleErr(err);
      },
    });
  }

  // === Accordion ===
  isAccordionOpen(phone: string): boolean {
    return this.accordionStates[phone] || false;
  }

  onToggleAccordion(phone: string, isOpen: boolean): void {
    this.accordionStates[phone] = isOpen;

    if (isOpen) {
      this.loadTasksForPhone(phone);
    } else if (this.activeAccordionPhone === phone) {
      // Khi đóng accordion đang active → clear selection
      this.clearSelection();
    }
  }

  // === Selection Logic ===
  // Kiểm tra xem checkbox có bị disable không
  isCheckboxDisabled(phone: string): boolean {
    // Disable nếu đang có active accordion khác
    return (
      this.activeAccordionPhone !== null && this.activeAccordionPhone !== phone
    );
  }

  // Kiểm tra xem action bar có hiển thị ở accordion này không
  shouldShowActionBar(phone: string): boolean {
    return this.activeAccordionPhone === phone && this.selectedTasks.length > 0;
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTasks.includes(taskId);
  }

  isAllSelected(phone: string): boolean {
    const taskIds = this.getTaskIds(phone);
    return taskIds.length > 0 && taskIds.every((id) => this.isTaskSelected(id));
  }

  getSelectedCount(): number {
    return this.selectedTasks.length;
  }

  getValidTaskCountToMerge(): number {
    return this.validOriginalTasks.filter((i) => i.isTaskClosed === false)
      .length;
  }

  getValidOriginalTasks(): ITaskInfo[] {
    if (!this.activeAccordionPhone) return [];
    const tasks = this.tasksByPhone[this.activeAccordionPhone]?.rows || [];
    return tasks.filter((task) => this.selectedTasks.includes(task.id));
  }

  private updateValidOriginalTasks(): void {
    this.validOriginalTasks = this.getValidOriginalTasks();
  }

  private getTaskIds(phone: string): string[] {
    return this.tasksByPhone[phone]?.rows?.map((task) => task.id) || [];
  }

  // === Selection Handlers ===
  handleSelectTask(phone: string, taskId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      // Set active accordion nếu chưa có
      if (!this.activeAccordionPhone) {
        this.activeAccordionPhone = phone;
      }
      if (!this.selectedTasks.includes(taskId)) {
        this.selectedTasks.push(taskId);
      }
    } else {
      this.selectedTasks = this.selectedTasks.filter((id) => id !== taskId);
      // Nếu không còn selection nào → reset active accordion
      if (this.selectedTasks.length === 0) {
        this.activeAccordionPhone = null;
        this.selectedOriginalTask = null;
        this.selectedAction = null;
      }
    }

    this.updateValidOriginalTasks();
    this.autoSelectOriginalTask();
  }

  handleSelectAll(phone: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const taskIds = this.getTaskIds(phone);

    if (checked) {
      this.activeAccordionPhone = phone;
      taskIds.forEach((id) => {
        if (!this.selectedTasks.includes(id)) {
          this.selectedTasks.push(id);
        }
      });
    } else {
      this.selectedTasks = this.selectedTasks.filter(
        (id) => !taskIds.includes(id),
      );
      if (this.selectedTasks.length === 0) {
        this.activeAccordionPhone = null;
        this.selectedOriginalTask = null;
        this.selectedAction = null;
      }
    }

    this.updateValidOriginalTasks();
    this.autoSelectOriginalTask();
  }

  private autoSelectOriginalTask(): void {
    const validTasks = this.getValidOriginalTasks();
    if (validTasks.length > 0) {
      if (
        !this.selectedOriginalTask ||
        !validTasks.some((t) => t.id === this.selectedOriginalTask)
      ) {
        this.selectedOriginalTask = validTasks[0].id;
      }
    } else {
      this.selectedOriginalTask = null;
    }
  }

  clearSelection(): void {
    if (this.isProcessing) return;

    this.selectedTasks = [];
    this.selectedOriginalTask = null;
    this.selectedAction = null;
    this.activeAccordionPhone = null;
    this.updateValidOriginalTasks();
  }

  // === Action Handler ===
  handleUpdateAction(): void {
    if (
      !this.activeAccordionPhone ||
      !this.selectedOriginalTask ||
      !this.selectedAction
    ) {
      this.toastr.warning('Vui lòng chọn tác vụ gốc và hành động');
      return;
    }

    if (this.isProcessing) return;

    const taskIdsToDelete = this.selectedTasks.filter(
      (id) => id !== this.selectedOriginalTask,
    );

    if (this.selectedAction === 'keepOriginal') {
      if (taskIdsToDelete.length === 0) {
        this.toastr.warning('Không có tác vụ nào khác để xoá');
        return;
      }

      this.isProcessing = true;
      this.autoTaskService.task
        .mergeDuplicatedPhone({taskIds: taskIdsToDelete})
        .subscribe({
          next: (res) => {
            this.isProcessing = false;
            if (res.status === 200) {
              this.toastr.success('Đã nhận yêu cầu xử lý');
              this.refreshData();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => {
            this.isProcessing = false;
            this.commonService.handleErr(err);
          },
        });
    }
  }

  // === Reset Methods ===
  private resetSelectionState(): void {
    this.selectedTasks = [];
    this.tasksByPhone = {};
    this.activeAccordionPhone = null;
    this.selectedOriginalTask = null;
    this.selectedAction = null;
    this.accordionStates = {};
    this.validOriginalTasks = [];
  }

  private refreshData(): void {
    this.resetSelectionState();
  }

  // === Utils ===
  trackByFn(_index: number, task: ITaskInfo): string {
    return task?.id;
  }

  handleViewTask(taskId: string): void {
    let url = `${environment.urlDomain}/${this.currentBiz?.alias}/auto-task/dashboard?id=${taskId}`;
    window.open(url, '_blank');
  }
}
