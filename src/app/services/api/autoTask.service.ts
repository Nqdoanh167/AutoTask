import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {
  EntityResult,
  ESocialPlatform,
  IHistory,
  ITag,
  Order,
  TaskDistributionConfig,
} from 'src/app/types/viewmodels';
import {
  BehaviorSubject,
  distinctUntilChanged,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {
  CloneTaskDto,
  IAction,
  IActReason,
  IActResult,
  IAddTaskChainDto,
  IBodyAction,
  IBodyChainResult,
  IBodyResultReason,
  IBodyUpdateOrdering,
  IBranchTaskDto,
  IBulkTaskDto,
  IChainAct,
  IChainResult,
  IManyUpdateChainActResultDto,
  IManyUpsertChainActResultDto,
  IPickResultForActionDto,
  ITask,
  ITaskChainResult,
  ITaskDto,
  IUpdateChainActDto,
  IUpdateDeadlineTaskResult,
  IUpdateTaskResultDto,
  ModifiedUserUnit,
} from '@app/types/flow';
import {
  BulkRemoveUserAcl,
  ELevelPer,
  ISetting,
  ISource,
  IUpdateSourceDto,
  IView,
  IViewDto,
  IViewModeDto,
  Permission,
  PermissionDto,
  UpdatePermissionDto,
  UpdateUserAclDto,
  UserAcl,
  UserPerAccess,
} from '@app/types/setting';
import {omitBy} from 'lodash';
import {ISubmitPayload} from '@app/main/dashboard/content-modal/multiple-action/modal-assign-team-v2/modal-assign-team-v2.component';
import {IFeedback} from '@app/types/feedback';

interface IFilterCanSplitTask {
  roleId: string;
  branchId?: string;
  createdAt?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AutoTaskService extends BaseApiService implements OnDestroy {
  private destroy = new Subject();
  private defaultParams: any = {};

  public api = {
    action: 'action',
    actionResult: 'act-result',
    actionReason: 'act-reason',
    chainAction: 'chain-act',
    chainActionResult: 'chain-act-result',
    task: 'task',
    taskChain: 'task-chain',
    taskChainResult: 'task-chain-result',
    tag: 'tag',
    history: 'task-history',
    source: 'source',
    settingView: 'setting-view',
    setting: 'setting',
    permission: 'permission',
    userAcl: 'user-acl',
    taskDistributionConfig: 'task-distribution-config',
  };

  private dashboardViewModes$ = new BehaviorSubject<IViewModeDto[]>([]);
  public dashboardViewModes = this.dashboardViewModes$.asObservable();

  private changedDashboardViewModes$ = new BehaviorSubject<IViewModeDto[]>([]);
  public changedDashboardViewModes =
    this.changedDashboardViewModes$.asObservable();

  private currentActiveViewMode$ = new BehaviorSubject<
    IViewModeDto | undefined
  >(undefined);
  public currentActiveViewMode = this.currentActiveViewMode$.asObservable();

  private listTagSubject = new BehaviorSubject<ITag[]>(
    null as unknown as ITag[],
  );
  public listTagObservable = this.listTagSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private listViewModeSubject = new BehaviorSubject<EntityResult<IView[]>>(
    null as unknown as EntityResult<IView[]>,
  );

  private listSourceSubject = new BehaviorSubject<ISource[]>(
    null as unknown as ISource[],
  );

  public listSourceObservable = this.listSourceSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private listChainActSubject = new BehaviorSubject<IChainAct[]>(
    null as unknown as IChainAct[],
  );
  public listChainActObservable = this.listChainActSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private listActResultSubject = new BehaviorSubject<IActResult[]>(
    null as unknown as IActResult[],
  );
  public listActResultObservable = this.listActResultSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private listActReasonSubject = new BehaviorSubject<
    EntityResult<IActReason[]>
  >(null as unknown as EntityResult<IActReason[]>);

  private listActionSubject = new BehaviorSubject<IAction[]>(
    null as unknown as IAction[],
  );
  public listActionObservable = this.listActionSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private currentSettingObject = new BehaviorSubject<ISetting>(
    null as unknown as ISetting,
  );

  public currentSetting = this.currentSettingObject
    .asObservable()
    .pipe(distinctUntilChanged());

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

  action = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IAction[]>>(
        this.createUrl([this.api.action]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getOne: (id: string) =>
      this.httpClient.get<EntityResult<IAction>>(
        this.createUrl([this.api.action, id]),
      ),
    create: (body: IBodyAction) =>
      this.httpClient.post<EntityResult<IAction>>(
        this.createUrl([this.api.action]),
        body,
      ),
    update: (id: string, body: IBodyAction) =>
      this.httpClient.patch<EntityResult<IAction>>(
        this.createUrl([this.api.action, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.action, id]),
      ),
  };

  actionResult = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IActResult[]>>(
        this.createUrl([this.api.actionResult]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: IBodyResultReason) =>
      this.httpClient.post<EntityResult<IActResult>>(
        this.createUrl([this.api.actionResult]),
        body,
      ),
    update: (id: string, body: IBodyResultReason) =>
      this.httpClient.patch<EntityResult<IActResult>>(
        this.createUrl([this.api.actionResult, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.actionResult, id]),
      ),
  };

  actionReason = {
    get: (params = {}, options?: {cache?: boolean}) => {
      const getData = this.httpClient
        .get<EntityResult<IActReason[]>>(
          this.createUrl([this.api.actionReason]),
          {
            params: this.createParams(
              Object.assign(params, this.defaultParams),
            ),
          },
        )
        .pipe(tap((res) => res?.status === 200 && this.setListActReason(res)));
      if (options?.cache) {
        if (!this.listActReasonSubject.getValue()) {
          return getData;
        }
        return of(this.listActReasonSubject.getValue());
      }
      return getData;
    },
    create: (body: IBodyResultReason) =>
      this.httpClient.post<EntityResult<IActReason>>(
        this.createUrl([this.api.actionReason]),
        body,
      ),
    update: (id: string, body: IBodyResultReason) =>
      this.httpClient.patch<EntityResult<IActReason>>(
        this.createUrl([this.api.actionReason, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.actionReason, id]),
      ),
  };

  chainAction = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IChainAct[]>>(
        this.createUrl([this.api.chainAction]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getOne: (id: string) =>
      this.httpClient.get<EntityResult<IChainAct>>(
        this.createUrl([this.api.chainAction, id]),
      ),
    create: (body: IBodyResultReason) =>
      this.httpClient.post<EntityResult<IChainAct>>(
        this.createUrl([this.api.chainAction]),
        body,
      ),
    update: (id: string, body: IUpdateChainActDto) =>
      this.httpClient.patch<EntityResult<IChainAct>>(
        this.createUrl([this.api.chainAction, id]),
        body,
      ),
    updateMany: (body: IBodyUpdateOrdering) =>
      this.httpClient.patch<EntityResult<IChainAct>>(
        this.createUrl([this.api.chainAction, 'update-many']),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.chainAction, id]),
      ),
    deleteChainAct: (id: string, chainActResultId: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([
          this.api.chainAction,
          id,
          'chain-act-result',
          chainActResultId,
        ]),
      ),
  };

  task = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<ITask[]>>(
        this.createUrl([this.api.task]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    retrieveOrdersByTask: (params = {}) =>
      this.httpClient.get<EntityResult<Order[]>>(
        this.createUrl([this.api.task, 'retrieve-order-by-task']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    retrieveBookingsByTask: (params = {}) =>
      this.httpClient.get<EntityResult<any[]>>(
        this.createUrl([this.api.task, 'retrieve-booking-by-task']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getOne: (id: string) =>
      this.httpClient.get<EntityResult<ITask>>(
        this.createUrl([this.api.task, id]),
      ),
    create: (body: ITaskDto) => {
      const headers: any = {};
      if (this.authService.getCurrentClientSocketId()) {
        headers['x-socket-client-id'] = this.authService.getCurrentClientSocketId();
      }
      return this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task]),
        body,
        { headers }
      );
    },
    clone: (id: string, body: CloneTaskDto) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task, id, 'clone']),
        body,
      ),
    createOrder: (id: string) =>
      this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.task, id, 'create-order']),
        {},
      ),
    update: (id: string, body: ITaskDto) => {
      const headers: any = {};
      if (this.authService.getCurrentClientSocketId()) {
        headers['x-socket-client-id'] = this.authService.getCurrentClientSocketId();
      }
      return this.httpClient.patch<EntityResult<ITask>>(
        this.createUrl([this.api.task, id]),
        body,
        { headers }
      );
    },
    updateTaskChain: (id: string, body: IAddTaskChainDto) =>
      this.httpClient.put<EntityResult<ITask>>(
        this.createUrl([this.api.task, id, 'update-chain']),
        body,
      ),
    bulkUpdate: (body: IBulkTaskDto) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task, 'bulk-update']),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<null>>(
        this.createUrl([this.api.task, id]),
      ),
    canSplit: (filter: IFilterCanSplitTask) => {
      return this.httpClient.get<
        EntityResult<{
          count: number;
          taskIds: string[];
          totalWithoutLimit: number;
        }>
      >(this.createUrl([this.api.task, `can-split`]), {
        params: this.createParams(filter),
      });
    },
    bulkAssignTeam: (body: ISubmitPayload) =>
      this.httpClient.post<
        EntityResult<{
          failedTaskIds: string[];
          failedTaskIdsLength: number;
          failedTaskReasons: any[];
          successTaskIds: string[];
          successTaskIdsLength: number;
          totalTasksLength: number;
        }>
      >(this.createUrl([this.api.task, 'bulk-assign']), body),
    drawable: (params = {}) =>
      this.httpClient.get<EntityResult<ITask[]>>(
        this.createUrl([this.api.task, 'drawable']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),

    drawTask: (id: string) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task, id, 'draw']), {},
      ),

    dropTask: (id: string) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task, id, 'drop']), {},
      ),
    
    closeTask: (id: string, body: any) =>
      this.httpClient.patch<EntityResult<any>>(
        this.createUrl([this.api.task, id, 'close']), body,
      ),

    bulkCloseTask: (ids: string[], closeTaskResult: boolean, closeTaskReason?: string | null) => {
      const body: any = {
        ids,
        closeTaskResult,
      }
      if (closeTaskReason) {
        body.closeTaskReason = closeTaskReason;
      }

      return this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.task, 'bulk-close']),
        body,
      )
    },

    deleteMulti: (taskIds: string[]) =>
      this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.task, 'delete-requests']),
        { taskIds },
      ),
  };

  taskChain = {
    closeChain: (id: string) =>
      this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.taskChain, id, 'close-chain']),
        {},
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.taskChain, id]),
        {},
      ),
    pickResult: (id: string, body: IPickResultForActionDto) =>
      this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.taskChain, id, 'pick-result']),
        body,
      ),
  };

  taskChainResult = {
    update: (id: string, body: IUpdateTaskResultDto) =>
      this.httpClient.patch<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id]),
        body,
      ),
    updateDeadline: (id: string, body: IUpdateDeadlineTaskResult) =>
      this.httpClient.patch<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'deadline']),
        body,
      ),
    sendBlock: (id: string) =>
      this.httpClient.post<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'send-block']),
        {},
      ),

    sendFeedback: (id: string, body: IFeedback) =>
      this.httpClient.post<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'send-feedback']),
        body,
      ),

    manualCreateOrder: (id: string, body: any) =>
      this.httpClient.post<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'manual-create-order']),
        body,
      ),

    createBooking: (id: string, body: any) =>
      this.httpClient.post<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'create-booking']),
        body,
      ),
  };

  chainActResult = {
    update: (id: string, body: IBodyChainResult) =>
      this.httpClient.patch<EntityResult<IChainResult>>(
        this.createUrl([this.api.chainActionResult, id]),
        body,
      ),
    updateMany: (body: IManyUpdateChainActResultDto) =>
      this.httpClient.patch<EntityResult<IChainResult>>(
        this.createUrl([this.api.chainActionResult, 'update-many']),
        body,
      ),
    upsertMany: (body: IManyUpsertChainActResultDto[]) =>
      this.httpClient.put<EntityResult<IChainResult>>(
        this.createUrl([this.api.chainActionResult, 'upsert-many']),
        body,
      ),
  };

  source = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<ISource[]>>(
        this.createUrl([this.api.source]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getOrderBySource: (params = {}) =>
      this.httpClient.get<EntityResult<Record<ESocialPlatform, ISource[]>>>(
        this.createUrl([this.api.source, 'group']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: IUpdateSourceDto) =>
      this.httpClient.post<EntityResult<ISource>>(
        this.createUrl([this.api.source]),
        body,
      ),
    update: (id: string, body: IUpdateSourceDto) =>
      this.httpClient.patch<EntityResult<ISource>>(
        this.createUrl([this.api.source, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.source, id]),
      ),
  };

  tag = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<ITag[]>>(
        this.createUrl([this.api.tag]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: ITag) =>
      this.httpClient.post<EntityResult<ITag>>(
        this.createUrl([this.api.tag]),
        body,
      ),
    update: (id: string, body: ITag) =>
      this.httpClient.patch<EntityResult<ITag>>(
        this.createUrl([this.api.tag, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.tag, id]),
      ),
  };

  history = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IHistory[]>>(
        this.createUrl([this.api.history]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
  };

  private _getData(params = {}) {
    return this.httpClient
      .get<EntityResult<IView[]>>(
        this.createUrl([this.api.settingView, 'retrieve']),
        {
          params: this.createParams(
            Object.assign(params, this.defaultParams),
          ),
        },
      )
      .pipe(tap((res) => res?.status === 200 && this.setListViewMode(res)));
  }

  public getListViewModeSubject() {
    return this.listViewModeSubject.getValue();
  }

  settingView = {
    retrieve: (
      params = {},
      options?: {
        cache?: boolean;
      },
    ) => {
      if (options?.cache) {
        if (!this.listViewModeSubject.getValue()) {
          return this._getData(params);
        }

        return of(this.listViewModeSubject.getValue());
      }

      return this._getData(params);
    },

    update: (body: IViewDto) =>
      this.httpClient.put<EntityResult<IView>>(
        this.createUrl([this.api.settingView]),
        body,
      ),

    create: (body: IViewDto) =>
      this.httpClient.post<EntityResult<IView>>(
        this.createUrl([this.api.settingView]),
        body,
      ),

    delete: (id: string) =>
      this.httpClient.delete<EntityResult<IView>>(
        this.createUrl([this.api.settingView, id]),
      ),

    updatePos: (id: string, pos: number) =>
      this.httpClient.put<EntityResult<IView>>(
        this.createUrl([this.api.settingView, id, 'pos']),
        {pos},
      ),
  };

  setting = {
    retrieve: (params = {}) =>
      this.httpClient.get<EntityResult<ISetting>>(
        this.createUrl([this.api.setting, 'retrieve']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    update: (body: ISetting) =>
      this.httpClient.put<EntityResult<ISetting>>(
        this.createUrl([this.api.setting]),
        body,
      ),
  };

  permission = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Permission[]>>(
        this.createUrl([this.api.permission]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: PermissionDto) =>
      this.httpClient.post<EntityResult<Permission>>(
        this.createUrl([this.api.permission]),
        body,
      ),
    update: (id: string, body: UpdatePermissionDto) =>
      this.httpClient.patch<EntityResult<Permission>>(
        this.createUrl([this.api.permission, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.permission, id]),
      ),
    getUserPermissions: () =>
      this.httpClient.get<EntityResult<UserPerAccess>>(
        this.createUrl([this.api.permission, 'user-access']),
      ),
  };

  userAcl = {
    get: () =>
      this.httpClient.get<EntityResult<UserAcl[]>>(
        this.createUrl([this.api.userAcl]),
      ),
    upsert: (body: UpdateUserAclDto) =>
      this.httpClient.post<EntityResult<UserAcl>>(
        this.createUrl([this.api.userAcl]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.userAcl, id]),
      ),
    bulkRemovePer: (body: BulkRemoveUserAcl) =>
      this.httpClient.post<EntityResult<any>>(
        this.createUrl([this.api.userAcl, 'bulk-remove']),
        body,
      ),
  };

  taskDistributionConfig = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<TaskDistributionConfig[]>>(
        this.createUrl([this.api.taskDistributionConfig]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: IBodyResultReason) =>
      this.httpClient.post<EntityResult<TaskDistributionConfig>>(
        this.createUrl([this.api.taskDistributionConfig]),
        body,
      ),
    update: (id: string, body: IBodyResultReason) =>
      this.httpClient.patch<EntityResult<TaskDistributionConfig>>(
        this.createUrl([this.api.taskDistributionConfig, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.taskDistributionConfig, id]),
      ),
  };

  setDashboardViewModes(viewModes: IViewModeDto[]) {
    this.dashboardViewModes$.next(viewModes);
  }

  getDashboardViewModes() {
    return this.dashboardViewModes$.getValue();
  }

  setChangedDashboardViewModes(viewModes: IViewModeDto[]) {
    this.changedDashboardViewModes$.next(viewModes);
  }

  getChangedDashboardViewModes() {
    return this.changedDashboardViewModes$.getValue();
  }

  setCurrentActiveViewMode(data: IViewModeDto, isChangeTab: boolean = false) {
    data.isChangeTab = isChangeTab;
    data.options = data.options || {};
    this.currentActiveViewMode$.next(data);
    // replace the current active view mode in the list changedDashboardViewModes
    const viewModes = this.changedDashboardViewModes$.getValue();
    const index = viewModes.findIndex((x) => x.id === data.id);
    viewModes[index] = data;
    this.changedDashboardViewModes$.next(viewModes);
  }

  getCurrentActiveViewMode() {
    return this.currentActiveViewMode$.getValue();
  }

  findUnitsByIds(ids: string[]) {
    const units = this.getUserUnits();
    console.log('units', units);
    const branchs = units.flatMap((branch) => {
      if (ids.includes(branch.data)) {
        const departments = branch.children || [];
        const teams = departments.flatMap(
          (department) => department.children || [],
        );
        return [branch, ...departments, ...teams];
      }
      return (
        branch.children?.flatMap((department) => {
          if (ids.includes(department.data)) {
            return [department, ...(department.children || [])];
          }
          return (
            department.children?.filter((team) => ids.includes(team.data)) || []
          );
        }) || []
      );
    });
    console.log('branchs', branchs);
    return branchs;
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

  setListTag(items: ITag[]) {
    this.listTagSubject.next(items);
  }

  setListViewMode(item: EntityResult<IView[]>) {
    this.listViewModeSubject.next(item);
  }

  setListSource(items: ISource[]) {
    this.listSourceSubject.next(items);
  }

  setListChainAct(items: IChainAct[]) {
    this.listChainActSubject.next(items || []);
  }

  setListActResult(items: IActResult[]) {
    this.listActResultSubject.next(items);
  }

  setListActReason(items: EntityResult<IActReason[]>) {
    this.listActReasonSubject.next(items);
  }

  setListAction(items: IAction[]) {
    this.listActionSubject.next(items);
  }

  setCurrentSetting(item: ISetting) {
    this.currentSettingObject.next(item);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
