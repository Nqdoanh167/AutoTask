import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {takeUntil, timer} from 'rxjs';
import {AsyncPipe, DatePipe} from '@angular/common';
import {FormatSecondsModule} from '@share/pipe/format-seconds/format-seconds.module';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';

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

  public incomingCall$ = this.phoneCallService.getIncomingCall();
  public phoneStatus: 'ringing' | 'answer' | 'end' | 'reject' = 'ringing';
  public showPopup = true;
  public isSilent = false;
  public isMute = false;
  public timer$ = timer(0, 1000);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly phoneCallService: PhoneCallService,
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
  }

  ngOnInit() {
    this.phoneCallService
      .getIncomingCall()
      .pipe(takeUntil(this.destroy$))
      .subscribe((incomingCall) => {
        if (incomingCall) {
          this.phoneTemp?.nativeElement?.click();
          this.phoneTemp?.nativeElement?.focus();
          this.phoneStatus = 'ringing';
          this.showPopup = true;
          setTimeout(() => {
            const media = this.audio?.nativeElement;
            media.muted = false;
            media.play();
          }, 100);
        }
      });
  }

  handleChangePhoneStatus(status: 'answer' | 'reject' | 'end') {
    this.phoneStatus = status;
    if (this.phoneStatus === 'end') {
      this.phoneCallService.handleHangup();
      const subscribe = this.timer$.subscribe((val) => console.log(val));
      subscribe.unsubscribe();
      setTimeout(() => {
        this.showPopup = false;
        this.phoneCallService.setIncomingCall(null);
      }, 2000);
    } else if (status === 'reject') {
      this.phoneCallService.handleReject();
    } else {
      this.phoneCallService.handleAnswer();
    }
  }

  ngAfterViewInit() {}
}
