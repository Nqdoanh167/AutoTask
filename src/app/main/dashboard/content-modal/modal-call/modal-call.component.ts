import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {uniqBy} from 'lodash';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {Platform} from '@app/types/sms-ott-call';
import {StringeeCall, StringeeClient} from 'stringee';

@Component({
  selector: 'app-modal-call',
  templateUrl: './modal-call.component.html',
  styleUrls: ['./modal-call.component.scss'],
})
export class ModalCallComponent implements OnInit, OnDestroy {
  @Input() customerPhone: string = '';

  private destroy$ = new Subject();
  public loading = {
    submit: false,
    data: false,
  };
  public form = this.fb.group({
    platform: [null, [Validators.required]],
    phone: [null, [Validators.required]],
    toPhone: [null, [Validators.required]],
  });
  public submitted = false;

  public callPlatforms: ICommonDataLazy<Platform, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      isActive: true,
      platformType: 'voice',
    },
    isAllowLoadMore: false,
  };

  public phones: ICommonDataLazy<Platform, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {},
    isAllowLoadMore: false,
  };

  public tokenClient = {
    token: '',
    loading: false,
  };

  public stringeeClient: any;
  public call: any;
  public authenticatedWithUserId: any;
  public callStatus: 'connected' | 'none' = 'none';

  public time: number = 0;
  public displayCallTime: any;
  public interval: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly commonService: CommonService,
    private readonly smsOttCallService: SmsOttCallService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.form.controls;
  }

  ngOnInit(): void {
    if (this.customerPhone) {
      this.form.patchValue({
        toPhone: this.customerPhone,
      } as any);
    }
    this.getCallPlatform();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.time === 0) {
        this.time++;
      } else {
        this.time++;
      }
      this.displayCallTime = this.transform(this.time);
    }, 1000);
  }
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return minutes + ':' + (value - minutes * 60);
  }
  clearTime() {
    this.time = 0;
    this.displayCallTime = null;
    clearInterval(this.interval);
  }

  getPhones() {
    const {platform} = this.form.value;
    if (!platform) return;
    this.phones.loading = true;
    this.smsOttCallService.platform
      .getPhones(platform, 'stringee')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.phones.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.phones.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleChangePlatform(value: Platform) {
    this.form.patchValue({
      phone: null,
    });
    switch (value.platform) {
      case 'stringee':
        this.getTokenClient();
        break;

      default:
        return;
    }
  }

  getCallPlatform() {
    this.callPlatforms.loading = true;
    this.smsOttCallService.platform
      .get(this.callPlatforms.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.callPlatforms.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.callPlatforms.rows = uniqBy(
              this.callPlatforms.rows.concat(res.data),
              'id',
            );
            this.callPlatforms.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.callPlatforms.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.callPlatforms.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  // STRINGEEE CONFIGURATION
  getTokenClient() {
    const {platform} = this.form.value;
    if (!platform) return;
    this.tokenClient.loading = true;
    this.smsOttCallService.platform
      .getTokenClient(platform, 'stringee')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.tokenClient.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.tokenClient.token = res.data.token;
            this.getPhones();
            this.connectStringee();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  settingClientEvents() {
    this.stringeeClient.on('connect', () => {
      console.log('connected to StringeeServer');
    });

    this.stringeeClient.on('authen', (res: any) => {
      console.log('on authen: ', res);
      if (res.r === 0) {
        this.authenticatedWithUserId = res.userId;
      } else {
        console.log('authen error: ', res);
      }
    });

    this.stringeeClient.on('disconnect', () => {
      console.log('disconnected');
    });

    this.stringeeClient.on('incomingcall', (incomingcall: any) => {
      this.call = incomingcall;
      this.settingCallEvents(incomingcall);
      const incomingCallDiv = document.getElementById('incomingCallDiv');
      const incomingCallFrom = document.getElementById('incomingCallFrom');
      const callType = document.getElementById('callType');

      incomingCallDiv!.style.display = 'block';
      incomingCallFrom!.innerHTML = this.call.fromNumber;

      console.log('incomingcall: ', incomingcall);
      // fromInternal: false
      if (incomingcall.fromInternal) {
        callType!.innerHTML = 'App-to-App call';
      } else {
        callType!.innerHTML = 'Phone-to-App call';
      }
    });

    this.stringeeClient.on('requestnewtoken', () => {
      console.log(`request new token;
            please get new access_token from YourServer
            and call client.connect(new_access_token)`);
      // please get new access_token from YourServer and call:
      // client.connect(new_access_token);
    });

    this.stringeeClient.on('otherdeviceauthen', (data: any) => {
      console.log('otherdeviceauthen: ', data);
    });
  }

  loginStringee() {
    this.stringeeClient = new StringeeClient();
    console.log(this.stringeeClient);
    this.settingClientEvents();
    this.stringeeClient.connect(this.tokenClient.token);
  }

  connectStringee() {
    this.loginStringee();
  }

  settingCallEvents(call1: any) {
    call1.on('error', (info: any) => {
      console.log('on error: ' + JSON.stringify(info));
    });

    call1.on('addlocalstream', (stream: any) => {
      console.log('on addlocalstream', stream);
    });

    call1.on('addremotestream', (stream: any) => {
      console.log('on addremotestream', stream);
      const remoteVideo = document.getElementById(
        'remoteVideo',
      ) as HTMLVideoElement;
      remoteVideo.srcObject = null;
      remoteVideo.srcObject = stream;
      this.callStatus = 'connected';
      // reset srcObject to work around minor bugs in Chrome and Edge.
    });

    call1.on('signalingstate', (state: any) => {
      console.log('signalingstate', state);

      if (state.code == 3) {
        this.startTimer();
      }

      if (state.code == 6) {
        // call ended
        const incomingCallDiv = document.getElementById('incomingCallDiv');
        incomingCallDiv!.style.display = 'none';
        this.callStopped();
        this.clearTime();
      }

      if (state.code == 5) {
        // busy here
        this.callStopped();
        this.clearTime();
      }

      const reason = state.reason;
      const callStatus = document.getElementById('callStatus');
      callStatus!.innerHTML = reason;
    });

    call1.on('mediastate', (state: any) => {
      console.log('mediastate ', state);
    });

    call1.on('info', (info: any) => {
      console.log('on info', info);
    });

    call1.on('otherdevice', (data: any) => {
      console.log('on otherdevice:' + JSON.stringify(data));

      if (
        (data.type === 'CALL_STATE' && data.code >= 200) ||
        data.type === 'CALL_END'
      ) {
        const incomingCallDiv = document.getElementById('incomingCallDiv');
        incomingCallDiv!.style.display = 'none';
        this.clearTime();
      }
    });
  }

  handleCall() {
    try {
      const {platform, phone, toPhone} = this.form.value;
      if (!platform || !phone || !toPhone) return;
      const modifiedPhone = String(phone).replace(/^0+|\+/, '84');
      const modifiedToPhone = String(toPhone).replace(/^0+|\+/, '84');
      this.call = new StringeeCall(
        this.stringeeClient,
        modifiedPhone,
        modifiedToPhone,
        false,
      );
      this.settingCallEvents(this.call);
      this.call.makeCall((res: any) => {
        console.log('make call callback: ', res);
        if (res.r !== 0) {
          const callStatus = document.getElementById('callStatus');
          callStatus!.innerHTML = res.message;
          this.callStatus = 'none';
        } else {
          // call type
          const callType = document.getElementById('callType');
          if (res.toType === 'internal') {
            callType!.innerHTML = 'App-to-App call';
          } else {
            callType!.innerHTML = 'App-to-Phone call';
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  callStopped() {
    const callStatus = document.getElementById('callStatus');
    const hangupBtn = document.getElementById('hangupBtn');
    hangupBtn!.setAttribute('disabled', 'disabled');

    setTimeout(() => {
      callStatus!.innerHTML = 'Call ended';
      this.clearTime();
      this.callStatus = 'none';
    }, 1500);
  }

  handleReject() {
    this.callStopped();
    this.call.reject((res: any) => {
      console.log('reject res', res);
      const incomingCallDiv = document.getElementById('incomingCallDiv');
      incomingCallDiv!.style.display = 'none';
    });
  }

  handleAnswer() {
    this.call.answer((res: any) => {
      console.log('answer res', res);
      const incomingCallDiv = document.getElementById('incomingCallDiv');
      incomingCallDiv!.style.display = 'none';
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.valid) {
      this.handleCall();
    }
  }

  handleHangup() {
    try {
      const remoteVideo = document.getElementById(
        'remoteVideo',
      ) as HTMLVideoElement;
      remoteVideo.srcObject = null;
      this.callStopped();

      this.call?.hangup((res: any) => {
        console.log('hangup res', res);
        this.clearTime();
        this.callStatus = 'none';
      });
    } catch (e) {
      console.log(e);
    }
  }

  // END STRINGEEE CONFIGURATION

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
