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
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {EActionType, IAction, IActReason, IBodyAction} from '@app/types/flow';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {uniqBy} from 'lodash';
import {IBlockAutomation} from '@app/types/automation';
import {AutomationService} from '@app/services/api/automation.service';

@Component({
  selector: 'app-modal-update-action',
  templateUrl: './modal-update-action.component.html',
  styleUrls: ['./modal-update-action.component.scss'],
})
export class ModalUpdateActionComponent implements OnDestroy, OnInit {
  @Input() sourceData?: IAction;
  @Output() updateSuccess = new EventEmitter();
  private destroy$ = new Subject();

  public actionTypes: {value: EActionType; label: string}[] = [];
  public submitted = false;
  public updateForm = this.fb.group(
    {
      name: [null, [Validators.required, Validators.maxLength(255)]],
      type: [null, [Validators.required]],
      resultIds: [null],
      reasonIds: [null],
      callBlockAutomation: this.fb.group({
        blockId: null,
      }),
    },
    {validators: [this.allOrNoneRequired]},
  );
  public reasons: ICommonDataLazy<IActReason, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public blocks: ICommonDataLazy<IBlockAutomation, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public loading = {
    submit: false,
    data: false,
  };

  protected readonly EActionType = EActionType;

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly automationService: AutomationService,
  ) {
    this.actionTypes = configurationService.actionTypes;
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  allOrNoneRequired(form: FormGroup) {
    const type = form.get('type');
    const blockId = form.get('callBlockAutomation.blockId');
    if (type?.value === EActionType.SEND_BLOCK_AUTOMATION && !blockId?.value) {
      blockId?.setErrors({required: true});
    } else {
      blockId?.setErrors(null);
    }
    return null;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
        isHidden: false,
        reasonIds: this.sourceData.reasons?.map((reason) => reason.id),
      });
      if (this.sourceData?.reasons?.length) {
        this.reasons.rows = this.sourceData?.reasons;
      }
    }
    this.getBlock();
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

  getReason() {
    this.reasons.loading = true;
    this.autoTaskService.actionReason
      .get(this.reasons.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.reasons.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.reasons.rows = uniqBy(
              this.reasons.rows.concat(res.data),
              'id',
            );
            this.reasons.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.reasons.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.reasons.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  handleUpdate() {
    this.loading.submit = true;
    const {type, reasonIds, resultIds, callBlockAutomation} =
      this.updateForm.value;
    const body = {
      ...this.updateForm.value,
      resultIds: resultIds ?? [],
      reasonIds: reasonIds ?? [],
      callBlockAutomation: callBlockAutomation?.blockId
        ? callBlockAutomation
        : null,
    } as unknown as IBodyAction;
    if (this.sourceData?.id) {
      this.autoTaskService.action
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
      this.autoTaskService.action
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

  handleLoadMore(key: 'reason' | 'result') {
    if (key === 'reason') {
      if (this.reasons.isAllowLoadMore) {
        this.reasons.paramsQuery!.page! += 1;
        this.getReason();
      }
    }
  }

  handleChangeType() {
    this.f['callBlockAutomation'].patchValue({
      blockId: null,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
