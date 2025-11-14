import { inject } from '@angular/core';
import { finalize, shareReplay, takeUntil, Observable } from 'rxjs';
import { CheckboxSortTableComponent } from '@share/common/checkbox-table/checkbox-sort-table.component';
import { ILead, ILeadQuery, ILeadStatus, ILeadTag } from '@app/types/lead';
import { CommonService } from '@app/services/common/common.service';
import { ICommonDataLazy, ITag, IQueryBase } from '@app/types/viewmodels';
import {
  LEAD_CONFIG_FILTERS,
  LEAD_CONFIG_BUTTON,
} from './lead-dashboard-variables';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { SocketService } from '@app/services/api/socket.service';
import { ISource } from '@app/types/setting';

export class LeadDashboardData extends CheckboxSortTableComponent<
  ILead,
  ILeadQuery
> {
  protected readonly commonService = inject(CommonService);
  protected readonly autoTaskService = inject(AutoTaskService);
  protected readonly socketService = inject(SocketService);

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
    let params = { ...this.item.paramsQuery };

    // Apply sort
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];
    this.autoTaskService.lead.get(params)
      .pipe(
        finalize(() => {
          this.item = { ...this.item, loading: false };
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
   * Generic method for cached data fetching with post-processing callbacks
   */
  protected getCachedData<T>(
    cacheKey: string,
    cacheTimestampKey: string,
    serviceMethod: Observable<any>,
    filterName: string,
    dataContainer: ICommonDataLazy<T, IQueryBase>,
    onCacheHit?: (data: T[]) => void,
    onApiSuccess?: (data: T[]) => void,
    forceRefresh = false
  ): void {
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Check cache first
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

      if (cachedData && cachedTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(cachedTimestamp, 10);

        // If cache is still valid, use it
        if (now - timestamp < CACHE_TTL) {
          try {
            const parsedData = JSON.parse(cachedData);
            dataContainer.rows = parsedData;

            // Update filter options
            const filter = this.configFilters.find((f) => f.name === filterName);
            if (filter) {
              filter.options = parsedData;
            }

            // Call post-processing callback
            onCacheHit?.(parsedData);

            return; // Skip API call
          } catch (e) {
            console.error(`Error parsing cached ${cacheKey}:`, e);
            // Continue to API call if cache parsing fails
          }
        }
      }
    }

    // Cache miss or expired - fetch from API
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

            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify(res.data));
            localStorage.setItem(cacheTimestampKey, Date.now().toString());

            // Update filter options
            const filter = this.configFilters.find((f) => f.name === filterName);
            if (filter) {
              filter.options = res.data;
            }

            // Call post-processing callback
            onApiSuccess?.(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  /**
   * Hook method called when status cache is invalidated
   * Override in child classes to implement custom cleanup logic
   */
  protected onStatusesCacheInvalidated(): void {
    // Default implementation: do nothing
  }

  /**
   * Hook method called when tag cache is invalidated
   * Override in child classes to implement custom cleanup logic
   */
  protected onTagsCacheInvalidated(): void {
    // Default implementation: do nothing
  }

  /**
   * Invalidate lead statuses cache (call this after create/update/delete status)
   */
  invalidateLeadStatusesCache() {
    localStorage.removeItem('leadStatuses_cache');
    localStorage.removeItem('leadStatuses_cache_timestamp');
    this.onStatusesCacheInvalidated();
  }

  /**
   * Hook method for status map building after cache hit
   * Override in child classes to implement custom logic
   */
  protected onStatusesCacheHit(statuses: ILeadStatus[]): void {
    // Default implementation: do nothing
  }

  /**
   * Hook method for status map building after API success
   * Override in child classes to implement custom logic
   */
  protected onStatusesApiSuccess(statuses: ILeadStatus[]): void {
    // Default implementation: do nothing
  }

  /**
   * Hook method for tag map building after cache hit
   * Override in child classes to implement custom logic
   */
  protected onTagsCacheHit(tags: ILeadTag[]): void {
    // Default implementation: do nothing
  }

  /**
   * Hook method for tag map building after API success
   * Override in child classes to implement custom logic
   */
  protected onTagsApiSuccess(tags: ILeadTag[]): void {
    // Default implementation: do nothing
  }

  /**
   * Get lead statuses with caching (5 minutes TTL)
   */
  getLeadStatuses(forceRefresh = false) {
    this.getCachedData<ILeadStatus>(
      'leadStatuses_cache',
      'leadStatuses_cache_timestamp',
      this.autoTaskService.leadStatus.get(this.statuses.paramsQuery),
      'statusId_in',
      this.statuses,
      (statuses) => this.onStatusesCacheHit(statuses),
      (statuses) => this.onStatusesApiSuccess(statuses),
      forceRefresh
    );
  }

  /**
   * Invalidate lead tags cache (call this after create/update/delete tag)
   */
  invalidateLeadTagsCache() {
    localStorage.removeItem('leadTags_cache');
    localStorage.removeItem('leadTags_cache_timestamp');
    this.onTagsCacheInvalidated();
  }

  /**
   * Get lead tags with caching (5 minutes TTL)
   */
  getLeadTags(forceRefresh = false) {
    this.getCachedData<ILeadTag>(
      'leadTags_cache',
      'leadTags_cache_timestamp',
      this.autoTaskService.leadTag.get(this.tags.paramsQuery),
      'tagIds_in',
      this.tags,
      (tags) => this.onTagsCacheHit(tags),
      (tags) => this.onTagsApiSuccess(tags),
      forceRefresh
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
   * Get cached funnels data for use in modals
   */
  getCachedFunnels() {
    const CACHE_KEY = 'leadFoldersWithFunnels_cache';
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem('leadFoldersWithFunnels_cache_timestamp');

    if (cachedData && cachedTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(cachedTimestamp, 10);
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      if (now - timestamp < CACHE_TTL) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          console.error('Error parsing cached funnels:', e);
        }
      }
    }
    return null;
  }

  /**
   * Reload funnels data - called after funnel create/update/delete operations
   * This invalidates the cache so that LeadFormModalComponent and other components
   * will fetch fresh data from API on their next load
   */
  reloadFunnels() {
    // Invalidate funnel cache - components using funnel data will reload automatically
    localStorage.removeItem('leadFoldersWithFunnels_cache');
    localStorage.removeItem('leadFoldersWithFunnels_cache_timestamp');

    // Note: LeadFormModalComponent will automatically fetch fresh data when opened again
    // because the cache has been invalidated
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
