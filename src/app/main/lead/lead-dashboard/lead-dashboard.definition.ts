import {inject, Injectable} from '@angular/core';
import {finalize, takeUntil} from 'rxjs';
import {CheckboxSortTableComponent} from '@share/common/checkbox-table/checkbox-sort-table.component';
import {
  ILead,
  ILeadStatus,
  ILeadStatusGroup,
  IFolderLead,
} from '@app/types/lead';
import {CommonService} from '@app/services/common/common.service';
import {EntityPagination, IQueryBase, ITag} from '@app/types/viewmodels';
import {LEAD_CONFIG_FILTERS, LEAD_CONFIG_BUTTON} from '../lead.variable';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LeadService} from '@app/services/api/lead.service';
import {ISource} from '@app/types/setting';

@Injectable()
export class LeadDashboardData extends CheckboxSortTableComponent<
  ILead,
  IQueryBase
> {
  protected readonly commonService = inject(CommonService);
  protected readonly autoTaskService = inject(AutoTaskService);
  protected readonly leadService = inject(LeadService);

  public override configFilters = LEAD_CONFIG_FILTERS;
  public override configButtons = LEAD_CONFIG_BUTTON;

  public sort: any = {
    updatedAt: 0,
    createdAt: 0,
    totalPrice: 0,
  };

  public statuses: EntityPagination<ILeadStatus> = {
    rows: [],
    loading: false,
    limit: 100,
    page: 1,
    total: 0,
  };

  public statusGroups: EntityPagination<ILeadStatusGroup> = {
    rows: [],
    loading: false,
    limit: 100,
    page: 1,
    total: 0,
  };

  public tags: EntityPagination<ITag> = {
    rows: [],
    loading: false,
    limit: 1000,
    page: 1,
    total: 0,
  };

  public sources: EntityPagination<ISource> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };

  public folder: EntityPagination<IFolderLead> = {
    rows: [],
    limit: 100,
    page: 1,
    total: 0,
    loading: false,
  };

  public source: EntityPagination<ISource> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };

  constructor() {
    super();
    this.getStatusesCache();
    this.getStatusGroupsCache();
    this.getTagsCache();
    this.getFoldersCache();
    this.getSourceCache();

    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          ['createdBy.id_in'].forEach((name) => {
            const configFilter = this.configFilters.find(
              (filter) => filter.name === name,
            );
            if (configFilter) {
              configFilter.options = [{name: 'Hệ thống', id: 'system'}].concat(
                this.authService.getColleague(),
              );
            }
          });
        }
      });
  }

  getStatuses() {
    this.statuses.loading = true;
    this.leadService.leadStatus
      .get({
        limit: this.statuses.limit,
        page: this.statuses.page,
        sort: 'pos',
      })
      .pipe(
        finalize(() => (this.statuses.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.statuses.rows = res.data || [];
          this.statuses.total = res.meta?.total || 0;
          this.leadService.setListLeadStatus(this.statuses.rows);
        }
      });
  }

  getStatusesCache() {
    this.leadService.listLeadStatus
      .pipe(
        finalize(() => (this.statuses.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.statuses.rows = res || [];
        this.statuses.total = res.length || 0;
      });
  }

  getStatusGroups() {
    this.statusGroups.loading = true;
    this.leadService.leadStatusGroup
      .get({
        limit: this.statusGroups.limit,
        page: this.statusGroups.page,
      })
      .pipe(
        finalize(() => (this.statusGroups.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.statusGroups.rows = res.data || [];
        this.leadService.setListLeadStatusGroup(this.statusGroups.rows);
      });
  }

  getStatusGroupsCache() {
    this.leadService.listLeadStatusGroup
      .pipe(
        finalize(() => (this.statusGroups.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.statusGroups.rows = res || [];
      });
  }

  getTags() {
    this.tags.loading = true;
    this.autoTaskService.tag
      .get({
        limit: this.tags.limit,
        page: this.tags.page,
        applyFor_in: ['LEAD'],
      })
      .pipe(
        finalize(() => (this.tags.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.tags.rows = res.data || [];
        this.leadService.setListLeadTag(this.tags.rows);
        const configFilterTag = this.configFilters.find(
          (item) => item.name === 'tagIds_in',
        );
        if (configFilterTag) {
          configFilterTag.options = res.data || [];
        }
      });
  }

  getTagsCache() {
    this.leadService.listLeadTag
      .pipe(
        finalize(() => (this.tags.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.tags.rows = res || [];
      });
  }

  getFolders() {
    this.folder.loading = true;
    this.leadService.leadFolder
      .getWithFunnels({
        limit: this.folder.limit,
        page: this.folder.page,
      })
      .pipe(
        finalize(() => (this.folder.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.folder.rows = res.data || [];
        this.folder.total = res.meta?.total || 0;
        this.leadService.setListLeadFolder(res.data);
      });
  }

  getFoldersCache() {
    this.leadService.listLeadFolder
      .pipe(
        finalize(() => (this.folder.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.folder.rows = res || [];
      });
  }

  getSource() {
    this.source.loading = true;
    this.autoTaskService.source
      .get({
        limit: this.source.limit,
        page: this.source.page,
      })
      .pipe(
        finalize(() => (this.source.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.source.rows = res.data || [];
          this.source.total = res.meta?.total || 0;
          this.autoTaskService.setListSource(this.source.rows);
        }
      });
  }

  getSourceCache() {
    this.autoTaskService.listSourceObservable
      .pipe(
        finalize(() => (this.source.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.source.rows = res || [];
      });
  }

  getTagById(tagId?: string): ITag | undefined {
    return this.tags.rows.find((tag) => tag.id === tagId);
  }

  getStatusById(statusId?: string): ILeadStatus | undefined {
    return this.statuses.rows.find((status) => status.id === statusId);
  }
}
