import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ETaskChainType,
  IAddTaskChainDto,
  IChainAct,
  ITask,
  ITaskChain,
  ITaskChainResult,
  ITaskDto,
  ModifiedUserUnit,
} from '@app/types/flow';
import {debounceTime, finalize, Subject, take, takeUntil} from 'rxjs';
import {FormArray, FormGroup, ValidationErrors} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {
  ERole,
  ESocialPlatform,
  ITag,
  OrderPlatformSource,
  User,
} from '@app/types/viewmodels';
import {intersection, isEmpty} from 'lodash';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';
import {environment} from '../../../../../environments/environment';
import {ToastrService} from 'ngx-toastr';
import {CustomerInfoComponent} from '@main/dashboard/content-modal/customer-info/customer-info.component';
import {
  EPerActTask,
  ISettingTabItem,
  ISource,
  IUpdateSourceDto,
} from '@app/types/setting';
import {NgSelectComponent} from '@ng-select/ng-select';
import {ETabTaskDetail} from '@app/types/task';
import {MainService} from '@app/services/api/main.service';
import {DetailTaskPerms} from '@main/dashboard/content-modal/modal-update-task/detail-task-perms';
import {TreeNodeSelectEvent, TreeNodeUnSelectEvent} from 'primeng/tree';
import {ModalCloneComponent} from '../multiple-action/modal-clone/modal-clone.component';
import {ActivatedRoute, Router} from '@angular/router';
import {SocketService} from '@app/services/api/socket.service';
import {ModalCloseTaskComponent} from '../modal-close-task/modal-close-task.component';
import {DEFAULT_TASK_TABS} from '@app/main/setting/tab-display/tab-display.variable';

declare function smaxCallSdkMakeCall(callInfo: any): void;
declare function smaxCallSdkClearCall(): void;

