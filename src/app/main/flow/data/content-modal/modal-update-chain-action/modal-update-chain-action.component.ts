import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {
  IAction,
  IUpdateChainActDto,
  IChainAct,
  EDelayType,
  EActionType,
} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import uniqBy from 'lodash/uniqBy';

@Component({
  selector: 'app-modal-update-chain-action',
  templateUrl: './modal-update-chain-action.component.html',
  styleUrls: ['./modal-update-chain-action.component.scss'],
})
export class ModalUpdateChainActionComponent implements OnDestroy, OnInit {
  @Input() sourceData?: IChainAct;
  @Output() updateSuccess = new EventEmitter();
  private destroy$ = new Subject();

  public submitted = false;
  public updateForm = this.fb.group({
    name: [null, [Validators.required, Validators.maxLength(255)]],
    actions: this.fb.array([]),
    isActive: true,
    fistActionDelay: this.fb.group(
      {
        delayType: EDelayType.NOW,
        delayValue: null,
      },
      {validators: [this.allOrNoneRequired]},
    ),
  });
  public loading = {
    submit: false,
    data: false,
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

  public subActions: ICommonDataLazy<IAction, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      filter: JSON.stringify({
        type: [EActionType.FEEDBACK, EActionType.MANUAL_CREATE_ORDER, EActionType.BOOKING],
      }),
    },
    isAllowLoadMore: false,
  };
  public selectedActionIds: string[] = [];

  // Map of selected sub-action IDs for each action ID
  public selectedSubActionObject: {
    [key: string]: string[];
  } = {};
  protected readonly EDelayType = EDelayType;

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  get fDelay(): {[key: string]: AbstractControl} {
    return this.updateForm.controls.fistActionDelay.controls;
  }

  get formActions() {
    return <FormArray>this.updateForm.get('actions');
  }

  allOrNoneRequired(form: FormGroup) {
    const type = form.get('delayType');
    const value = form.get('delayValue');
    if (type?.value !== EDelayType.NOW && !value?.value) {
      value?.setErrors({required: true});
    } else {
      value?.setErrors(null);
    }
    return null;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
        isHidden: false,
      });
      if (this.sourceData.actionResults.length) {
        this.formActions.clear();
        this.sourceData.actionResults?.forEach((actionResult) => {
          this.formActions.push(
            this.fb.group({
              value: actionResult.action?.id,
              label: actionResult.action?.name,
            }),
          );

          if (actionResult?.subActions?.length) {
            const subActions = this.fb.array([]) as FormArray;
            actionResult.subActions.forEach((subAction: any) => {
              subActions.push(
                this.fb.group({
                  value: subAction.id,
                  label: subAction.name,
                }),
              );
            });
            (
              this.formActions.at(this.formActions.length - 1) as FormGroup
            ).addControl('subActions', subActions);
          }
        });
      }
    } else {
      this.addActions();
    }

    this.updateForm.valueChanges.pipe().subscribe((form) => {
      const {actions} = form;
      this.selectedActionIds = actions
        ?.filter((action: any) => {
          return action.value;
        })
        .map((action: any) => action.value) as string[];

      // expect selectedSubActionObject[actionId] = [subActionId1, subActionId2]
      this.selectedSubActionObject = actions?.reduce(
        (acc: any, action: any) => {
          if (action.value) {
            const subActions = action.subActions || [];
            acc[action.value] = subActions
              .filter((subAction: any) => subAction.value)
              .map((subAction: any) => subAction.value);
          }
          return acc;
        },
        {},
      ) as {
        [key: string]: string[];
      };
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

  getSubActions() {
    this.subActions.loading = true;
    this.autoTaskService.action
      .get(this.subActions.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.subActions.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.subActions.rows = uniqBy(
              this.subActions.rows.concat(res.data),
              'id',
            );
            this.subActions.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.subActions.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.subActions.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  handleLoadMore() {
    if (this.actions.isAllowLoadMore) {
      this.actions.paramsQuery!.page! += 1;
      this.getAction();
    }
  }

  handleLoadMoreSubActions() {
    if (this.subActions.isAllowLoadMore) {
      this.subActions.paramsQuery!.page! += 1;
      this.getSubActions();
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const {actions, name, isActive, fistActionDelay} = this.updateForm.value;
    const actionIds: string[] =
      actions?.map((action: any) => action.value) || [];

    // expected format: [[subActionId1, subActionId2], [subActionId3, subActionId4]]
    const subActionIds: string[][] = (actions?.map((action: any) => {
      const subActions = action.subActions?.map((subAction: any) => {
        return subAction.value;
      });
      return subActions || [];
    }) || []) as string[][];

    const body = {
      actionIds,
      subActionIds,
      name,
      isActive,
      fistActionDelay,
    } as unknown as IUpdateChainActDto;
    if (this.sourceData?.id) {
      this.autoTaskService.chainAction
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
      this.autoTaskService.chainAction
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
              this.hideModal();
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

  hideModal(): void {
    this.modalRef.hide();
  }

  addActions() {
    try {
      this.formActions.push(
        this.fb.group({
          value: [null, [Validators.required]],
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }

  removeAction(index: number) {
    if (this.formActions.value.length <= 1) {
      this.toastr.warning('Tối thiểu 1 Hành động!');
      return;
    }
    this.formActions.removeAt(index);
  }

  handleChangeTypeDelay() {
    this.updateForm.get('fistActionDelay')?.patchValue({
      delayValue: null,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getSubActionsControls(actionIndex: number): AbstractControl[] {
    const subActionsFormArray = this.formActions
      .at(actionIndex)
      .get('subActions') as FormArray;
    return subActionsFormArray?.controls || [];
  }

  createAction(action?: IAction): FormGroup {
    return this.fb.group({
      value: [action?.id || null],
      subActions: this.fb.array(
        action?.subActions?.map((sub: IAction) => this.createSubAction(sub)) ||
          [],
      ),
    });
  }

  createSubAction(subAction?: IAction): FormGroup {
    return this.fb.group({
      value: [subAction?.id || null],
    });
  }

  addSubAction(actionIndex: number): void {
    const action = this.formActions.at(actionIndex) as FormGroup;

    if (!action.get('subActions')) {
      action.addControl('subActions', this.fb.array([]));
    }

    const subActions = action.get('subActions') as FormArray;
    subActions.push(this.createSubAction());
  }

  removeSubAction(actionIndex: number, subActionIndex: number): void {
    const action = this.formActions.at(actionIndex) as FormGroup;
    const subActions = action.get('subActions') as FormArray;
    subActions.removeAt(subActionIndex);
  }
}
