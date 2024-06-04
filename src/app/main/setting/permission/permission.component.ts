import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETabPermissions} from '@app/types/setting';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
})
export class PermissionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public tabs = [
    {key: ETabPermissions.EMPLOYEE, name: 'Nhân viên'},
    {key: ETabPermissions.ROLE, name: 'Quyền'},
  ];

  public activeTab: ETabPermissions = ETabPermissions.EMPLOYEE;

  protected readonly ETabPermissions = ETabPermissions;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const tab = params.get('tab') ?? '';
        if (!tab || tab === '') {
          this.selectTab(ETabPermissions.EMPLOYEE);
        } else {
          if (
            !Object.values(ETabPermissions).includes(tab as ETabPermissions)
          ) {
            this.selectTab(ETabPermissions.EMPLOYEE);
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
