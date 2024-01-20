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
  EActionType,
  ETaskChainType,
  ETypeProduct,
  IAction,
  IActResult,
  IAddTaskChainDto,
  IChainAct,
  ITask,
  ITaskChain,
  ITaskDto,
} from '@app/types/flow';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
  User,
} from '@app/types/viewmodels';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';
import {uniqBy} from 'lodash';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {calculateTime} from '@app/utils/common';
import moment from 'moment';
import {IBlockAutomation} from '@app/types/automation';
import {AutomationService} from '@app/services/api/automation.service';
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './modal-update-task.component.html',
  styleUrls: ['./modal-update-task.component.scss'],
})
export class ModalUpdateTaskComponent implements OnDestroy, OnInit {
  @ViewChild('templateAddTaskChain') templateAddTaskChain!: TemplateRef<any>;
  public addTaskChainModalRef?: BsModalRef;

  @Input() sourceData?: ITask;
  @Output() updateSuccess = new EventEmitter();

  public submittedModal = {
    addTaskChain: false,
  };
  protected readonly ETaskChainType = ETaskChainType;
  protected readonly EActionType = EActionType;
  public submitted = false;
  public updateForm = this.fb.group({
    name: ['Task mới', [Validators.required]],
    leadDeal: this.fb.group({
      type: 'LEAD',
      name: [null],
      gender: 'other',
      phone: null,
      email: null,
      address: null,
      street: null,
      ward: null,
      wardCode: null,
      district: null,
      districtCode: null,
      province: null,
      provinceCode: null,
    }),
    taskChains: this.fb.array([]),
    products: this.fb.array([]),
    counselorId: null,
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
  public isOpenBackDrop: boolean = false;

  private destroy$ = new Subject();
  protected readonly ETypeProduct = ETypeProduct;
  public loading = {
    submit: false,
    data: false,
    getDetail: false,
    addTaskChain: false,
  };
  public productTypes = [
    {
      label: 'Sản phẩm',
      value: ETypeProduct.PRODUCT,
    },
    {
      label: 'Khóa học/Sự kiện',
      value: ETypeProduct.COURSE,
    },
    {
      label: 'Dịch vụ',
      value: ETypeProduct.SERVICE,
    },
    {
      label: 'Sim thẻ',
      value: ETypeProduct.SIM_CARD,
    },
  ];

  public listProvince: IProvince[] = [];
  public listDistrict: IDistrict[] = [];
  public listWard: IWard[] = [];
  public listBizUsers: User[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly apiLocationService: ApiLocationService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly automationService: AutomationService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers = biz.users;
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  get fLead(): {[key: string]: AbstractControl} {
    return this.updateForm.controls.leadDeal.controls;
  }

  get formProducts() {
    return <FormArray>this.updateForm.get('products');
  }

  get formTaskChains() {
    return <FormArray>this.updateForm.get('taskChains');
  }

  get formLeadDeal() {
    return <FormGroup>this.updateForm.get('leadDeal');
  }

  get fAddChainModal(): {[key: string]: AbstractControl} {
    return this.addTaskChainForm.controls;
  }

  ngOnInit() {
    this.getProvince();
    if (this.sourceData) {
      this.patchForm(this.sourceData);
      this.sourceData?.leadDeal?.provinceCode &&
        this.getDistrict(this.sourceData?.leadDeal?.provinceCode);
      this.sourceData?.leadDeal?.districtCode &&
        this.sourceData?.leadDeal?.provinceCode &&
        this.getWard(
          this.sourceData?.leadDeal?.provinceCode,
          this.sourceData?.leadDeal?.districtCode,
        );
    } else {
      this.handleAddInterestedProduct();
    }
    this.getActionChain();
    this.getResult();
    this.getAction();
    this.getBlock();
  }

  getDetailTask() {
    if (!this.sourceData?.id) return;
    this.loading.getDetail = true;
    this.autoTaskService.task
      .getOne(this.sourceData.id)
      .pipe(finalize(() => (this.loading.getDetail = false)))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sourceData = res.data;
            this.patchForm(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  patchForm(dataSource: ITask) {
    this.updateForm.patchValue({
      ...dataSource,
      counselorId: dataSource?.counselor?.id,
    } as any);
    this.formTaskChains.clear();
    dataSource.taskChains?.forEach((taskChain) => {
      const taskChainForm = this.fb.group({
        id: taskChain.id,
        name: taskChain.name,
        status: taskChain.status,
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
          if (!typeOverDeadline) {
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
          // deadlineDate: taskChainResult?.deadlineDate,
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
              delayType: nextAction.delayType,
              delayValue: nextAction.delayValue,
              moveToAction: nextAction.moveToAction,
              nextAction: nextAction.nextAction,
              type: nextAction.type,
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
    console.log(this.updateForm.value);
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
    this.loading.submit = true;
    const body = {
      ...this.updateForm.value,
    } as unknown as ITaskDto;
    if (this.sourceData?.id) {
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
              this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    } else {
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
              // this.hideModal();
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => this.commonService.handleErr(err),
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  getProvince() {
    this.apiLocationService
      .getProvince({
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listProvince = res.data;
        },
      });
  }

  getDistrict(provinceCode: string) {
    this.apiLocationService
      .getDistrict({
        provinceCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listDistrict = res.data;
        },
      });
  }

  getWard(provinceCode: string, districtCode: string) {
    this.apiLocationService
      .getWard({
        provinceCode,
        districtCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listWard = res.data;
        },
      });
  }

  handleChangeLocation(value: string, type: 'province' | 'district' | 'ward') {
    switch (type) {
      case 'province':
        this.formLeadDeal.patchValue({
          district: null,
          districtCode: null,
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formLeadDeal.patchValue({
            province: null,
            provinceCode: null,
          });
          return;
        }
        this.formLeadDeal.patchValue({
          province: this.listProvince.find((el) => el.provinceCode === value)
            ?.province,
        });
        this.getDistrict(value);
        break;
      case 'district':
        this.formLeadDeal.patchValue({
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formLeadDeal.patchValue({
            district: null,
            districtCode: null,
            ward: null,
            wardCode: null,
          });
          return;
        }
        this.formLeadDeal.patchValue({
          district: this.listDistrict.find((el) => el.districtCode === value)
            ?.district,
        });
        this.getWard(this.formLeadDeal.value.provinceCode, value);
        break;
      case 'ward':
        if (!value) return;
        this.formLeadDeal.patchValue({
          ward: this.listWard.find((el) => el.wardCode === value)?.ward,
        });
        break;
      default:
        return;
    }
  }

  handleAddInterestedProduct() {
    this.formProducts.push(
      this.fb.group({
        name: null,
        type: ETypeProduct.PRODUCT,
      }),
    );
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
    if (!this.sourceData?.id) return;
    this.submittedModal.addTaskChain = true;
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
            this.addTaskChainModalRef?.hide();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
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
    };

    this.modalConfirmService.openModal(modalContent, 'closeChain');
  }

  onCloseChain(value: ITaskChain) {
    this.autoTaskService.taskChain
      .closeChain(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleDeleteChain(event: any, taskChain: ITaskChain) {
    event.preventDefault();
    event.stopPropagation();
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
    };

    this.modalConfirmService.openModal(modalContent, 'deleteChain');
  }

  onDeleteChain(value: ITaskChain) {
    this.autoTaskService.taskChain
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.getDetailTask();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdateNextStep(value: {taskChainResultIndex: number; value?: any}) {
    this.isOpenBackDrop = true;
    const modalUpdateNextStep = this.modalService.show(
      UpdateActionInTaskChainComponent,
      {
        initialState: {
          sourceData: value,
          results: this.results.rows,
          blocks: this.blocks.rows,
          actionChains: this.actionChains.rows,
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
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
