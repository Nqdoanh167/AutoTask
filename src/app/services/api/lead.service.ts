import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, IQueryBase, ITag} from 'src/app/types/viewmodels';
import {
  ILead,
  ILeadCreateDto,
  ILeadUpdateDto,
  ILeadComment,
  ILeadCommentCreateDto,
  IFolderLead,
  IFunnelGroup,
  IFunnel,
  ILeadStatus,
  ILeadStatusGroup,
  ILeadCreateBulk,
} from '@app/types/lead';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LeadService extends BaseApiService implements OnDestroy {
  private destroy = new Subject();

  public api = {
    lead: 'lead',
  };

  private listLeadStatus$ = new BehaviorSubject<ILeadStatus[]>([]);
  public listLeadStatus = this.listLeadStatus$.asObservable();
  private listLeadStatusGroup$ = new BehaviorSubject<ILeadStatusGroup[]>([]);
  public listLeadStatusGroup = this.listLeadStatusGroup$.asObservable();
  private listLeadTag$ = new BehaviorSubject<ITag[]>([]);
  public listLeadTag = this.listLeadTag$.asObservable();
  private listLeadFolder$ = new BehaviorSubject<IFolderLead[]>([]);
  public listLeadFolder = this.listLeadFolder$.asObservable();

  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiModule,
            `bizs/${res.alias}/auto-task`,
          );
        }
      },
    });
  }

  lead = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<ILead[]>>(
        this.createUrl([this.api.lead]),
        {
          params: this.createParams(params),
        },
      ),
    getById: (
      id: string,
      params: {
        populate?: ('taskIds' | 'tagIds' | 'statusId' | 'funnelId')[];
      } = {},
    ) =>
      this.httpClient.get<EntityResult<ILead>>(
        this.createUrl([this.api.lead, id]),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: ILeadCreateDto) =>
      this.httpClient.post<EntityResult<ILead>>(
        this.createUrl([this.api.lead]),
        body,
      ),
    update: (id: string, body: ILeadUpdateDto) =>
      this.httpClient.patch<EntityResult<ILead>>(
        this.createUrl([this.api.lead, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.lead, id]),
      ),
    bulkDelete: (ids: string[]) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.lead, 'bulk']),
        {body: {ids}},
      ),
    bulkUpdate: (body: {ids: string[]; payload: any}) =>
      this.httpClient.patch<EntityResult<any>>(
        this.createUrl([this.api.lead, 'bulk']),
        body,
      ),

    createBulk: (body: ILeadCreateBulk) =>
      this.httpClient.post<EntityResult<ILead[]>>(
        this.createUrl([this.api.lead, 'bulk']),
        body,
      ),

    getKanban: (params: IQueryBase = {}) =>
      this.httpClient.get<
        EntityResult<
          {
            statusId: string;
            items: ILead[];
          }[]
        >
      >(this.createUrl([this.api.lead, 'kanban']), {
        params: this.createParams(params),
      }),

    getCount: (params: IQueryBase = {}) =>
      this.httpClient.get<
        EntityResult<
          {
            statusId: string;
            count: number;
          }[]
        >
      >(this.createUrl([this.api.lead, 'count']), {
        params: this.createParams(params),
      }),
  };

  leadStatus = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<ILeadStatus[]>>(
        this.createUrl([this.api.lead, 'status']),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: any) =>
      this.httpClient.post<EntityResult<ILeadStatus>>(
        this.createUrl([this.api.lead, 'status']),
        body,
      ),
    update: (id: string, body: any) =>
      this.httpClient.patch<EntityResult<ILeadStatus>>(
        this.createUrl([this.api.lead, 'status', id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.lead, 'status', id]),
      ),
  };

  leadStatusGroup = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<ILeadStatusGroup[]>>(
        this.createUrl([this.api.lead, 'status-group']),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: {
      name: string;
      isDefault: boolean;
      leadStatusIds: string[];
    }) =>
      this.httpClient.post<EntityResult<ILeadStatusGroup>>(
        this.createUrl([this.api.lead, 'status-group']),
        body,
      ),
    update: (
      id: string,
      body: {name: string; isDefault: boolean; leadStatusIds: string[]},
    ) =>
      this.httpClient.patch<EntityResult<ILeadStatusGroup>>(
        this.createUrl([this.api.lead, 'status-group', id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.lead, 'status-group', id]),
      ),
  };

  leadFolder = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<IFolderLead[]>>(
        this.createUrl([this.api.lead, 'folder']),
        {
          params: this.createParams(params),
        },
      ),
    getWithFunnels: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<IFolderLead[]>>(
        this.createUrl([this.api.lead, 'folder', 'with-funnels']),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: {name: string; statusGroupId: string}) =>
      this.httpClient.post<EntityResult<IFolderLead>>(
        this.createUrl([this.api.lead, 'folder']),
        body,
      ),
    update: (id: string, body: {name: string; statusGroupId: string}) =>
      this.httpClient.patch<EntityResult<IFolderLead>>(
        this.createUrl([this.api.lead, 'folder', id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<IFolderLead>>(
        this.createUrl([this.api.lead, 'folder', id]),
      ),
  };

  leadGroupFunnel = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<IFunnelGroup[]>>(
        this.createUrl([this.api.lead, 'funnel-group']),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: {name: string; folderId: string; statusGroupId: string}) =>
      this.httpClient.post<EntityResult<IFunnelGroup>>(
        this.createUrl([this.api.lead, 'funnel-group']),
        body,
      ),
    update: (
      id: string,
      body: {name: string; folderId: string; statusGroupId: string},
    ) =>
      this.httpClient.patch<EntityResult<IFunnelGroup>>(
        this.createUrl([this.api.lead, 'funnel-group', id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<IFunnelGroup>>(
        this.createUrl([this.api.lead, 'funnel-group', id]),
      ),
  };

  leadFunnel = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<IFunnel[]>>(
        this.createUrl([this.api.lead, 'funnel']),
        {
          params: this.createParams(params),
        },
      ),
    create: (body: {
      name: string;
      folderId: string;
      funnelGroupId: string;
      statusGroupId: string;
      isAutoCreateTask?: boolean;
      addChainActIds?: string[];
    }) =>
      this.httpClient.post<EntityResult<IFunnel>>(
        this.createUrl([this.api.lead, 'funnel']),
        body,
      ),
    update: (
      id: string,
      body: {
        name: string;
        folderId: string;
        funnelGroupId: string;
        statusGroupId: string;
        isAutoCreateTask?: boolean;
        addChainActIds?: string[];
      },
    ) =>
      this.httpClient.patch<EntityResult<IFunnel>>(
        this.createUrl([this.api.lead, 'funnel', id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<IFunnel>>(
        this.createUrl([this.api.lead, 'funnel', id]),
      ),
  };

  leadComment = {
    get: (params: IQueryBase = {}) =>
      this.httpClient.get<EntityResult<ILeadComment[]>>(
        this.createUrl([this.api.lead, 'comments']),
        {
          params: this.createParams({...params}),
        },
      ),
    create: (body: ILeadCommentCreateDto) =>
      this.httpClient.post<EntityResult<ILeadComment>>(
        this.createUrl([this.api.lead, 'comments']),
        body,
      ),
  };

  setListLeadStatus(items: ILeadStatus[]) {
    this.listLeadStatus$.next(items);
  }
  setListLeadStatusGroup(items: ILeadStatusGroup[]) {
    this.listLeadStatusGroup$.next(items);
  }
  setListLeadFolder(items: IFolderLead[]) {
    this.listLeadFolder$.next(items);
  }

  setListLeadTag(items: ITag[]) {
    this.listLeadTag$.next(items);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
