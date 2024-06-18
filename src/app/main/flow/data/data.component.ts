import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETabConfigData} from '@app/types/flow';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {EPerActFlow, EPerActType} from '@app/types/setting';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss'],
})
export class DataComponent implements OnInit, OnDestroy {
  public tabs = [
    {key: ETabConfigData.ACTION, name: 'Hành động'},
    {
      key: ETabConfigData.CHAIN_ACTION,
      name: 'Chuỗi hành động',
    },
    {key: ETabConfigData.RESULT, name: 'Kết quả'},
    {key: ETabConfigData.REASON, name: 'Nguyên nhân'},
  ];
  public activeTab: ETabConfigData = ETabConfigData.ACTION;
  public permission = {
    edit: false,
  };

  protected readonly ETabConfigData = ETabConfigData;

  private destroy$ = new Subject();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    const permissions = this.authService.getUserPerByType(EPerActType.FLOW);
    this.permission.edit = permissions?.some(
      (per) => per === EPerActFlow.UPDATE_FLOW,
    );
  }

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const tab = params.get('tab') ?? '';
        if (!tab || tab === '') {
          this.selectTab(ETabConfigData.ACTION);
        } else {
          if (!Object.values(ETabConfigData).includes(tab as ETabConfigData)) {
            this.selectTab(ETabConfigData.ACTION);
            return;
          }
          this.activeTab = tab as ETabConfigData;
        }
      });
  }

  selectTab(tab: ETabConfigData) {
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
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
