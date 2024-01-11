import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  IActReason,
  IActResult,
  IPickResultForActionDto,
  ITask,
  ITaskChainResult,
  ITaskDto,
} from '@app/types/flow';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './update-action-in-task-chain.component.html',
  styleUrls: ['./update-action-in-task-chain.component.scss'],
})
export class UpdateActionInTaskChainComponent implements OnDestroy, OnInit {
  @Input() taskChainId?: string;
  @Input() action?: string;
  @Input() sourceData?: ITaskChainResult;
  @Input() reasons: IActReason[] = [];
  @Input() results: IActResult[] = [];
  @Output() updateSuccess = new EventEmitter();
  public submitted = false;
  public updateForm = this.fb.group({
    name: ['Task mới', [Validators.required]],
    reasonId: null,
    resultId: [null, [Validators.required]],
    note: null,
  });

  private destroy$ = new Subject();
  public loading = {
    submit: false,
    data: false,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
      });
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const {note, reasonId, resultId} = this.updateForm.value;
    const resultIndex = this.results?.findIndex(
      (result) => result.id === (resultId as any),
    );
    const reasonIndex = this.reasons?.findIndex(
      (reason) => reason.id === (reasonId as any),
    );
    if (resultIndex <= -1) return;
    const body = {
      note,
      resultIndex,
      reasonIndex: reasonIndex >= 0 ? reasonIndex : null,
    } as unknown as IPickResultForActionDto;
    this.autoTaskService.taskChain
      .pickResult(this.taskChainId!, body)
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
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid && !!this.taskChainId) {
      this.handleUpdate();
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
