import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {LeadDashboardData} from '../lead-dashboard.definition';
import {finalize, shareReplay, takeUntil} from 'rxjs';
import {IFunnel, ILead} from '@app/types/lead';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';

@Component({
  selector: 'app-lead-list-view',
  templateUrl: './lead-list-view.component.html',
  styleUrl: './lead-list-view.component.scss',
})
export class LeadListViewComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Input() currentFunnel!: IFunnel | null;
  @Input() checkbox: any = {};
  @Input() override item: ICommonDataSource<ILead, IQueryBase> = {
    rows: [],
    loading: false,
    isFirstRequest: true,
    paramsQuery: {
      limit: 20,
      page: 1,
      q: '',
      sort: '-createdAt',
    },
    total: 0,
    after: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    console.log({changes: changes['currentFunnel']});
    if (changes['currentFunnel']) {
      this.getDataSource(true);
    }
  }

  override ngOnInit(): void {}

  /**
   * Áp dụng các filter chung cho filterObj (funnelId, accessibleIds, roleIds)
   */
  protected applyCommonFilters(filterObj: any): void {
    if (this.checkbox.accessibleIds?.length) {
      filterObj['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      delete filterObj['accessibleIds'];
    }
    delete filterObj['branchIds'];
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];
    if (validRoleIds.length > 0) {
      filterObj['teams.roleId_in'] = validRoleIds;
    } else {
      delete filterObj['teams.roleId_in'];
    }
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];
    const filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);
    params.filter = JSON.stringify(filterObj);

    this.leadService.lead
      .get(params)
      .pipe(
        finalize(() => {
          this.item = {...this.item, loading: false};
        }),
        shareReplay(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.meta?.total || 0;
            if (res.meta?.after) this.item.after = res.meta.after;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          console.error('Error fetching leads:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  override pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
        limit: Number(limit),
      };
    }
    delete this.item.paramsQuery.after;
    this.getDataSource();
  }
}
