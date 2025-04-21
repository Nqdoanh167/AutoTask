import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, CourseEvent, Warehouse} from 'src/app/types/viewmodels';
import {BehaviorSubject, of, Subject, takeUntil, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  private listWarehouseSubject = new BehaviorSubject<EntityResult<Warehouse[]>>(
    null as unknown as EntityResult<Warehouse[]>,
  );

  api = {
    warehouse: '',
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
            `bizs/${res.alias}/warehouses`,
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
  warehouse = {
    get: (
      params = {},
      options?: {
        cache?: boolean;
      },
    ) => {
      const getData = this.httpClient
        .get<EntityResult<Warehouse[]>>(this.createUrl([this.api.warehouse]), {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        })
        .pipe(tap((res) => res?.status === 200 && this.setListWarehouse(res)));

      if (options?.cache) {
        if (!this.listWarehouseSubject.getValue()) {
          return getData;
        }
        return of(this.listWarehouseSubject.getValue());
      }
      return getData;
    },
  };

  setListWarehouse(items: EntityResult<Warehouse[]>) {
    this.listWarehouseSubject.next(items);
  }
}
