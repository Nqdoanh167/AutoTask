import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {
  EntityResult,
  IHistory,
  IQueryBase,
  ITag,
} from 'src/app/types/viewmodels';
import {
  ILead,
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
import {IBranchTaskDto, ModifiedUserUnit} from '@app/types/flow';

@Injectable({
  providedIn: 'root',
})
export class LeadService extends BaseApiService implements OnDestroy {
  private destroy = new Subject();

  public api = {
    lead: 'lead',
    history: 'lead-history',
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
    create: (body: ILead) =>
      this.httpClient.post<EntityResult<ILead>>(
        this.createUrl([this.api.lead]),
        body,
      ),
    update: (id: string, body: ILead) =>
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

  history = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IHistory[]>>(
        this.createUrl([this.api.history]),
        {
          params: this.createParams({...params}),
        },
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

  getUserUnits(isCheckSelectable = true) {
    let units: ModifiedUserUnit[] = [];
    const currentBiz = this.authService.getCurrentBiz();
    if (currentBiz?.user?.roleBranches) {
      units = currentBiz.user.roleBranches?.map((branch) => {
        return {
          key: branch.id,
          data: branch.id,
          label: branch.name,
          selectable: isCheckSelectable ? !branch.departments?.length : true,
          id: branch.id,
          name: branch.name,
          department: null,
          departmentName: null,
          team: null,
          teamName: null,
          children: branch.departments?.map((department) => {
            return {
              key: department.id,
              data: department.id,
              label: department.name,
              selectable: isCheckSelectable ? !department.teams?.length : true,
              id: branch.id,
              name: branch.name,
              department: department.id,
              departmentName: department.name,
              team: null,
              teamName: null,
              children: department.teams?.map((team) => {
                return {
                  key: team.id,
                  data: team.id,
                  label: team.name,
                  selectable: true,
                  id: branch.id,
                  name: branch.name,
                  department: department.id,
                  departmentName: department.name,
                  team: team.id,
                  teamName: team.name,
                };
              }),
            };
          }),
        };
      });
    }
    return units;
  }

  getFirstUnit() {
    const units = this.getUserUnits();
    const firstBranch = units?.[0];
    const firstDepartment = units?.[0]?.children?.[0];
    const firstTeam = units?.[0]?.children?.[0]?.children?.[0];
    return firstTeam || firstDepartment || firstBranch;
  }

  // nhận vào mảng ids gồm id của cả chi nhánh , phòng ban và đội nhóm
  // trả về đơn vị đầu tiên tìm thấy trong mảng ids nếu là chi nhánh thì tìm phòng ban và đội nhóm đầu tiên của chi nhánh đó
  // nếu là phòng ban thì tìm đội nhóm đầu tiên của phòng ban đó
  // nếu là đội nhóm thì trả về đội nhóm đó
  getFirstUnitByIds(ids: string[]) {
    const dfs = (units: any): any => {
      for (const u of units) {
        if (ids.includes(u.data)) {
          return u.children?.length ? dfs(u.children) : u;
        }
      }
    };
    return dfs(this.getUserUnits());
  }

  findUnitFromData(data: IBranchTaskDto) {
    const units = this.getUserUnits();
    let res: ModifiedUserUnit | undefined = undefined;
    units.forEach((branch) => {
      if (branch.data === data?.id && !data.department) {
        res = branch;
      } else {
        branch.children?.forEach((department) => {
          if (department.data === data?.department && !data.team) {
            res = department;
          } else {
            department.children?.forEach((team) => {
              if (team.data === data?.team) {
                res = team;
              }
            });
          }
        });
      }
    });
    return res;
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
