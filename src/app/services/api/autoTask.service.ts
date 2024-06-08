import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, IHistory, ITag, Order} from 'src/app/types/viewmodels';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
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
  IUpdateTaskResultDto,
} from '@app/types/flow';
import {
  BulkRemoveUserAcl,
  ISetting,
  ISource,
  ISourceDto,
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
    get: (params = {}) =>
      this.httpClient.get<EntityResult<IActReason[]>>(
        this.createUrl([this.api.actionReason]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
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
    getOne: (id: string) =>
      this.httpClient.get<EntityResult<ITask>>(
        this.createUrl([this.api.task, id]),
      ),
    create: (body: ITaskDto) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task]),
        body,
      ),
    clone: (id: string, body: CloneTaskDto) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task, id, 'clone']),
        body,
      ),
    createOrder: (id: string) =>
      this.httpClient.post<EntityResult<any[]>>(
        this.createUrl([this.api.task, id, 'create-order']),
        {},
      ),
    update: (id: string, body: ITaskDto) =>
      this.httpClient.patch<EntityResult<ITask>>(
        this.createUrl([this.api.task, id]),
        body,
      ),
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
    sendBlock: (id: string) =>
      this.httpClient.post<EntityResult<ITaskChainResult>>(
        this.createUrl([this.api.taskChainResult, id, 'send-block']),
        {},
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
    upsertMany: (body: IManyUpsertChainActResultDto) =>
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

  settingView = {
    retrieve: (params = {}) =>
      this.httpClient.get<EntityResult<IView>>(
        this.createUrl([this.api.settingView, 'retrieve']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    update: (body: IViewDto) =>
      this.httpClient.put<EntityResult<IView>>(
        this.createUrl([this.api.settingView]),
        body,
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
    update: (body: IViewDto) =>
      this.httpClient.put<EntityResult<IView>>(
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

  setCurrentActiveViewMode(data: IViewModeDto) {
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

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
