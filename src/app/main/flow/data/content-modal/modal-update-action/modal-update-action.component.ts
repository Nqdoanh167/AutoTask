import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {
  EActionType,
  IAction,
  IActReason,
  IActResult,
  IBodyAction,
  IBodyResultReason,
} from '@app/types/flow';
import {
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
} from '@app/types/viewmodels';
import {uniqBy} from 'lodash';

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
  public updateForm = this.fb.group({
    name: [null, [Validators.required, Validators.maxLength(255)]],
    type: [null, [Validators.required]],
    resultIds: [null],
    reasonIds: [null],
  });
  public results: ICommonDataLazy<IActResult, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
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
  public loading = {
    submit: false,
    data: false,
  };

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {
    this.actionTypes = configurationService.actionTypes;
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
        isHidden: false,
      });
      if (this.sourceData?.reasons?.length) {
        this.reasons.rows = this.sourceData?.reasons;
      }
      if (this.sourceData?.results?.length) {
        this.results.rows = this.sourceData?.results;
      }
    }
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

  handleUpdate() {
    this.loading.submit = true;
    const {type, reasonIds, resultIds} = this.updateForm.value;
    const body = {
      ...this.updateForm.value,
      type: Number(type),
      resultIds: resultIds ?? [],
      reasonIds: reasonIds ?? [],
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
    if (key === 'result') {
      if (this.results.isAllowLoadMore) {
        this.results.paramsQuery!.page! += 1;
        this.getResult();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
