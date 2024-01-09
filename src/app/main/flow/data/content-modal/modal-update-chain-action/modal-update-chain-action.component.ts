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
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {IAction, IActReason, IBodyChainAct, IChainAct} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {uniqBy} from 'lodash';

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
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

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

  get formActions() {
    return <FormArray>this.updateForm.get('actions');
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
        });
      }
    } else {
      this.addActions();
    }
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

  handleLoadMore() {
    if (this.actions.isAllowLoadMore) {
      this.actions.paramsQuery!.page! += 1;
      this.getAction();
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const {actions, name, isActive} = this.updateForm.value;
    const actionIds: string[] =
      actions?.map((action: any) => action.value) || [];
    const body = {
      actionIds,
      name,
      isActive,
    } as unknown as IBodyChainAct;
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

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
