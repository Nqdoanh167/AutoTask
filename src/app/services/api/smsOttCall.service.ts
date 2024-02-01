import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, CourseEvent} from 'src/app/types/viewmodels';
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

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.destroy.next(true);
    this.destroy.complete();
  }
  platform = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Platform[]>>(
        this.createUrl([this.api.platform]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
  };
}
