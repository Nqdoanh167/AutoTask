import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EntityResult} from '@app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {
  IDistrict,
  IParamsSearchLocation,
  IProvince,
  IWard,
} from '@app/types/location';
import {BaseApiService} from '@app/services/api/base.service';
import {AuthService} from '@app/services/api/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiLocationService extends BaseApiService implements OnDestroy {
  private destroy = new Subject();

  private defaultParams = {};
  private url = {
    province: 'provinces',
    district: 'districts',
    ward: 'wards',
  };

  constructor(
    httpClient: HttpClient,
    private readonly authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/location`,
          );
        }
      },
    });
  }

  getProvince(params: IParamsSearchLocation = {}) {
    return this.httpClient.get<EntityResult<IProvince[]>>(
      this.createUrl([this.url.province]),
      {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      },
    );
  }

  getDistrict(params: IParamsSearchLocation = {}) {
    return this.httpClient.get<EntityResult<IDistrict[]>>(
      this.createUrl([this.url.district]),
      {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      },
    );
  }

  getWard(params: IParamsSearchLocation = {}) {
    return this.httpClient.get<EntityResult<IWard[]>>(
      this.createUrl([this.url.ward]),
      {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      },
    );
  }

  getAllWard(params: IParamsSearchLocation = {}) {
    return this.httpClient.get<EntityResult<IWard[]>>(this.createUrl([]), {
      params: this.createParams(Object.assign(params, this.defaultParams)),
    });
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
