import {Component, OnDestroy, OnInit} from '@angular/core';
import {EPerActSetting, EPerActType, ETabPermissions} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-decentralization',
  templateUrl: './decentralization.component.html',
  styleUrls: ['./decentralization.component.scss'],
})
export class DecentralizationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public tabs: {key: ETabPermissions; name: string}[] = [];

  public activeTab: ETabPermissions = ETabPermissions.EMPLOYEE;

  protected readonly ETabPermissions = ETabPermissions;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    if (
      permissions.find((p) =>
        [
          EPerActSetting.UPDATE_USER_ACCESS,
          EPerActSetting.VIEW_USER_ACCESS_SAME_LEVEL,
        ].includes(p as EPerActSetting),
      )
    ) {
      this.tabs.push({key: ETabPermissions.EMPLOYEE, name: 'Nhân viên'});
    }
    if (
      permissions.find((p) =>
        [
          EPerActSetting.VIEW_PERMISSION_SETTING_ACCESS,
          EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
        ].includes(p as EPerActSetting),
      )
    ) {
      this.tabs.push({key: ETabPermissions.PERMISSION, name: 'Quyền'});
    }
  }

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const tab = params.get('tab') ?? '';
        const defaultTab = this.tabs[0]?.key || '';
        if (!tab || tab === '') {
          this.selectTab(defaultTab);
        } else {
          if (
            !Object.values(ETabPermissions).includes(tab as ETabPermissions) ||
            !this.tabs?.find((t) => t.key === tab)
          ) {
            this.selectTab(defaultTab);
            return;
          }
          this.activeTab = tab as ETabPermissions;
        }
      });
  }

  selectTab(tab: ETabPermissions) {
    this.activeTab = tab;
    const queryParams = {tab};
    const currentQueryParams = this.route.snapshot.queryParams;
    const updatedQueryParams = {...currentQueryParams, ...queryParams};
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updatedQueryParams,
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
