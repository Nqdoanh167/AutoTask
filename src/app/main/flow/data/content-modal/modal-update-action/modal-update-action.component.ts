import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {EActionType, IBodyAction, IBodyResultReason} from '@app/types/flow';

@Component({
  selector: 'app-modal-update-action',
  templateUrl: './modal-update-action.component.html',
  styleUrls: ['./modal-update-action.component.scss'],
})
export class ModalUpdateActionComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
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
  public results = [];
  public reasons = [];
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
    }
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
        .pipe()
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
        .pipe()
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

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
