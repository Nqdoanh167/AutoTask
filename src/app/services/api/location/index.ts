import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EntityResult} from '@app/types/viewmodels';
import {
  BehaviorSubject,
  distinctUntilChanged,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
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
  private listProvinceSubject = new BehaviorSubject<EntityResult<IProvince[]>>(
    null as unknown as EntityResult<IProvince[]>,
  );

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

  getProvince(params: IParamsSearchLocation = {}, options?: {cache?: boolean}) {
    const getData = this.httpClient
      .get<EntityResult<IProvince[]>>(this.createUrl([this.url.province]), {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      })
      .pipe(tap((res) => res?.status === 200 && this.setListProvince(res)));

    if (options?.cache) {
      if (!this.listProvinceSubject.getValue()) {
        return getData;
      }
      return of(this.listProvinceSubject.getValue());
    }
    return getData;
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

  setListProvince(items: EntityResult<IProvince[]>) {
    this.listProvinceSubject.next(items);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
