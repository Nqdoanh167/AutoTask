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
  IAddTaskChainDto,
  IChainAct,
  ITask,
  ITaskChain,
  ITaskChainResult,
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
import {UpdateActionInTaskChainComponent} from '@main/dashboard/content-modal/update-action-in-task-chain/update-action-in-task-chain.component';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {calculateTime} from '@app/utils/common';
import moment from 'moment';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './modal-update-task.component.html',
  styleUrls: ['./modal-update-task.component.scss'],
})
export class ModalUpdateTaskComponent implements OnDestroy, OnInit {
  @ViewChild('templateAddTaskChain') templateAddTaskChain!: TemplateRef<any>;
  public addTaskChainModalRef?: BsModalRef;
  public updateChainModalRef?: BsModalRef;

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

  public actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
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

  formTaskChainResults(taskChainIndex: number) {
    return (<FormArray>this.updateForm.get('taskChains')).controls[
      taskChainIndex
    ].get('taskChainResults') as FormArray;
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
        taskChainResults: this.fb.array([]),
      });
      taskChain.taskChainResults?.forEach((taskChainResult) => {
        let deadlineDay = 0;
        let deadlineHour = 0;
        let deadlineMinute = 0;
        let isOverDeadline = false;
        if (true) {
          const subDate = calculateTime(
            '2023-12-31T23:59:59.999Z',
            new Date(),
            'metrics',
          ) as {days?: number; hours?: number; minutes?: number};
          deadlineDay = subDate.days || 0;
          deadlineHour = subDate.hours || 0;
          deadlineMinute = subDate.minutes || 0;
          isOverDeadline = moment().isAfter('2023-12-31T23:59:59.999Z');
        }
        const taskChainResultForm = this.fb.group({
          id: taskChainResult?.id,
          status: taskChainResult?.status,
          // deadlineDate: taskChainResult?.deadlineDate,
          deadlineDate: '2023-12-31T23:59:59.999Z',
          deadlineDay: deadlineDay,
          deadlineHour: deadlineHour,
          deadlineMinute: deadlineMinute,
          isOverDeadline: isOverDeadline,
          action: this.fb.group({
            id: taskChainResult?.action?.id,
            name: taskChainResult?.action?.name,
            type: taskChainResult?.action?.type,
          }),
          resultIndex: null,
          reasonIndex: null,
          note: taskChainResult.note,
          result: taskChainResult.result,
          results: this.fb.array([]),
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

  handleUpdateActionInChain(value: ITaskChainResult, taskChain: ITaskChain) {
    this.isOpenBackDrop = true;
    this.updateChainModalRef = this.modalService.show(
      UpdateActionInTaskChainComponent,
      {
        initialState: {
          taskChainId: taskChain.id,
          action: value.action.name,
          sourceData: value,
          reasons: value.action.reasons,
          results: value.results?.map((result) => result.result) as any,
        },
        class: 'modal-dialog-centered',
      },
    );
    this.updateChainModalRef?.onHide?.pipe().subscribe(() => {
      this.isOpenBackDrop = false;
    });
    this.updateChainModalRef?.content?.updateSuccess.pipe().subscribe(() => {
      this.getDetailTask();
    });
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
    this.addTaskChainModalRef?.onHide
      ?.pipe()
      .subscribe(() => (this.isOpenBackDrop = false));
  }

  onAddTaskChain() {
    if (!this.sourceData?.id) return;
    this.submittedModal.addTaskChain = true;
    const body = {
      addChainActIds: (this.addTaskChainForm.value?.addChainActIds ||
        []) as unknown as string[],
    } as unknown as IAddTaskChainDto;
    this.autoTaskService.task
      .updateTaskChain(this.sourceData.id!, body)
      .pipe()
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
