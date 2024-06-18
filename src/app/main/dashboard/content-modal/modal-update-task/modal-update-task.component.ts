import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ETaskChainType,
  IAction,
  IActResult,
  IAddTaskChainDto,
  IChainAct,
  ITask,
  ITaskChain,
  ITaskChainResult,
  ITaskDto,
  ModifiedUserUnit,
} from '@app/types/flow';
import {finalize, Subject, take, takeUntil} from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {
  Biz,
  EntityPagination,
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
  ITag,
  Order,
  User,
} from '@app/types/viewmodels';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';
import {intersection, uniqBy} from 'lodash';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {calculateTime} from '@app/utils/common';
import moment from 'moment';
import {IBlockAutomation} from '@app/types/automation';
import {AutomationService} from '@app/services/api/automation.service';
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';
import {environment} from '../../../../../environments/environment';
import {ModalCallComponent} from '@main/dashboard/content-modal/modal-call/modal-call.component';
import {ToastrService} from 'ngx-toastr';
import {CustomerInfoComponent} from '@main/dashboard/content-modal/customer-info/customer-info.component';
import {
  ELevelPer,
  EPerActTask,
  EPerActType,
  ISetting,
  ISource,
} from '@app/types/setting';
import {NgSelectComponent} from '@ng-select/ng-select';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './modal-update-task.component.html',
  styleUrls: ['./modal-update-task.component.scss'],
})
export class ModalUpdateTaskComponent implements OnDestroy, OnInit {
  @ViewChild('templateAddTaskChain') templateAddTaskChain!: TemplateRef<any>;
  public addTaskChainModalRef?: BsModalRef;

  @ViewChild('ngSelectTagTask') ngSelectTagTask!: NgSelectComponent;
  // Call to clear
  @ViewChild(CustomerInfoComponent)
  customerInfoComponent!: CustomerInfoComponent;

  @Input() sourceData?: ITask;
  @Input() taskId?: string;
  @Output() updateSuccess = new EventEmitter();

  public permissions = {
    canEditAction: false,
    canEditChain: false,
    canEditDeadline: false,
    canCreateOrder: false,
  };

  public tags: EntityPagination<ITag> = {
    rows: [],
    loading: false,
  };
  public orders: EntityPagination<Order> = {
    rows: [],
    loading: false,
  };
  public selectTag: boolean = false;
  public submittedModal = {
    addTaskChain: false,
  };
  private currentBiz!: Biz;
  protected readonly ETaskChainType = ETaskChainType;
  public submitted = false;
  public updateForm = this.fb.group({
    name: ['Task mới', [Validators.required]],
    note: null,
    leadDeal: this.fb.group({
      id: null,
      type: 'LEAD',
      name: [null, [Validators.required]],
      picture: null,
      gender: 'other',
      phone: null,
      email: null,
      address: null,
      street: null,
      tags: null,
      ward: null,
      wardCode: null,
      district: null,
      districtCode: null,
      province: null,
      provinceCode: null,
    }),
    tags: null,
    taskChains: this.fb.array([]),
    cart: this.fb.group({
      products: null,
      courseEvents: null,
      beautyServices: null,
      warehouses: null,
      prepaidCards: null,
      combos: null,
    }),
    counselorId: null,
    teams: this.fb.array([]),
    sourceId: null,
    addChainActIds: null,
    branch: [null],
  });

  public addTaskChainForm = this.fb.group({
    addChainActIds: [null, [Validators.required]],
  });

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

  public sources: ICommonDataLazy<ISource, IQueryBase> = {
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
  public blocks: ICommonDataLazy<IBlockAutomation, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
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

  public dataSource: ICommonDataSource<any, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };
  public autoTaskSetting!: ISetting;

  public isOpenBackDrop: boolean = false;

  private destroy$ = new Subject();

