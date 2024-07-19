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
  protected connectedPhone: string | undefined;
  protected platforms = VOICE_PLATFORMS;

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

  getTokenStringee(platformId: string) {
    this.loading.connectPhone = true;
    this.smsOttCallService.platform
      .getTokenReceiveCall(platformId)
      .pipe(
        finalize(() => (this.loading.connectPhone = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          if (res.status === 200) {
            // this.connectedPhone = res.data.token;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleConnectToPhone(data: ManageMappingPhone) {
    console.log(data);
    if (data.platform.platform === EVoicePlatform.STRINGEE) {
      if (data.platform?.id) {
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
