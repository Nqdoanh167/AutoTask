import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {Location, EntityResult} from 'src/app/types/viewmodels';
import {BehaviorSubject, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService extends BaseApiService implements OnDestroy {
  private listProvinceSubject = new BehaviorSubject<Location[]>(
    null as unknown as Location[]
  );
  public listProvince = this.listProvinceSubject
    .asObservable()
    .pipe(distinctUntilChanged());
  private listDistrictSubject = new BehaviorSubject<Location[]>(
    null as unknown as Location[]
  );
  public listDistrict = this.listDistrictSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  destroy = new Subject();

  api = {
    location: '',
  };
  private defaultParams: any = {};
  constructor(httpClient: HttpClient, private authService: AuthService) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/location`
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
  location = {
    getProvince: (params = {}) =>
      this.httpClient.get<EntityResult<Location[]>>(
        this.createUrl([this.api.location, 'provinces']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        }
      ),
    getDistrict: (params = {}) =>
      this.httpClient.get<EntityResult<Location[]>>(
        this.createUrl([this.api.location, 'districts']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        }
      ),
    getWard: (params = {}) =>
      this.httpClient.get<EntityResult<Location[]>>(
        this.createUrl([this.api.location, 'wards']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        }
      ),
    getPostCode: (params = {}) =>
      this.httpClient.get<EntityResult<Location[]>>(
        this.createUrl([this.api.location, 'postcode']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        }
      ),
    getDetectAddress: (params = {}) =>
      this.httpClient.get<
        EntityResult<{isSuccess: boolean; type: string; area: Location}>
      >(this.createUrl([this.api.location, 'detect-address']), {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      }),
  };

  setListDistrict(items: Location[]) {
    this.listDistrictSubject.next(items);
  }
  setListProvince(items: Location[]) {
    this.listProvinceSubject.next(items);
  }
}
