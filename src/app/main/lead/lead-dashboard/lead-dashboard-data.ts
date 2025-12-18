import {inject} from '@angular/core';
import {finalize, shareReplay, takeUntil, Observable} from 'rxjs';
import {CheckboxSortTableComponent} from '@share/common/checkbox-table/checkbox-sort-table.component';
import {ILead, ILeadTag, ILeadStatus} from '@app/types/lead';
import {CommonService} from '@app/services/common/common.service';
import {ICommonDataLazy, ITag, IQueryBase} from '@app/types/viewmodels';
import {
  LEAD_CONFIG_FILTERS,
  LEAD_CONFIG_BUTTON,
} from '../lead.variable';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ISource} from '@app/types/setting';

export class LeadDashboardData extends CheckboxSortTableComponent<
  ILead,
  IQueryBase
> {
  protected readonly commonService = inject(CommonService);
  protected readonly autoTaskService = inject(AutoTaskService);

  public override configFilters = LEAD_CONFIG_FILTERS;
  public override configButtons = LEAD_CONFIG_BUTTON;

  public sort: any = {
    updatedAt: 0,
    createdAt: 0,
    totalPrice: 0,
  };

  public statuses: ICommonDataLazy<ILeadStatus, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 1000,
      sort: 'pos',
    },
    isAllowLoadMore: false,
  };

  public tags: ICommonDataLazy<ILeadTag, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 1000,
      sort: 'pos',
    },
    isAllowLoadMore: false,
  };

  public sources: ICommonDataLazy<ISource, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 1000,
      isActive: true,
    },
    isAllowLoadMore: false,
  };

  constructor() {
    super();
    this.getLeadStatuses();
    this.getLeadTags();
    this.getPublicSourcesCache();
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};

    // Apply sort
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];
    this.autoTaskService.lead
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

  /**
   * Generic method for data fetching with post-processing callbacks
   */
  protected getData<T>(
    serviceMethod: Observable<any>,
    filterName: string,
    dataContainer: ICommonDataLazy<T, IQueryBase>,
    onSuccess?: (data: T[]) => void,
    forceRefresh = false,
  ): void {
    // Fetch from API
    dataContainer.loading = true;
    serviceMethod
      .pipe(
        finalize(() => {
          dataContainer.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            dataContainer.rows = res.data;

            // Update filter options
            const filter = this.configFilters.find(
              (f) => f.name === filterName,
            );
            if (filter) {
              filter.options = res.data;
            }

            // Call post-processing callback
            onSuccess?.(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  /**
   * Hook method for status map building after API success
   * Override in child classes to implement custom logic
   */
  protected onStatusesSuccess(statuses: ILeadStatus[]): void {
    // Default implementation: do nothing
  }

  /**
   * Hook method for tag map building after API success
   * Override in child classes to implement custom logic
   */
  protected onTagsSuccess(tags: ILeadTag[]): void {
    // Default implementation: do nothing
  }

  /**
   * Get lead statuses
   */
  getLeadStatuses(forceRefresh = false) {
    this.getData<ILeadStatus>(
      this.autoTaskService.leadStatus.get(this.statuses.paramsQuery),
      'statusId_in',
      this.statuses,
      (statuses) => this.onStatusesSuccess(statuses),
      forceRefresh,
    );
  }

  /**
   * Get lead tags
   */
  getLeadTags(forceRefresh = false) {
    this.getData<ILeadTag>(
      this.autoTaskService.leadTag.get(this.tags.paramsQuery),
      'tagIds_in',
      this.tags,
      (tags) => this.onTagsSuccess(tags),
      forceRefresh,
    );
  }

  changeSort(field: string) {
    if (this.sort[field] === 0) {
      this.sort[field] = -1;
    } else if (this.sort[field] === -1) {
      this.sort[field] = 1;
    } else {
      this.sort[field] = 0;
    }
    this.getDataSource(true);
  }

  handleSearch(term: string) {
    this.item.paramsQuery.q = term;
    this.getDataSource(true);
  }

  handleFilterChange(filters: any) {
    const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');
    Object.assign(filterObj, filters);
    this.item.paramsQuery.filter = JSON.stringify(filterObj);
    this.getDataSource(true);
  }

  /**
   * Get public sources from cache (BehaviorSubject)
   * This listens to the shared source list to avoid redundant API calls
   */
  getPublicSourcesCache() {
    this.autoTaskService.listSourceObservable
      .pipe(
        finalize(() => (this.sources.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          this.sources.rows = res || [];

          // If no sources in BehaviorSubject, load from API
          if (!res || res.length === 0) {
            this.getPublicSources();
          }
        },
        error: (err) => {
          this.sources.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  /**
   * Load public sources from API and populate BehaviorSubject
   * This ensures sources are available for all components
   */
  getPublicSources() {
    this.sources.loading = true;
    this.autoTaskService.source
      .get(this.sources.paramsQuery)
      .pipe(
        finalize(() => (this.sources.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sources.rows = res.data || [];
            // Populate BehaviorSubject so other components can use it
            this.autoTaskService.setListSource(this.sources.rows);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  /**
   * Get cached public sources for use in modals
   */
  getCachedPublicSources(): ISource[] {
    return this.sources.rows;
  }
}
