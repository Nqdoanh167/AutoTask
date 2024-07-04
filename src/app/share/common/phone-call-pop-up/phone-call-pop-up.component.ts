import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {timer} from 'rxjs';
import {AsyncPipe, DatePipe} from '@angular/common';
import {FormatSecondsModule} from '@share/pipe/format-seconds/format-seconds.module';

@Component({
  selector: 'app-phone-call-pop-up',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormatSecondsModule],
  templateUrl: './phone-call-pop-up.component.html',
  styleUrl: './phone-call-pop-up.component.scss',
})
export class PhoneCallPopUpComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('audio') audio?: ElementRef;

  public phoneStatus: 'ringing' | 'answer' | 'end' = 'ringing';
  public showPopup = true;
  public isSilent = false;
  public isMute = false;
  public timer$ = timer(0, 1000);

  constructor(private readonly cdr: ChangeDetectorRef) {}

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

  ngOnInit() {}

  handleChangePhoneStatus(status: 'answer' | 'end') {
    this.phoneStatus = status;
    if (this.phoneStatus === 'end') {
      this.showPopup = false;
    }
  }

  ngAfterViewInit() {
    const media = this.audio?.nativeElement;
    media.muted = false;
    media.play();
  }

  ngOnDestroy() {
    // this.audio?.nativeElement.pause();
  }
}
