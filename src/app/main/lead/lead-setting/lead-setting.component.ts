import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {EPerActType, EPerActLead, ETabLeadSettings} from '@app/types/setting';

@Component({
  selector: 'app-lead-setting',
  templateUrl: './lead-setting.component.html',
  styleUrls: ['./lead-setting.component.scss'],
})
export class LeadSettingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public tabs: {key: ETabLeadSettings; name: string}[] = [];

  public activeTab: ETabLeadSettings = ETabLeadSettings.STATUS;

  protected readonly ETabLeadSettings = ETabLeadSettings;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.tabs = [
      ...this.tabs,
      {key: ETabLeadSettings.STATUS, name: 'Trạng thái'},
      {key: ETabLeadSettings.TAG, name: 'Tags'},
    ]
    // TODO: Phân quyền sau
    
    // const permissions = this.authService.getUserPerByType(EPerActType.LEAD);
    // if (
    //   permissions.find((p) =>
    //     [
    //       EPerActLead.VIEW_LEAD_STATUS_SETTING,
    //       EPerActLead.UPDATE_LEAD_STATUS_SETTING,
    //     ].includes(p as EPerActLead),
    //   )
    // ) {
    //   this.tabs.push({key: ETabLeadSettings.STATUS, name: 'Trạng thái'});
    // }
    // if (
    //   permissions.find((p) =>
    //     [
    //       EPerActLead.VIEW_LEAD_TAG_SETTING,
    //       EPerActLead.UPDATE_LEAD_TAG_SETTING,
    //     ].includes(p as EPerActLead),
    //   )
    // ) {
    //   this.tabs.push({key: ETabLeadSettings.TAG, name: 'Tags'});
    // }
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
            !Object.values(ETabLeadSettings).includes(tab as ETabLeadSettings) ||
            !this.tabs?.find((t) => t.key === tab)
          ) {
            this.selectTab(defaultTab);
            return;
          }
          this.activeTab = tab as ETabLeadSettings;
        }
      });
  }

  selectTab(tab: ETabLeadSettings) {
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
