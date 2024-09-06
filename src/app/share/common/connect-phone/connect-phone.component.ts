import {Component, OnInit} from '@angular/core';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {CommonService} from '@app/services/common/common.service';
import {ToastrService} from 'ngx-toastr';
import {VOICE_PLATFORMS} from '@app/utils/variables';
import {ICommonDataSource, IQueryBase, User} from '@app/types/viewmodels';
import {EVoicePlatform, ManageMappingPhone} from '@app/types/sms-ott-call';
import {finalize, takeUntil} from 'rxjs';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {NgIf} from '@angular/common';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {PhoneCallService} from '@app/services/common/phone-call.service';
import {StringeeService} from '@app/services/common/stringee.service';
import {OmiExtension} from '@app/types/omicall';
import {OmicallService} from '@app/services/common/omicall.service';

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
  protected hasPermitSmsOttCall =
    this.authService.checkPermittedModule('sms-ott-call');
  protected connectedPhone: ManageMappingPhone | undefined;
  protected platforms = VOICE_PLATFORMS;

  constructor(
    private readonly smsOttCallService: SmsOttCallService,
    private readonly commonService: CommonService,
    private readonly toarstService: ToastrService,
    private readonly phoneCallService: PhoneCallService,
    private readonly stringeeService: StringeeService,
    private readonly omicallService: OmicallService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.hasPermitSmsOttCall) {
      this.getUserPhones();
    }
    this.phoneCallService.connectLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.loading.connectPhone = res;
      });
    this.phoneCallService.connectedPhone$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.connectedPhone = res;
      });
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
            if (res.data.length) {
              this.handleConnectToPhone(res.data[0]);
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  getTokenStringee(platformId: string) {
    this.phoneCallService.connectLoading$.next(true);
    this.smsOttCallService.platform
      .getTokenReceiveCall(platformId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data.token) {
            this.stringeeService.loginStringee(res.data.token);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleConnectToPhone(data: ManageMappingPhone) {
    if (data.platform.platform === EVoicePlatform.STRINGEE) {
      if (data.platform?.id) {
        this.phoneCallService.connectedPhone$.next(data);
        this.getTokenStringee(data.platform.id);
      } else {
        this.toarstService.warning('Không tìm thấy ID của nền tảng!');
      }
    } else if (data.platform.platform === EVoicePlatform.OMICALL) {
      const {fullName, email, phone, domain, sipUser, password} =
        data?.counselor;
      const bodyOmicall = {
        fullName,
        email,
        phone,
        domain,
        sipUser,
        password,
      };
      this.phoneCallService.connectedPhone$.next(data);
      this.handleChangeOmicallExtension(bodyOmicall);
    } else {
      this.toarstService.info(
        'Chức năng này hiện chỉ hỗ trợ nền tảng Stringee và Omicall!',
      );
    }
  }

  // OMICALL
  handleChangeOmicallExtension(dataConfig: OmiExtension) {
    this.omicallService.omicallInit(dataConfig);
  }

  handleDisconnectPhone() {
    this.phoneCallService.connectedPhone$.next(undefined);
    if (this.connectedPhone?.platform.platform === EVoicePlatform.STRINGEE) {
      this.stringeeService.logoutStringee();
    }
  }
}