  public loading = {
    submit: false,
    data: false,
    getDetail: false,
    addTaskChain: false,
    createOrder: false,
    deleteTask: false,
  };
  public listBizUsers: User[] = [];
  public triggerCallHistory!: any;
  public units = this.autoTaskService.getUserUnits();

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly automationService: AutomationService,
    private readonly toastr: ToastrService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.updateForm.patchValue({
          counselorId: biz.user?.id,
        } as any);
        this.listBizUsers = biz.users;
        this.currentBiz = biz;
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  get formTaskChains() {
    return <FormArray>this.updateForm.get('taskChains');
  }
  get formTeams() {
    return <FormArray>this.updateForm.get('teams');
  }

  formTaskChainResults(chainIndex: number) {
    return (<FormArray>(
      this.formTaskChains.at(chainIndex).get('taskChainResults')
    )) as FormArray;
  }
  findTag(tagId: string) {
    return this.tags.rows.find((tag) => tag.id === tagId);
  }
  formNextSteps(chainIndex: number, taskChainResultIndex: number) {
    return (<FormArray>(
      this.formTaskChainResults(chainIndex)
        .at(taskChainResultIndex)
        .get('nextActions')
    )) as FormArray;
  }

  get formLeadDeal() {
    return <FormGroup>this.updateForm.get('leadDeal');
  }

  get fAddChainModal(): {[key: string]: AbstractControl} {
    return this.addTaskChainForm.controls;
  }

  ngOnInit() {
    this.checkPermission();
    this.getDetailTask();
    if (this.sourceData) {
      this.patchForm(this.sourceData);
    }
    if (this.taskId) {
      this.getDetailTask();
    }
    this.getActionChain();
    this.getResult();
    this.getAction();
    this.getBlock();
    this.getSource();
    this.getTag();
    this.getAutoTaskSetting();
  }

  private hasPermission(permissions: any[], permission: any): boolean {
    return permissions?.some((per) => per === permission);
  }