declare function smaxCallSdkMakeCall(callInfo: any): void;
declare function smaxCallSdkClearCall(): void;

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './modal-update-task-v2.component.html',
  styleUrls: ['./modal-update-task-v2.component.scss'],
})
export class ModalUpdateTaskComponent
  extends DetailTaskPerms
  implements OnInit
{
  @ViewChild('templateAddTaskChain') templateAddTaskChain!: TemplateRef<any>;
  public addTaskChainModalRef?: BsModalRef;

  @ViewChild('ngSelectTagTask') ngSelectTagTask!: NgSelectComponent;
  // Call to clear
  @ViewChild(CustomerInfoComponent)
  customerInfoComponent!: CustomerInfoComponent;

  @Input() sourceData?: ITask;
  @Input() taskId?: string;
  @Input() code?: string;
  @Input() leadData?: any;
  @Input() leadId?: string;
  @Output() updateSuccess = new EventEmitter();
  @Output() createdTask = new EventEmitter<ITask>();
  @Output() updatedTask = new EventEmitter<ITask>();
  @Output() deleteTask = new EventEmitter<string>();

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    try {
      if (typeof smaxCallSdkClearCall === 'function') {
        smaxCallSdkClearCall();
        console.info('smaxCallSdkClearCall called');
      } else {
        console.error('smaxCallSdkClearCall fn not found');
      }
    } catch (error) {
      console.error('smaxCallSdkClearCall error', error);
    }
    this.resetTaskSubject$.complete();
  }

  public selectTag: boolean = false;
  public submittedModal = {
    addTaskChain: false,
    dropTask: false,
  };

  public isOpenBackDrop: boolean = false;
  public listBizUsers: User[] = [];
  public units = this.autoTaskService.getUserUnits(false);

  protected readonly ETabTaskDetail = ETabTaskDetail;
  protected readonly ETaskChainType = ETaskChainType;
  protected hasPermitSmsOttCall =
    this.authService.checkPermittedModule('sms-ott-call');
  protected readonly ERole = ERole;

  private resetTaskSubject$ = new Subject<string>();

  public tabsMenu = {
    left: [] as ISettingTabItem[],
    right: [] as ISettingTabItem[],
  };
  public activeLeftTabMenu!: ISettingTabItem;
  public activeRightTabMenu!: ISettingTabItem;
  public isShowLeftTab: boolean = true;

  constructor(
    private readonly modalRef: BsModalRef,
    private readonly modalService: BsModalService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toastr: ToastrService,
    private readonly mainService: MainService,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    private socketService: SocketService,
    private readonly router: Router,
  ) {
    super();
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.updateForm.patchValue({
          counselorId: biz.user?.id,
        } as any);
        this.listBizUsers = biz.users;
        this.currentBiz = biz;
      });

    this.autoTaskService.currentActiveViewMode.subscribe((mode) => {
      this.currentActiveViewMode = mode;
    });

    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.activeTab = fragment as ETabTaskDetail;
      }
    });

    const isShowLeftTab = localStorage.getItem('isShowLeftTab');
    if (isShowLeftTab) {
      this.isShowLeftTab = isShowLeftTab === 'true';
    }

    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.tabsMenu.left = (res.taskTabs || []).filter(
            (tab) => (tab.positions || []).includes('left') && tab.active,
          );
          this.tabsMenu.right = (res.taskTabs || []).filter(
            (tab) => (tab.positions || []).includes('right') && tab.active,
          );
          if (isEmpty(this.tabsMenu.left)) {
            this.tabsMenu.left = DEFAULT_TASK_TABS.filter(
              (tab) => tab.positions.includes('left') && tab.active,
            );
          }
          if (isEmpty(this.tabsMenu.right)) {
            this.tabsMenu.right = DEFAULT_TASK_TABS.filter(
              (tab) => tab.positions.includes('right') && tab.active,
            );
          }

          this.activeLeftTabMenu = this.tabsMenu.left[0];
          this.activeRightTabMenu = this.tabsMenu.right[0];
        }
      });
  }

  override async ngOnInit() {
    this.resetTaskSubject$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe({
        next: (v) => {
          this.getDetailTask(true);
        },
        error: (err) => console.error('err', err),
      });
    this.loading.modal = true;
    this.setupSocketListeners();
    // const autoTaskSettingRes = await lastValueFrom(this.getAutoTaskSetting());
    // if (autoTaskSettingRes && autoTaskSettingRes.status === 200) {
    //   this.autoTaskSetting = autoTaskSettingRes.data;
    // } else {
    //   this.commonService.handleResErr(autoTaskSettingRes);
    // }
    if (!this.sourceData && !this.taskId && !this.code) {
      this.loading.modal = false;
      if (this.leadData) {
        this.patchFormWithLeadData();
      } else {
        this.patchForm();
      }
    }
    this.handleCheckPermission();
    if (this.code) {
      this.getTaskByCode();
    } else {
      this.getDetailTask();
    }
    this.getBlock();
  }

  private async setupSocketListeners(): Promise<void> {
    try {
      // Chờ socket sẵn sàng trước khi listen
      await this.socketService.waitForSocket();

      // Listen to task synchronized events
      this.socketService.listen('task/SYNCHRONIZED').subscribe((data) => {
        if (data.task?.id === this.sourceData?.id) {
          Object.assign(this.sourceData || {}, data.task || {});
          this.patchForm(this.sourceData);
        }
      });

      // Listen to app error events
      this.socketService
        .listen('app/ERROR')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          console.warn('app/ERROR', data);
          this.toastr.warning(data?.message);
        });
    } catch (error) {
      console.error('Failed to setup socket listeners:', error);
    }
  }

  public generateResetTaskKey(): string {
    const bizId = this.currentBiz?.id ?? 'unknown-biz';
    const userId = this.currentUser?.id ?? 'unknown-user';
    const sourceId = this.sourceData?.id ?? 'unknown-source';
    return `reset-task:${bizId}:${userId}:${sourceId}`;
  }

  handleResetTask(taskKey: any) {
    this.resetTaskSubject$.next(taskKey);
  }

  getDetailTask(isRefresh = false) {
    if (!this.sourceData?.id && !this.taskId) return;
    this.loading.getDetail = true;
    this.autoTaskService.task
      .getOne(this.sourceData?.id ?? this.taskId!)
      .pipe(
        finalize(() => (this.loading.getDetail = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            const unitId =
              res.data?.branch?.team ||
              res.data?.branch?.department ||
              res.data?.branch?.id;
            if (!this.authService.hasPerRole(unitId, EPerActTask.UPDATE_TASK)) {
              this.toastr.warning(
                'Bạn không có quyền cập nhật task ở chi nhánh này <3',
              );
              this.hideModal();
              return;
            }

            this.sourceData = res.data;
            this.patchForm(res.data);
            if (isRefresh) {
              this.customerInfoComponent?.handleClearSelectValue();

              // Reload lead data if task has leadId
              if (res.data.leadId) {
                this.loadLeadDataForTask(res.data.leadId);
              }
            }

            const isTaskClosed = this.sourceData?.isTaskClosed ?? false;
            if (isTaskClosed) {
              this.f['branch'].disable();
            } else {
              this.f['branch'].enable();
            }
          } else {
            this.toastr.error('Không tìm thấy dữ liệu');
            this.hideModal();
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
          this.hideModal();
        },
      });
  }

  private loadLeadDataForTask(leadId: string) {
    this.leadService.lead
      .getById(leadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            const leadData = res.data;

            // Update form with lead status and tags
            this.updateForm.patchValue({
              leadDeal: {
                ...this.updateForm.value.leadDeal,
                leadStatusId: (leadData.statusId || null) as any,
                leadTags: (leadData.tagIds || null) as any,
              },
            });

            // Set leadId for customer-info component and load statuses/tags
            if (this.customerInfoComponent) {
              this.customerInfoComponent.leadId = leadId;
              // Update original values for revert functionality
              this.customerInfoComponent.originalLeadStatusId =
                leadData.statusId || null;
              this.customerInfoComponent.originalLeadTags =
                leadData.tagIds || [];
              this.customerInfoComponent.loadLeadStatusesAndTags();
            }
          }
        },
        error: (err) => {
          console.error('Error loading lead data:', err);
        },
      });
  }

  patchFormWithLeadData() {
    if (!this.leadData) return;

    // Map lead data to form
    const leadDealData = {
      id: null, // Set id to null instead of leadId
      type: 'LEAD',
      name: this.leadData.name,
      picture: this.leadData.picture,
      gender: this.leadData.gender || 'other',
      phone: this.leadData.phone,
      email: this.leadData.email,
      address: this.leadData.address,
      street: this.leadData.street,
      tags: this.leadData.tagIds,
      ward: this.leadData.ward,
      wardCode: this.leadData.wardCode,
      district: this.leadData.district,
      districtCode: this.leadData.districtCode,
      province: this.leadData.province,
      provinceCode: this.leadData.provinceCode,
    };

    this.updateForm.patchValue({
      name: `Task từ lead: ${this.leadData.name}`,
      note: this.leadData.note || '',
      leadId: this.leadData.id, // Add leadId as separate field
      leadDeal: {
        ...leadDealData,
        leadStatusId: this.leadData.statusId,
        leadTags: this.leadData.tagIds || [],
      },
    } as any);

    // Set default branch if available
    let branch = this.autoTaskService.getFirstUnit();
    if (this.currentActiveViewMode?.options?.branchIds) {
      const branchUnit = this.autoTaskService.getFirstUnitByIds(
        this.currentActiveViewMode.options.branchIds,
      );
      if (branchUnit) {
        branch = branchUnit;
      }
    }
    if (branch) {
      this.updateForm.patchValue({branch} as any);
      this.getInfoUnit(branch?.team || branch?.department || branch?.id);
    }
  }

  getTaskByCode() {
    this.loading.getDetail = true;
    this.autoTaskService.task
      .get({filter: JSON.stringify({codeIn: [this.code]}), page: 1, limit: 1})
      .pipe(
        finalize(() => (this.loading.getDetail = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          const detailTask = res?.data?.[0];
          if (res.status === 200 && detailTask) {
            this.sourceData = detailTask;
            this.patchForm(detailTask);
          } else {
            this.toastr.error('Không tìm thấy dữ liệu');
            this.hideModal();
          }
        },
      });
  }

  onChooseTeam(index: number, user: User) {
    this.formTeams.at(index).patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  onRemoveTeam(index: number) {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }

  changeSelectTag(action: boolean) {
    this.selectTag = action;
    if (this.sourceData?.id) {
      this.updateForm.patchValue({
        tags:
          (this.tags.rows
            .filter((tag) => this.sourceData?.tags?.includes(tag.id as any))
            ?.map((tag) => tag.id) as any) || null,
      });
    }
  }

  createNewTagAndChoose(tag: any) {
    if (tag?.id || !tag?.name) return;
    const body: ITag = {
      name: tag?.name,
      bgColor: '#000000',
      applyFor: 'TASK',
    };
    this.autoTaskService.tag
      .create(body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            // this.getTag();
            this.ngSelectTagTask.filter('');
            this.tags.rows.push(res.data);
            Object.assign(tag, res.data);

            let formTag: string[] = this.updateForm.value.tags || [];
            formTag.push(res.data.id as any);
            formTag = formTag.filter((tag) => tag !== undefined);
            this.updateForm.patchValue({
              tags: formTag as any,
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleCreateSourceForm(): Promise<ISource | null> {
    return new Promise((resolve, reject) => {
      this.autoTaskService.source
        .create(this.updateForm.value.sourceForm as unknown as IUpdateSourceDto)
        .pipe(take(1), takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.getSource();
              resolve(res.data);
            } else {
              this.commonService.handleResErr(res);
              reject(res);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
            reject(err);
          },
        });
    });
  }

  handleChangePlatFormSource(data: OrderPlatformSource[]) {
    this.updateForm.patchValue({
      platformSourceIds: data.map((item) => item.id),
      platformSources: data,
    } as any);
  }

  async handleUpdate() {
    const branchForm = this.f['branch'].value;
    const sourceForm = this.f['sourceForm'].value;

    if (
      !this.sourceData?.id &&
      !this.authService.hasPerRole(branchForm?.data, EPerActTask.CREATE_TASK)
    ) {
      this.toastr.warning('Bạn không có quyền tạo tác vụ cho chi nhánh này <3');
      return;
    }

    if (sourceForm) {
      const newSource = await this.handleCreateSourceForm();
      if (!newSource) return;
      this.updateForm.patchValue({
        sourceId: newSource.id,
        sourceForm: null,
      } as any);
    }

    const body: ITaskDto | any = {
      ...this.updateForm.value,
      branch: branchForm
        ? {
            unit: branchForm.level,
            id: branchForm.id,
            name: branchForm.name,
            department: branchForm.department,
            departmentName: branchForm.departmentName,
            team: branchForm.team,
            teamName: branchForm.teamName,
          }
        : null,
    };

    // Add leadId if creating task from lead
    if (this.leadData?.id && !this.sourceData?.id) {
      body.leadId = this.leadData.id;
    }

    this.loading.submit = true;
    const taskObservable = this.sourceData?.id
      ? this.autoTaskService.task.update(this.sourceData.id, body)
      : this.autoTaskService.task.create(body);

    if (this.sourceData?.id) delete body.addChainActIds;
    else delete body.taskChains;

    return new Promise((resolve, reject) => {
      taskObservable
        .pipe(
          finalize(() => (this.loading.submit = false)),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.commonService.handleResSuccess(
                this.sourceData?.id ? 'update' : 'create',
              );
              if (this.sourceData?.id) {
                this.updatedTask.emit(res.data);
              } else {
                this.createdTask.emit(res.data);
              }
              this.sourceData = res.data;
              this.patchForm(res.data);
              resolve(res.data);
              // this.getDetailTask();
            } else {
              this.handleErrorResponse(res, reject);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
            reject(err);
          },
        });
    });
  }

  private handleErrorResponse(res: any, reject: (reason?: any) => void) {
    reject(res);
    if (res.subStatus === 'CUSTOMER.DATA_ERROR') {
      (res.data as any[]).forEach((err) => {
        if (err?.response?.subStatus === 'CUSTOMER.ADD_LIMIT') {
          this.toastr.error(
            'Số lượng Khách hàng đã đạt giới hạn của gói cước. Không thể tạo thêm bản ghi mới.',
          );
        } else {
          this.commonService.handleResErr(res);
        }
      });
    } else {
      this.commonService.handleResErr(res);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    } else {
      this.toastr.warning('Vui lòng điền đầy đủ thông tin');
    }
  }

  // Get form errors
  getFormErrors(formGroup: FormGroup | FormArray): {[key: string]: any} {
    let errors: {[key: string]: any} = {}; // Add index signature to errors object
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        errors[key] = this.getFormErrors(control);
      } else {
        const controlErrors: ValidationErrors | null = control?.errors ?? null;
        if (controlErrors != null) {
          errors[key] = controlErrors;
        }
      }
    });
    return errors;
  }

  handleDeleteTask() {
    const unitId =
      this.sourceData?.branch?.team ||
      this.sourceData?.branch?.department ||
      this.sourceData?.branch?.id;
    if (!this.authService.hasPerRole(unitId!, EPerActTask.DELETE_TASK)) {
      this.toastr.warning('Bạn không có quyền xóa task này <3');
      return;
    }

    const title = 'Xóa Tác vụ';
    const description = `Bạn sắp xóa Tác vụ <b>${
      this.sourceData?.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: this.sourceData,
      errorState:
        'Cẩn trọng với thao tác xóa Tác vụ. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteTask(this.sourceData!);
    });
  }

  onDeleteTask(value: ITask) {
    if (!value?.id) return;
    this.loading.deleteTask = true;
    this.autoTaskService.task
      .delete(value.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.deleteTask.emit(value.id);
            this.hideModal();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleAddTaskChain() {
    this.isOpenBackDrop = true;
    this.addTaskChainModalRef = this.modalService.show(
      this.templateAddTaskChain,
      {
        class: 'modal-dialog-centered modal-add-chain',
      },
    );
    this.addTaskChainModalRef?.onHide
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOpenBackDrop = false;
        this.submittedModal.addTaskChain = false;
        this.addTaskChainForm.patchValue({
          addChainActIds: null,
        });
      });
  }

  onAddTaskChain() {
    this.submittedModal.addTaskChain = true;
    if (this.addTaskChainForm.invalid) return;
    if (this.sourceData?.id) {
      const body = {
        addChainActIds: (this.addTaskChainForm.value?.addChainActIds ||
          []) as unknown as string[],
      } as unknown as IAddTaskChainDto;

      this.loading.addTaskChain = true;
      this.autoTaskService.task
        .updateTaskChain(this.sourceData.id!, body)
        .pipe(
          finalize(() => (this.loading.addTaskChain = false)),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              // this.getDetailTask();
              // this.updateSuccess.emit();
              this.sourceData = res.data;
              this.patchForm(res.data);
              this.addTaskChainModalRef?.hide();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
          },
        });
    } else {
      const newAddChainActIds =
        this.addTaskChainForm.value?.addChainActIds || [];
      const oldAddChainActIds = this.updateForm.value?.addChainActIds || [];
      if (intersection(newAddChainActIds, oldAddChainActIds)?.length > 0) {
        this.toastr.warning('Chuỗi hành động đã tồn tại, vui lòng chọn lại!');
        return;
      }
      this.updateForm.patchValue({
        addChainActIds: [...oldAddChainActIds, ...newAddChainActIds],
      } as any);
      newAddChainActIds.forEach((chainActId) => {
        const taskChainForm = this.fb.group({
          chainActId: chainActId,
          status: 'open',
          taskChainResults: this.fb.array([]),
          name:
            this.actionChains.rows.find((chain) => chain.id === chainActId)
              ?.name || '-',
        });
        this.formTaskChains.push(taskChainForm);
      });
      this.addTaskChainModalRef?.hide();
    }
  }

  handleCloseChain(event: any, taskChain: ITaskChain) {
    event.preventDefault();
    event.stopPropagation();
    const title = 'Đóng chuỗi';
    const description = `Bạn sắp đóng chuỗi <b>${
      taskChain.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xác nhận';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: taskChain,
      errorState:
        'Cẩn trọng với thao tác đóng chuỗi. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onCloseChain(taskChain);
    });
  }

  onCloseChain(value: ITaskChain) {
    this.loading.closeChainTask = true;
    this.autoTaskService.taskChain
      .closeChain(value.id)
      .pipe(
        finalize(() => (this.loading.closeChainTask = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            // this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleDeleteChain(event: any, taskChain: ITaskChain, chainIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    if (this.sourceData?.id) {
      const title = 'Xóa chuỗi';
      const description = `Bạn sắp xóa chuỗi <b>${
        taskChain.name || ''
      }</b>, hành động này không thể hoàn tác.`;
      const okText = 'Xác nhận';

      const modalContent: IModalConfirmContent = {
        title,
        description,
        okText,
        type: 'warning',
        modalType: 'advance',
        context: taskChain,
        errorState:
          'Cẩn trọng với thao tác đóng chuỗi. Các module khác đang sử dụng dữ liệu\n' +
          '      của bản ghi cũng sẽ bị ảnh hưởng.',
      };
      this.modalConfirmService.openModal(modalContent, undefined, () => {
        this.onDeleteChain(taskChain);
      });
    } else {
      const addChainActIds = this.updateForm.value?.addChainActIds || [];
      this.formTaskChains.removeAt(chainIndex);
      this.updateForm.patchValue({
        addChainActIds: addChainActIds.filter(
          (id: string) => id !== taskChain.chainActId,
        ),
      } as any);
    }
  }

  onDeleteChain(value: ITaskChain) {
    if (this.loading.deleteChainTask) return;
    this.loading.deleteChainTask = true;
    this.autoTaskService.taskChain
      .delete(value.id)
      .pipe(
        finalize(() => (this.loading.deleteChainTask = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            // this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdateNextStep(
    value: {
      taskChainResultIndex: number;
      nextStepIndex?: number;
      value?: ITaskChainResult;
    },
    taskChain: any,
    chainIndex: number,
  ) {
    this.isOpenBackDrop = true;
    const actionOfChain =
      taskChain?.taskChainResults?.[value.taskChainResultIndex]?.action;
    const actionData = value?.value?.childNextAction;
    const chainActId = taskChain.chainActId;
    const modalUpdateNextStep = this.modalService.show(
      UpdateActionInTaskChainComponent,
      {
        initialState: {
          taskChains: this.sourceData?.taskChains || [],
          actionOfChain,
          sourceData: actionData,
          results: this.results.rows,
          blocks: this.blocks.rows,
          actionChains: this.actionChains.rows
            .map((chain) => {
              return {
                ...chain,
                actionResults: chain.actionResults?.map((actResult) => {
                  return {
                    ...actResult,
                    chainAct: {
                      id: chain.id,
                      name: chain.name,
                    },
                    action: {
                      ...actResult.action,
                    },
                  };
                }),
              };
            })
            .filter(Boolean) as unknown as IChainAct[],
          chainActId,
          loadingData: {
            results: this.results.loading,
            blocks: this.blocks.loading,
            actionChains: this.actionChains.loading,
          },
        },
        class: 'modal-dialog-centered modal-update-next-step',
      },
    );
    modalUpdateNextStep.onHide
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isOpenBackDrop = false));
    modalUpdateNextStep.content?.updateSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe((dataStepForm) => {
        try {
          if (value) {
            const formSteps = this.formNextSteps(
              chainIndex,
              value.taskChainResultIndex,
            );
            if (value.nextStepIndex !== undefined && value.nextStepIndex >= 0) {
              formSteps.at(value.nextStepIndex!).patchValue({
                ...dataStepForm,
                childNextAction: {
                  ...dataStepForm,
                },
              });
            } else {
              formSteps.push(
                this.fb.group({
                  ...dataStepForm,
                  closeCloneTask: [dataStepForm.closeCloneTask],
                  childNextAction: {
                    ...dataStepForm,
                    closeCloneTask: dataStepForm.closeCloneTask,
                  },
                }),
              );
            }
            // Cập nhật formSteps để báo hiệu cho form là có sự thay đổi
            const taskChainForm = this.formTaskChains.at(chainIndex);
            const updatedTaskChain = JSON.parse(
              JSON.stringify(taskChainForm.value),
            );
            taskChainForm.patchValue(updatedTaskChain);
          }
        } catch (e) {
          console.log(e);
        }
      });
    modalUpdateNextStep.content?.deleteEvent.pipe().subscribe(() => {
      if (value) {
        const formSteps = this.formNextSteps(
          chainIndex,
          value.taskChainResultIndex,
        );
        if (value.nextStepIndex !== undefined && value.nextStepIndex >= 0) {
          formSteps.removeAt(value.nextStepIndex!);
          // Cập nhật formSteps để báo hiệu cho form là có sự thay đổi
          const taskChainForm = this.formTaskChains.at(chainIndex);
          const updatedTaskChain = JSON.parse(
            JSON.stringify(taskChainForm.value),
          );
          taskChainForm.patchValue(updatedTaskChain);
        }
      }
    });

    // Cập nhật formSteps để báo hiệu cho form là có sự thay đổi
    const taskChainForm = this.formTaskChains.at(chainIndex);
    const updatedTaskChain = JSON.parse(JSON.stringify(taskChainForm.value));
    taskChainForm.patchValue(updatedTaskChain);
  }

  handleViewCreatedOrder() {
    let url = `${environment.urlDomain}/${
      this.currentBiz!.alias
    }/sale-center/?sourceId=${this.sourceData?.id}`;
    window.open(url, '_blank');
  }

  handleViewCreatedBooking() {
    let url = `${environment.urlDomain}/${
      this.currentBiz!.alias
    }/booking/booking-list/?taskId=${this.sourceData?.id}`;
    window.open(url, '_blank');
  }

  handleViewCallSmsOtt() {
    let url = `${environment.urlDomain}/${
      this.currentBiz!.alias
    }/sms-ott-call/history/?taskCode=${this.sourceData?.code}`;
    window.open(url, '_blank');
  }

  async handleCreateTaskOrder() {
    if (!this.sourceData?.id || this.loading.createOrder) return;
    this.loading.createOrder = true;
    try {
      this.submitted = true;
      if (this.updateForm.invalid) return;
      await this.handleUpdate();
    } catch (e) {
      this.loading.createOrder = false;
      console.log(e);
      return;
    }
    this.autoTaskService.task
      .createOrder(this.sourceData?.id!)
      .pipe(
        finalize(() => (this.loading.createOrder = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess(
              undefined,
              'Tạo đơn hàng thành công',
            );
            // this.orders.rows = [{} as any];
            // this.updateSuccess.emit();
            // this.getDetailTask();
            // this.handleAction
            this.getOrderDetail(res.data?.orderIds);
          } else {
            if (res.data as any) {
              res.data?.forEach((err: any) => {
                if (err.response) {
                  this.toastr.error(err.response.message);
                  return;
                }
              });
            } else {
              this.commonService.handleResErr(res);
            }
          }
        },
      });
  }

  /**
   * @param taskChain - Chuỗi hiện tại - nơi chứa nút gọi
   */
  handleCall(taskChain?: ITaskChain, event?: ITaskChainResult) {
    if (!taskChain || !event) {
      alert('Có lỗi xảy ra');
      console.warn('taskChain or event is undefined', {taskChain, event});
      return;
    }

    if (!this.hasPermitSmsOttCall) {
      this.toastr.warning(
        'Bạn không có quyền sử dụng module SMS-OTT-CALL. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
      );
      return;
    }
    try {
      var stream: any;
      navigator.mediaDevices
        .getUserMedia({audio: true})
        .then(
          (s) => (stream = s),
          (e) => {
            console.log(e);
            this.toastr.warning(
              'Vui lòng cho phép cuộc gọi kết nối vào thiết bị nghe gọi',
            );
          },
        )
        .then(() => navigator.mediaDevices.enumerateDevices())
        .then((devices) => {
          console.log('devices', devices);
          if (!devices.length) {
            this.toastr.warning('Vui lòng kết nối thiết bị nghe gọi');
            return;
          } else {
            const audio = devices.filter((e) => {
              return e.kind === 'audioinput';
            });

            const result = audio.every((e) => {
              return e.label !== '';
            });

            console.log('result', result);
            if (!result) {
              return;
            }
            const {phone} = this.formLeadDeal.value;
            if (!phone) {
              this.toastr.warning('Không có số điện thoại của khách hàng');
              return;
            }
            // const connectedPhone =
            //   this.phoneCallService.getConnectedPhoneValue();
            // if (!connectedPhone) {
            //   this.toastr.warning('Bạn chưa kết nối đầu số!');
            //   return;
            // }
            // this.isOpenBackDrop = true;
            // const modalCall = this.modalService.show(
            //   ModalConfirmCallComponent,
            //   {
            //     class: 'modal-dialog-centered',
            //     initialState: {
            //       customer: this.formLeadDeal.value,
            //       task: this.sourceData,
            //       connectedPhone,
            //     },
            //   },
            // );
            // modalCall.onHide?.pipe(takeUntil(this.destroy$)).subscribe(() => {
            //   this.isOpenBackDrop = false;
            // });

            smaxCallSdkMakeCall({
              phone: phone,
              data: {
                id: this.sourceData ? this.sourceData.id : '',
                module: environment.module,
                code: this.sourceData ? this.sourceData.code : '',
                taskChainId: taskChain.id,
                taskChainName: taskChain.name,
                actionId: event.action?.id,
                actionName: event.action?.name,
              },
            });
            // this.phoneCallService.setMakeCall({
            //   customer: this.formLeadDeal.value,
            //   task: this.sourceData,
            //   connectedPhone
            // })
          }
        })
        .catch((e) => console.log(e));
    } catch (e) {
      console.log(e);
    }
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastr.success('Sao chép thành công');
  }

  handleChangeUnit(value: TreeNodeSelectEvent | TreeNodeUnSelectEvent) {
    const node = value.node as ModifiedUserUnit;
    this.getInfoUnit(node?.team || node?.department || node?.id);
    // this.formTeams.controls?.forEach((form) => {
    //   form.patchValue({
    //     userId: null,
    //   });
    // });
  }

  preventUnselect(value: TreeNodeUnSelectEvent) {
    const currentBranchValue = this.updateForm.get('branch')?.value;
    if (currentBranchValue) {
      setTimeout(() => {
        this.updateForm.patchValue({
          branch: currentBranchValue,
        });
      }, 0);
    }
  }

  handleChangeChatLink() {
    const chatLink = this.updateForm.value?.chatLink;
    if (chatLink) {
      let link = chatLink || '';
      // for
      const regexMessPancake = /(pancake).+\?c_id=([0-5][0-9]*_[0-9]*)/i;
      const regexCommentSmaxAI =
        /(smax\.ai).+(fb?[0-9]*)\?tid=(fb?[0-9]*_fb?[0-9]*)/i;
      const regexMessSmaxAI = /(smax\.ai).+(fb?[0-9]*)\?tid=(fb?[0-9]*)/i;
      const regexURLSmax = /(smax\.ai).+(fb?[0-9]*)/i;

      let pageId: any = null;
      let messId = null;
      let platform = null;
      if (regexURLSmax.test(link)) {
        const matchSmaxAI = regexURLSmax.exec(link);
        pageId = matchSmaxAI?.[2]?.replace(/[^\d]/gim, '');

        if (regexMessSmaxAI.test(link)) {
          const matchMessSmaxAI = regexMessSmaxAI.exec(link);
          pageId = matchMessSmaxAI?.[2]?.replace(/[^\d]/gim, '');
          messId = matchMessSmaxAI?.[3]?.replace(/[^\d]/gim, '');
        }

        if (regexCommentSmaxAI.test(link)) {
          const matchCmtSmaxAI = regexCommentSmaxAI.exec(link);
          let cmt = matchCmtSmaxAI?.[3];
          if (cmt) {
            cmt = cmt.split('_')?.[1];
            messId = cmt?.replace(/[^\d]/gim, '');
          }
        }
        platform = 'SMAXAI';
      }

      if (regexMessPancake.test(link)) {
        const matchCmtPancake = regexMessPancake.exec(link);
        let cmt = matchCmtPancake?.[2]?.split('_');
        if (cmt?.length === 2) {
          pageId = cmt[0].replace(/[^\d]/gim, '');
          messId = cmt[1].replace(/[^\d]/gim, '');
        }
        platform = 'PANCAKE';
      }

      if (pageId) {
        const hasPage = this.sources.rows.find((p) => p.platformId === pageId);
        let platformSource: any = hasPage as ISource;
        if (!hasPage) {
          platformSource = {
            id: pageId,
            name: 'Facebook Page',
            platform: ESocialPlatform.FACEBOOK,
            platformId: pageId,
            picture: `https://graph.facebook.com/${pageId}/picture?width=300&height=300`,
          };
          this.sources.rows.push(platformSource);
          this.updateForm.patchValue({
            sourceForm: platformSource,
          });
        } else {
          this.updateForm.patchValue({
            sourceForm: null,
          });
        }

        this.updateForm.patchValue({
          sourceId: platformSource.id,
        });
      }
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

    modalClone.onHide?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOpenBackDrop = false;
    });
  }

  cloneTask(id: string, options: string[]) {
    this.autoTaskService.task
      .clone(id, {
        options: options,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastrService.success('Sao chép tác vụ thành công');

            this.createdTask.emit(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleActiveTabChange(tab: ETabTaskDetail) {
    if (tab === ETabTaskDetail.INFO) {
      this.getDetailTask(true);
    } else if (tab === ETabTaskDetail.ORDER) {
      if (this.sourceData?.orderIds.length) {
        this.getOrderDetail(this.sourceData?.orderIds!);
      }
    } else if (tab === ETabTaskDetail.BOOKING) {
      if (this.sourceData?.bookingIds.length) {
        this.getBookingDetail(this.sourceData?.bookingIds!);
      }
    }
  }

  handleUpdateTaskChainData(taskChain: ITaskChain, chainIndex: number) {
    if (this.sourceData && taskChain) {
      this.sourceData.taskChains[chainIndex] = taskChain;

      // setTimeout(() => {
      //   this.getDetailTask(true)
      //   this.updatedTask.emit(this.sourceData);
      // }, 3000);
    }
  }

  handleDropTask(id?: string) {
    if (!id) return;
    this.submittedModal.dropTask = true;
    this.autoTaskService.task
      .dropTask(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.submittedModal.dropTask = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.toastrService.success('Thả số thành công');
            this.sourceData = res.data;
            this.patchForm(res.data);
            this.updatedTask.emit(res.data);
          } else {
            this.toastrService.error(
              'Bạn không nằm trong vai trò được phép thả số',
            );
          }
        },
      });
  }

  onConfirmToCloseTask() {
    this.handleCloseTask();
  }

  get taskHasNoChainOpen(): boolean {
    return (
      (this.sourceData?.taskChains || []).every(
        (chain) => chain.status === ETaskChainType.CLOSED,
      ) ?? true
    );
  }

  handleConfirmToCloseTask(event: any): void {
    if (!this.sourceData?.id) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Count uncompleted chains
    const uncompletedChainCount =
      (this.sourceData.taskChains || [])?.filter(
        (chain) => chain.status !== ETaskChainType.CLOSED,
      ).length || 0;

    const modalContent: IModalConfirmContent = {
      title: 'Đóng tác vụ?',
      description: `Bạn sắp đóng tác vụ, hành động này không thể hoàn tác.`,
      okText: 'Đóng tác vụ',
      type: 'warning',
      modalType: 'advance',
      errorState: `Tác vụ này vẫn còn ${uncompletedChainCount} chuỗi chưa hoàn tất. Bạn có chắc chắn muốn đóng tác vụ không?`,
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onConfirmToCloseTask();
    });
  }

  protected modalCloseTask?: BsModalRef;
  handleCloseTask(): void {
    if (!this.sourceData?.id) {
      return;
    }

    this.isOpenBackDrop = true;
    this.modalCloseTask = this.modalService.show(ModalCloseTaskComponent, {
      class: 'modal-dialog-centered',
      initialState: {
        task: this.sourceData,
      },
    });

    this.modalCloseTask.onHide?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.modalCloseTask = undefined;
      this.isOpenBackDrop = false;
    });

    this.modalCloseTask.content?.closeTaskSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (!res.success) {
          this.toastrService.warning(res.message);
          return;
        }

        this.updateForm.patchValue({
          isTaskClosed: res.data?.isTaskClosed,
          closeTaskResult: res.data?.closeTaskResult,
          closeTaskReason: res.data?.closeTaskReason,
        });
        this.updatedTask.emit(res.data);
      });
  }

  get isTaskClosed(): boolean {
    return this.sourceData?.isTaskClosed ?? false;
  }

  handleToggleLeftTab() {
    this.isShowLeftTab = !this.isShowLeftTab;
    localStorage.setItem('isShowLeftTab', this.isShowLeftTab.toString());
  }

  private applyModalDialogSize(): void {
    const modalDialog = document.querySelector('.modal-dialog');
    if (!modalDialog) {
      return;
    }
    if (!this.isShowLeftTab) {
      modalDialog.classList.add('modal-xl');
      modalDialog.classList.remove('modal-medium');
    } else {
      modalDialog.classList.remove('modal-xl');
      modalDialog.classList.add('modal-medium');
    }
  }

  navigateToTabSettings() {
    this.hideModal();

    this.router.navigate([`/setting/tab-display`], {
      fragment: 'TASK',
    });
  }
}
