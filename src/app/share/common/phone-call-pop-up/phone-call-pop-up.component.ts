import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Observable, takeUntil, timer} from 'rxjs';
import {AsyncPipe, DatePipe} from '@angular/common';
import {FormatSecondsModule} from '@share/pipe/format-seconds/format-seconds.module';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {Call, ECallStatus, ECallType} from '@app/types/call';
import {StringeeService} from '@app/services/common/stringee.service';
import {EStatusVoice} from '@app/types/sms-ott-call';

@Component({
  selector: 'app-phone-call-pop-up',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormatSecondsModule],
  templateUrl: './phone-call-pop-up.component.html',
  styleUrl: './phone-call-pop-up.component.scss',
})
export class PhoneCallPopUpComponent
  extends BaseComponentsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('audio') audio?: ElementRef;
  @ViewChild('phoneTemp') phoneTemp?: ElementRef;

  @Input({required: true}) type!: ECallType;

  public call$?: Observable<Call | null>;
  public phoneStatus?: ECallStatus;
  public showPopup = true;
  public isSilent = false;
  public isMute = false;
  public timer$ = timer(0, 1000);

  protected readonly ECallStatus = ECallStatus;
  protected readonly ECallType = ECallType;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly phoneCallService: PhoneCallService,
    private readonly stringeeService: StringeeService,
  ) {
    super();
  }

  togglePopUp() {
    this.showPopup = !this.showPopup;
  }

  toggleSilent() {
    this.isSilent = !this.isSilent;
    if (this.isSilent) {
      this.audio?.nativeElement.pause();
    } else {
      this.audio?.nativeElement.play();
    }
  }

  toggleMute() {
    this.isMute = !this.isMute;
    this.stringeeService.handleMute(this.isMute);
  }

  ngOnInit() {
    this.call$ =
      this.type === ECallType.INCOMING
        ? this.phoneCallService.getIncomingCall()
        : this.phoneCallService.getOutgoingCall();
    this.call$.pipe(takeUntil(this.destroy$)).subscribe((call) => {
      this.phoneStatus = call?.status;
      this.handleCheckCallStatus();
    });
  }

  handleCheckCallStatus() {
    if ([ECallStatus.ENDED, ECallStatus.REJECTED].includes(this.phoneStatus!)) {
      const subscribe = this.timer$.subscribe((val) => console.log(val));
      subscribe.unsubscribe();
      if (this.phoneStatus === ECallStatus.ENDED) {
        setTimeout(() => {
          this.showPopup = false;
          this.isMute = false;
          if (this.type === ECallType.INCOMING) {
            this.phoneCallService.setIncomingCall(null);
          } else {
            this.phoneCallService.setOutgoingCall(null);
          }
          this.stringeeService.callStopped();
        }, 2000);
      } else {
        this.showPopup = false;
        this.isMute = false;
        if (this.type === ECallType.INCOMING) {
          this.phoneCallService.setIncomingCall(null);
        } else {
          this.phoneCallService.setOutgoingCall(null);
        }
        this.stringeeService.callStopped();
      }
    } else {
      this.showPopup = true;
    }
    if (
      this.phoneStatus === ECallStatus.RINGING &&
      this.type === ECallType.INCOMING
    ) {
      this.phoneTemp?.nativeElement?.click();
      this.phoneTemp?.nativeElement?.focus();
      setTimeout(() => {
        const media = this.audio?.nativeElement;
        media.muted = false;
        media.play();
      }, 100);
    }
  }

  handleChangePhoneStatus(status: ECallStatus) {
    if (this.type === ECallType.INCOMING) {
      this.phoneCallService.updateStatusIncomingCall(status);
    } else {
      this.phoneCallService.updateStatusOutgoingCall(status);
    }
    if (status === ECallStatus.ANSWERED) {
      this.stringeeService.handleAnswer();
      this.phoneCallService.updateHistoricalCallStatus(EStatusVoice.SUCCESS);
      return;
    }
    if (status === ECallStatus.HANGUP) {
      this.stringeeService.handleHangup();
      return;
    }
    if (this.phoneStatus === ECallStatus.ENDED) {
      this.stringeeService.handleHangup();
      return;
    }
    if (status === ECallStatus.REJECTED) {
      this.stringeeService.handleReject();
      this.phoneCallService.updateHistoricalCallStatus(EStatusVoice.REJECT);
      return;
    }
  }

  ngAfterViewInit() {}
}
