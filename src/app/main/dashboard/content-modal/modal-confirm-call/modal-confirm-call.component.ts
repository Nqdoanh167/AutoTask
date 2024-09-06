import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {ILeadDealDto, ITask} from '@app/types/flow';
import {ManageMappingPhone} from '@app/types/sms-ott-call';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {finalize, takeUntil} from 'rxjs';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {StringeeService} from '@app/services/common/stringee.service';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {AsyncPipe} from '@angular/common';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-modal-confirm-call',
  standalone: true,
  imports: [CustomModalComponent, AsyncPipe],
  templateUrl: './modal-confirm-call.component.html',
  styleUrl: './modal-confirm-call.component.scss',
})
export class ModalConfirmCallComponent
  extends BaseComponentsComponent
  implements OnInit, OnDestroy
{
  @Input({required: true}) customer!: ILeadDealDto;
  @Input({required: true}) task!: ITask;
  @Input({required: true}) connectedPhone!: ManageMappingPhone;

  public outgoingCall$ = this.phoneCallService.getOutgoingCall();
  public loading = false;

  constructor(
    private readonly modalRef: BsModalRef,
    private readonly smsOttCallService: SmsOttCallService,
    private readonly commonService: CommonService,
    private readonly stringeeService: StringeeService,
    private readonly phoneCallService: PhoneCallService,
    private readonly toast: ToastrService,
  ) {
    super();
  }

  ngOnInit() {
    const {platform} = this.connectedPhone;
    switch (platform.platform) {
      case 'stringee':
        this.getTokenClient();
        break;
      default:
        break;
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  getTokenClient() {
    const platformId = this.connectedPhone?.platform?.id;
    if (!platformId) return;
    this.loading = true;
    this.smsOttCallService.platform
      .getTokenClient(platformId, 'stringee', this.task?.code!)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.stringeeService.loginStringee(res.data.token);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleCall() {
    if (this.connectedPhone?.platform?.platform === 'stringee') {
      const phone = this.connectedPhone.hotline;
      const toPhone = this.customer.phone;
      if (!phone || !toPhone) return;
      this.stringeeService.handleCall(phone, toPhone);
    } else if (!!this.connectedPhone?.platform?.platform) {
      this.toast.warning('Chức năng này chưa được hỗ trợ cho tổng đài này');
    } else {
      this.toast.warning('Không tìm thấy tổng đài');
    }
  }
}
