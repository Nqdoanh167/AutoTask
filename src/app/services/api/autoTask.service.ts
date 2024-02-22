import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {
  IAction,
  IActReason,
  IActResult,
  IAddTaskChainDto,
  IBodyAction,
  IBodyChainResult,
  IBodyResultReason,
  IBodyUpdateOrdering,
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
import {ISource, ISourceDto, IUpdateSourceDto} from '@app/types/setting';

@Injectable({
  providedIn: 'root',
})
export class AutoTaskService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    action: 'action',
    actionResult: 'act-result',
    actionReason: 'act-reason',
    chainAction: 'chain-act',
    chainActionResult: 'chain-act-result',
    task: 'task',
    taskChain: 'task-chain',
    taskChainResult: 'task-chain-result',
    source: 'source',
  };
  private defaultParams: any = {};
  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
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
    getOne: (id: string) =>
      this.httpClient.get<EntityResult<ITask>>(
        this.createUrl([this.api.task, id]),
      ),
    create: (body: ITaskDto) =>
      this.httpClient.post<EntityResult<ITask>>(
        this.createUrl([this.api.task]),
        body,
      ),
    createOrder: (id: string) =>
      this.httpClient.post<EntityResult<ITask>>(
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

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
