import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {uniqBy} from 'lodash';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {Platform} from '@app/types/sms-ott-call';
import {StringeeClient, StringeeCall} from 'stringee';

@Component({
  selector: 'app-modal-call',
  templateUrl: './modal-call.component.html',
  styleUrls: ['./modal-call.component.scss'],
})
export class ModalCallComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  public loading = {
    submit: false,
    data: false,
  };
  public form = this.fb.group({
    platform: [null, [Validators.required]],
    phone: [null, [Validators.required]],
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
    this.getCallPlatform();
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

  handleChangePlatform() {
    this.getTokenClient();
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

  settingCallEvent(call1: any) {
    call1.on('error', (info: any) => {
      console.log('on error: ' + JSON.stringify(info));
    });

    call1.on('addlocalstream', (stream: any) => {
      console.log('on addlocalstream', stream);
    });

    call1.on('addremotestream', (stream: any) => {
      console.log('on addremotestream', stream);
      // reset srcObject to work around minor bugs in Chrome and Edge.
    });

    call1.on('signalingstate', (state: any) => {
      console.log('signalingstate', state);

      if (state.code == 6) {
        // call ended
      }

      if (state.code == 5) {
        // busy here
      }

      const reason = state.reason;
      console.log(reason);
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
      }
    });
  }

  handleCall() {
    try {
      let call = new StringeeCall(
        this.stringeeClient,
        '842473030023',
        '0858882646',
        false,
      );
      this.settingCallEvent(call);
      call.makeCall((res: any) => {
        console.log('make call callback: ', res);
        if (res.r !== 0) {
        } else {
          // call type
          if (res.toType === 'internal') {
          } else {
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.valid) {
      this.handleCall();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
