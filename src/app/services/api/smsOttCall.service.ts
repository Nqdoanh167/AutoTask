import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {Platform} from '@app/types/sms-ott-call';

@Injectable({
  providedIn: 'root',
})
export class SmsOttCallService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    platform: 'platforms',
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
    getTokenClient: (id: string, platform: string) =>
      this.httpClient.get<EntityResult<{token: string}>>(
        this.createUrl([this.api.platform, id, platform, 'token-client']),
        {
          params: {},
        },
      ),
  };

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
