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
import {BsModalRef} from 'ngx-bootstrap/modal';
import {uniqBy} from 'lodash';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {Biz, ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {Platform} from '@app/types/sms-ott-call';
import {StringeeCall, StringeeClient} from 'stringee';
import {OmiExtension} from '@app/types/omicall';
import {AuthService} from '@app/services/api/auth.service';

declare function omicallInit(dataConfig: OmiExtension): void;
declare function omicallMakeCall(phoneNumber: string, hotline: string): void;

@Component({
  selector: 'app-modal-assign-counselor',
  templateUrl: './modal-assign-counselor.component.html',
  styleUrls: ['./modal-assign-counselor.component.scss'],
})
export class ModalAssignCounselorComponent implements OnInit, OnDestroy {
  @Output() assignCounselor = new EventEmitter();
  private destroy$ = new Subject();
  public biz!: Biz;
  public form!: FormGroup;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentBiz.subscribe((biz) => {
      this.biz = biz;
    });
    this.form = this.fb.group({
      counselorId: [null, Validators.required],
    });
  }
  onSubmit() {
    if (this.form.valid) {
      this.assignCounselor.emit(this.form.value);
      this.modalRef.hide();
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
