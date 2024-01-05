import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {
  EntityResult,
  BeautyService,
  BeautyOrderService,
} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BeautyServiceService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    service: 'services',
    orderService: 'order-services',
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
            `bizs/${res.alias}/beauty-service`,
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
  service = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<BeautyService[]>>(
        this.createUrl([this.api.service]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<BeautyService>>(
        this.createUrl([this.api.service, id]),
        {
          params: {},
        },
      ),
  };
  orderService = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<BeautyOrderService[]>>(
        this.createUrl([this.api.orderService]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
  };
}
