import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {
  HistoryUpdateDto,
  ManageMappingPhone,
  Platform,
} from '@app/types/sms-ott-call';
import {OmiExtension} from '@app/types/omicall';

@Injectable({
  providedIn: 'root',
})
export class SmsOttCallService extends BaseApiService implements OnDestroy {
  destroy = new Subject();
  api = {
    platform: 'platforms',
    manage: 'manage',
    history: 'histories',
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
          console.log('res alias', res);
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/sms-ott-call`,
          );
        }
      },
    });
  }

  platform = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Platform[]>>(
        this.createUrl([this.api.platform]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getPhones: (id: string, platform: string) =>
      this.httpClient.get<EntityResult<any[]>>(
        this.createUrl([this.api.platform, id, platform, 'phones']),
        {
          params: {},
        },
      ),
    getOmicallExtension: (id: string, platform: string) =>
      this.httpClient.get<EntityResult<OmiExtension[]>>(
        this.createUrl([this.api.platform, id, platform, 'extensions']),
        {
          params: {},
        },
      ),
    getTokenClient: (id: string, platform: string, taskCode: string) =>
      this.httpClient.get<EntityResult<{token: string}>>(
        this.createUrl([this.api.platform, id, platform, 'token-client']),
        {
          params: this.createParams({
            moduleAlias: 'auto-task',
            taskCode: taskCode,
          }),
        },
      ),
    getTokenReceiveCall: (platformId: string) =>
      this.httpClient.get<EntityResult<{token: string}>>(
        this.createUrl([
          this.api.platform,
          platformId,
          'stringee',
          'token-client-receive-call-event',
        ]),
      ),
  };

  manageConnect = {
    getPhones: () =>
      this.httpClient.get<EntityResult<ManageMappingPhone[]>>(
        this.createUrl([this.api.manage, 'get-by-user']),
      ),
  };

  history = {
    get: (params = {filter: {taskId: '66ce9a271e6e8d6c1c95b3e3'}}) =>
      this.httpClient.get<EntityResult<Platform[]>>(
        this.createUrl([this.api.history]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),

    updateStatusCall: (uniqueCode: string, body: HistoryUpdateDto) =>
      this.httpClient.put<EntityResult<any>>(
        this.createUrl([this.api.history, uniqueCode]),
        body,
      ),
  };

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
