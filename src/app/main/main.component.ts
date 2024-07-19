import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, finalize, map, takeUntil} from 'rxjs';
import {ICommonDataSource, IQueryBase, ISidebar} from '../types/viewmodels';
import {MainService} from '@app/services/api/main.service';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {CommonService} from '@app/services/common/common.service';
import {EVoicePlatform, ManageMappingPhone} from '@app/types/sms-ott-call';
import {VOICE_PLATFORMS} from '@app/utils/variables';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent extends BaseComponentsComponent implements OnInit {
  public isHiddenSidebar = false;
  public listNavItems: ISidebar[] = [];
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
    private router: Router,
    private title: Title,
    private readonly mainService: MainService,
    private readonly smsOttCallService: SmsOttCallService,
    private readonly commonService: CommonService,
    private readonly toarstService: ToastrService,
  ) {
    super();
    this.title.setTitle(`Smax App | ${this.currentBiz?.name} | Auto Task`);
    this.hasPermitSmsOttCall = !!this.currentBiz?.modules?.find(
      (el) => el.alias === 'sms-ott-call',
    );
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          this.isHiddenSidebar =
            route.snapshot.data['isHiddenSidebar'] || false;
          return routeTitle;
        }),
      )
      .subscribe((title: string) => {
        if (title) {
          this.title.setTitle(
            `Smax App | ${this.currentBiz?.name || ''} | ${title}`,
          );
        }
      });
  }

  ngOnInit(): void {
    this.mainService.headerTab$.pipe().subscribe((res) => {
      if (res) {
        this.listNavItems = res;
      }
    });
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