  checkPermission() {
    const permissions = this.authService.getUserPerByType(EPerActType.TASK);
    this.permissions.canEditChain = this.hasPermission(
      permissions,
      EPerActTask.MANAGE_CHAIN,
    );
    this.permissions.canEditAction = this.hasPermission(
      permissions,
      EPerActTask.MANAGE_ACTION,
    );
    this.permissions.canEditDeadline = this.hasPermission(
      permissions,
      EPerActTask.EDIT_TIME_ACTION,
    );
  }
  getAutoTaskSetting() {
    this.autoTaskService.setting
      .retrieve({bizId: this.currentBiz.id})
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.autoTaskSetting = res.data;
            res.data.roles?.forEach((role) => {
              const findRole = this.currentBiz.roles.find((r) => r.id === role);
              let initTeam = null;
              if (!this.sourceData && findRole?.id === res.data.assignRole) {
                initTeam = {
                  userId: this.currentBiz.user.id,
                  userName: this.currentBiz.user.name,
                  userPicture: this.currentBiz.user.picture,
                  userEmail: this.currentBiz.user.email,
                };
              }

              const findTeam = this.sourceData?.teams?.find(
                (team) => team.roleId === role,
              );

              this.formTeams.push(
                this.fb.group({
                  roleId: findRole?.id,
                  roleIcon: findRole?.icon,
                  roleName: findRole?.name,
                  userId: initTeam?.userId || findTeam?.userId || null,
                  userName: initTeam?.userName || findTeam?.userName || null,
                  userPicture:
                    initTeam?.userPicture || findTeam?.userPicture || null,
                  userEmail: initTeam?.userEmail || findTeam?.userEmail || null,
                }),
              );
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }
  // getRoleById(id: string) {
  //   return this.currentBiz.roles.find((role) => role.id === id);
  // }
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
  createNewTagAndChoose(tagName: string) {
    const body: ITag = {
      name: tagName,
      bgColor: '#000000',
    };
    this.autoTaskService.tag
      .create(body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getTag();
            this.ngSelectTagTask.filter('');
            const formTag: string[] = this.updateForm.value.tags || [];
            formTag.push(res.data.id as any);
            this.updateForm.patchValue({
              tags: formTag as any,
            });
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }
  getTag() {
    this.autoTaskService.tag.get().subscribe({
      next: (res) => {
        if (res && res.status === 200) {
          this.tags.rows = res.data;
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err) => {
        this.commonService.handleErr(err);
      },
    });
  }
  getOrderDetail(orderIds: string[]) {
    this.autoTaskService.task
      .retrieveOrdersByTask({orderIds: orderIds})
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.orders.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }
  getDetailTask(isRefresh = false) {
    if (!this.sourceData?.id && !this.taskId) return;
    this.loading.getDetail = true;
    this.autoTaskService.task
      .getOne(this.sourceData?.id ?? this.taskId!)
      .pipe(finalize(() => (this.loading.getDetail = false)))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sourceData = res.data;
            if (res.data.orderIds?.length > 0) {
              this.getOrderDetail(res.data.orderIds);
            }
            this.patchForm(res.data);
            if (isRefresh) {
              this.customerInfoComponent.handleClearSelectValue();
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

  patchForm(dataSource?: ITask) {
    if (!dataSource) return;
    this.updateForm.patchValue({
      ...dataSource,
      leadDeal: {
        ...dataSource?.leadDeal,
        id: dataSource?.leadDeal?.id,
      },
      counselorId: dataSource?.counselor?.id,
    } as any);
    if (dataSource.branch) {
      const foundUnit = this.autoTaskService.findUnitFromData(
        dataSource.branch,
      );
      this.updateForm.patchValue({
        branch: foundUnit as any,
      });
    }
    this.formTaskChains.clear();
    dataSource.taskChains?.forEach((taskChain) => {
      const taskChainForm = this.fb.group({
        id: taskChain.id,
        name: taskChain.name,
        status: taskChain.status,
        chainActId: taskChain.chainActId,
        taskChainResults: this.fb.array([]),
      });
      taskChain.taskChainResults?.forEach((taskChainResult) => {
        let deadlineDay = 0;
        let deadlineHour = 0;
        let deadlineMinute = 0;
        let typeOverDeadline = 'notOver';
        if (taskChainResult.deadlineDate) {
          const executedDate = taskChainResult.executedDate || new Date();
          const subDate = calculateTime(
            taskChainResult.deadlineDate,
            executedDate,
            'metrics',
          ) as {days?: number; hours?: number; minutes?: number};
          if (
            subDate.days === 0 &&
            subDate.hours === 0 &&
            subDate.minutes === 0
          ) {
            typeOverDeadline = 'now';
          } else if (
            moment(executedDate).isAfter(taskChainResult.deadlineDate)
          ) {
            typeOverDeadline = 'over';
          }
          if (typeOverDeadline !== 'over') {
            deadlineDay = subDate.days || 0;
            deadlineHour = subDate.hours || 0;
            deadlineMinute = subDate.minutes || 0;
          }
        }
        const resultIndex = taskChainResult.results?.findIndex(
          (result) => result.result?.id === taskChainResult.result?.id,
        );
        const reasonIndex = taskChainResult.action?.reasons?.findIndex(
          (reason) => reason?.id === taskChainResult?.reason?.id,
        );
        const taskChainResultForm = this.fb.group({
          id: taskChainResult?.id,
          status: taskChainResult?.status,
          deadlineDate: taskChainResult.deadlineDate,
          executedDate: taskChainResult.executedDate,
          deadlineDay: deadlineDay,
          deadlineHour: deadlineHour,
          deadlineMinute: deadlineMinute,
          typeOverDeadline: typeOverDeadline,
          action: this.fb.group({
            id: taskChainResult?.action?.id,
            name: taskChainResult?.action?.name,
            type: taskChainResult?.action?.type,
            reasons: this.fb.array([]),
            callBlockAutomation: this.fb.group({
              blockId: taskChainResult?.action?.callBlockAutomation?.blockId,
            }),
          }),
          resultIndex: resultIndex >= 0 ? resultIndex : null,
          reasonIndex:
            reasonIndex !== undefined && reasonIndex >= 0 ? reasonIndex : null,
          note: taskChainResult.note,
          result: this.fb.group({
            id: taskChainResult?.result?.id,
            name: taskChainResult?.result?.name,
          }),
          reason: this.fb.group({
            id: taskChainResult?.reason?.id,
            name: taskChainResult?.reason?.name,
          }),
          results: this.fb.array([]),
          nextActions: this.fb.array([]),
          isEdit: false,
        });
        taskChainResult?.action?.reasons?.forEach((reason) => {
          const reasonForm = this.fb.group({
            id: reason.id,
            name: reason.name,
          });
          (<FormArray>(
            (<FormGroup>taskChainResultForm.controls.action).controls['reasons']
          )).push(reasonForm);
        });
        taskChainResult.results?.forEach((result) => {
          const resultForm = this.fb.group({
            result: this.fb.group({
              id: result.result?.id,
              name: result.result?.name,
            }),
            nextActions: this.fb.array([]),
          });
          result.nextActions?.forEach((nextAction) => {
            const nextActionForm = this.fb.group({
              addNewChain: nextAction.addNewChain,
              callBlockAutomation: nextAction.callBlockAutomation,
              closeCloneTask: [nextAction.closeCloneTask],
              delayType: nextAction.delayType,
              delayValue: nextAction.delayValue,
              moveToAction: nextAction.moveToAction,
              nextAction: nextAction.nextAction,
              type: nextAction.type,
              status: nextAction.status,
            });
            (<FormArray>resultForm.controls.nextActions).push(nextActionForm);
          });
          (<FormArray>taskChainResultForm.controls.results).push(resultForm);
        });
        (<FormArray>taskChainForm.controls.taskChainResults).push(
          taskChainResultForm,
        );

        taskChainResult.nextActions?.forEach((nextAction) => {
          const nextActionForm = this.fb.group({
            action: nextAction.action,
            deadlineDate: nextAction.deadlineDate,
            status: nextAction.status,
            executedDate: nextAction.executedDate,
            childNextAction: this.fb.group({
              delayType: nextAction?.childNextAction?.delayType,
              moveToAction: nextAction?.childNextAction?.moveToAction,
              callBlockAutomation:
                nextAction?.childNextAction?.callBlockAutomation,
              closeCloneTask: [nextAction?.childNextAction?.closeCloneTask],
              addNewChain: nextAction?.childNextAction?.addNewChain,
              nextAction: nextAction?.childNextAction?.nextAction,
              type: nextAction?.childNextAction?.type,
              delayValue: nextAction?.childNextAction?.delayValue,
            }),
          });
          (<FormArray>taskChainResultForm.controls.nextActions).push(
            nextActionForm,
          );
        });
      });
      (<FormArray>this.updateForm.controls.taskChains).push(taskChainForm);
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

  getBlock() {
    this.blocks.loading = true;
    this.automationService.block
      .getMany({})
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.blocks.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.blocks.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdate() {
    const branchForm = this.f['branch'].value;
    return new Promise((resolve, reject) => {
      this.loading.submit = true;
      const body = {
        ...this.updateForm.value,
        branch: !!branchForm
          ? {
              unit: branchForm?.level,
              id: branchForm?.id,
              name: branchForm?.name,
              department: branchForm?.department,
              departmentName: branchForm?.departmentName,
              team: branchForm?.team,
              teamName: branchForm?.teamName,
            }
          : null,
      } as unknown as ITaskDto as any;
      if (this.sourceData?.id) {
        delete body.addChainActIds;
        this.autoTaskService.task
          .update(this.sourceData.id, body)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.loading.submit = false)),
          )
          .subscribe({
            next: (res) => {
              if (res.status === 200) {
                this.commonService.handleResSuccess('update');
                this.updateSuccess.emit();
                resolve(res.data);
                this.getDetailTask();
                this.triggerCallHistory = Math.random();
              } else {
                reject(res);
                if (res.subStatus === 'CUSTOMER.DATA_ERROR') {
                  (res.data as any as Array<any>)?.map((err: any) => {
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
            },
            error: (err) => {
              reject(err);
              this.commonService.handleErr(err);
            },
          });
      } else {
        delete body.taskChains;
        this.autoTaskService.task
          .create(body)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.loading.submit = false)),
          )
          .subscribe({
            next: (res) => {
              if (res.status === 200) {
                this.commonService.handleResSuccess('create');
                this.updateSuccess.emit();
                this.sourceData = res.data;
                this.patchForm(res.data);
                this.triggerCallHistory = Math.random();
                resolve(res.data);
                this.getDetailTask();
                // this.hideModal();
              } else {
                reject(res);
                if (res.subStatus === 'CUSTOMER.DATA_ERROR') {
                  (res.data as any as Array<any>)?.map((err: any) => {
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
            },
            error: (err) => {
              reject(err);
              this.commonService.handleErr(err);
            },
          });
      }
    });
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
    const title = 'Xóa Task';
    const description = `Bạn sắp xóa task <b>${
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
        'Cẩn trọng với thao tác xóa Task. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteTask(this.sourceData!);
    });
  }

  onDeleteTask(value: ITask) {
    if (!value?.id) return;
    this.loading.deleteTask = true;
    this.autoTaskService.task.delete(value.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess('delete');
          this.updateSuccess.emit();
          this.triggerCallHistory = Math.random();
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
    this.addTaskChainModalRef?.onHide?.pipe().subscribe(() => {
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
        .pipe(finalize(() => (this.loading.addTaskChain = false)))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.getDetailTask();
              this.updateSuccess.emit();
              this.triggerCallHistory = Math.random();
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
        'Cẩn trọng với thao tác xóa chuỗi. Các module khác đang sử dụng dữ liệu của\n' +
        '      bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onCloseChain(taskChain);
    });
  }

  onCloseChain(value: ITaskChain) {
    this.autoTaskService.taskChain
      .closeChain(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
            this.triggerCallHistory = Math.random();
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
    this.autoTaskService.taskChain
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
            this.triggerCallHistory = Math.random();
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
          actionOfChain,
          sourceData: actionData,
          results: this.results.rows,
          blocks: this.blocks.rows,
          actionChains: this.actionChains.rows.map((chain) => {
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
          }) as unknown as IChainAct[],
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
      ?.pipe()
      .subscribe(() => (this.isOpenBackDrop = false));
    modalUpdateNextStep.content?.updateSuccess
      .pipe()
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
        }
      }
    });
  }

  handleViewCreatedOrder() {
    let url = `${environment.urlDomain}/${this.currentBiz.alias}/sale-center/?sourceId=${this.sourceData?.id}`;
    window.open(url, '_blank');
  }

  async handleCreateTaskOrder() {
    if (!this.sourceData?.id) return;
    try {
      this.submitted = true;
      if (this.updateForm.invalid) return;
      await this.handleUpdate();
    } catch (e) {
      console.log(e);
      return;
    }
    this.loading.createOrder = true;
    this.autoTaskService.task.createOrder(this.sourceData?.id!).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess(
            undefined,
            'Tạo đơn hàng thành công',
          );
          this.triggerCallHistory = Math.random();
          this.updateSuccess.emit();
          this.getDetailTask();
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
      error: (err) => {
        this.commonService.handleErr(err);
      },
    });
  }

  handleCall() {
    try {
      const {phone} = this.formLeadDeal.value;
      if (!phone) {
        this.toastr.warning('Không có số điện thoại của khách hàng');
        return;
      }
      this.isOpenBackDrop = true;
      const modalCall = this.modalService.show(ModalCallComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          customerPhone: phone,
        },
        ignoreBackdropClick: true,
        keyboard: false,
      });
      modalCall.onHide?.pipe().subscribe(() => {
        this.isOpenBackDrop = false;
        this.triggerCallHistory = Math.random();
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleClickPTree(event: any) {
    this.commonService.handleClickPTree(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
