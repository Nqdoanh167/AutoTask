import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {BeautyService, Customer, EntityResult} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {
  IAction,
  IActReason,
  IActResult,
  IBodyAction,
  IBodyResultReason,
  IChainAct,
} from '@app/types/flow';

@Injectable({
  providedIn: 'root',
})
export class BeautyServiceService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    action: 'action',
    actionResult: 'act-result',
    actionReason: 'act-reason',
    chainAction: 'chain-act',
    chainActionResult: 'chain-act-result',
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
          this.setApiAddress(environment.apiAddress, `bizs/${res.alias}/`);
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
      this.httpClient.put<EntityResult<IAction>>(
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
      this.httpClient.put<EntityResult<IActResult>>(
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
      this.httpClient.put<EntityResult<IActReason>>(
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
    update: (id: string, body: IBodyResultReason) =>
      this.httpClient.put<EntityResult<IChainAct>>(
        this.createUrl([this.api.chainAction, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.chainAction, id]),
      ),
  };

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
