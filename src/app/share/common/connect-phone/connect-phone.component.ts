import {Component, OnInit} from '@angular/core';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {ToastrService} from 'ngx-toastr';
import {VOICE_PLATFORMS} from '@app/utils/variables';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';
import {EVoicePlatform, ManageMappingPhone} from '@app/types/sms-ott-call';
import {finalize, takeUntil} from 'rxjs';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {NgIf} from '@angular/common';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {StringeeClient} from 'stringee';

@Component({
  selector: 'app-connect-phone',
  standalone: true,
  imports: [BsDropdownModule, NgIf, TooltipModule],
  templateUrl: './connect-phone.component.html',
  styleUrl: './connect-phone.component.scss',
})
export class ConnectPhoneComponent
  extends BaseComponentsComponent
  implements OnInit
{
  public loading = {
    connectPhone: false,
  };

  protected userPhones: ICommonDataSource<ManageMappingPhone, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {},
    total: 0,
  };
  protected hasPermitSmsOttCall = false;
  protected connectedPhone: ManageMappingPhone | undefined;
  protected platforms = VOICE_PLATFORMS;
  protected stringeeClient: any;
  protected call: any;
  protected authenticatedWithUserId: any;

  constructor(
    private readonly smsOttCallService: SmsOttCallService,
    private readonly commonService: CommonService,
    private readonly toarstService: ToastrService,
  ) {
    super();
    this.hasPermitSmsOttCall = !!this.currentBiz?.modules?.find(
      (el) => el.alias === 'sms-ott-call',
    );
  }

  ngOnInit() {
    if (this.hasPermitSmsOttCall) {
      this.getUserPhones();
    }
  }

  getVoicePlatform(platform: EVoicePlatform) {
    return this.platforms.find((p) => p.value === platform);
  }

  getUserPhones() {
    this.userPhones.loading = true;
    this.smsOttCallService.manageConnect
      .getPhones()
      .pipe(
        finalize(() => (this.userPhones.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.userPhones.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
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
    });

    call1.on('signalingstate', (state: any) => {
      console.log('signalingstate ', state);
    });

    call1.on('mediastate', (state: any) => {
      console.log('mediastate ', state);
    });

    call1.on('info', (info: any) => {
      console.log('on info', info);
    });

    call1.on('otherdevice', (data: any) => {
      console.log('on otherdevice', data);
    });
  }

  settingClientEvents() {
    this.stringeeClient.on('connect', () => {
      console.log('connected to StringeeServer');
    });

    this.stringeeClient.on('authen', (res: any) => {
      console.log('on authen: ', res);
      this.loading.connectPhone = false;
      if (res.r === 0) {
        this.authenticatedWithUserId = res.userId;
      } else {
        this.connectedPhone = undefined;
        console.log('authen error: ', res);
      }
    });

    this.stringeeClient.on('disconnect', () => {
      console.log('disconnected');
      this.loading.connectPhone = false;
      this.connectedPhone = undefined;
    });

    this.stringeeClient.on('incomingcall', (incomingcall: any) => {
      this.call = incomingcall;
      this.settingCallEvents(incomingcall);
      console.log('incomingcall: ', incomingcall);
    });

    this.stringeeClient.on('requestnewtoken', () => {
      console.log(`request new token;
            please get new access_token from YourServer
            and call client.connect(new_access_token)`);
    });

    this.stringeeClient.on('otherdeviceauthen', (data: any) => {
      console.log('otherdeviceauthen: ', data);
    });
  }

  loginStringee(token: string) {
    this.stringeeClient = new StringeeClient();
    this.settingClientEvents();
    this.stringeeClient.connect(token);
  }

  getTokenStringee(platformId: string) {
    this.loading.connectPhone = true;
    this.smsOttCallService.platform
      .getTokenReceiveCall(platformId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data.token) {
            this.loginStringee(res.data.token);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleConnectToPhone(data: ManageMappingPhone) {
    if (data.platform.platform === EVoicePlatform.STRINGEE) {
      if (data.platform?.id) {
        this.connectedPhone = data;
        this.getTokenStringee(data.platform.id);
      } else {
        this.toarstService.warning('Không tìm thấy ID của nền tảng!');
      }
    } else {
      this.toarstService.info(
        'Chức năng này hiện chỉ hỗ trợ nền tảng Stringee!',
      );
    }
  }
}
