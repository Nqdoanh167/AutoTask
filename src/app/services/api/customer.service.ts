import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base.service';
import { EntityResult, Customer, Segment } from 'src/app/types/viewmodels';
import { BehaviorSubject, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
declare const FB: any;

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    customer: '',
    segment: 'segments'
  }
  private defaultParams: any = {};
  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: res => {
        if (res) {
          this.setApiAddress(environment.apiAddress, `bizs/${res.alias}/customers`)
          this.defaultParams = {
            bizId: res.id,
          }
        }
      }
    })
  }

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.destroy.next(true);
    this.destroy.complete();
  }
  customer = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Customer[]>>(this.createUrl([this.api.customer]), {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      }),
    getSegment: (params = {}) =>
      this.httpClient.get<EntityResult<Segment[]>>(this.createUrl([this.api.segment]), {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      }),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Customer>>(this.createUrl([this.api.customer]), body),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Customer>>(this.createUrl([this.api.customer, id]), body),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Customer>>(this.createUrl([this.api.customer, id])),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Customer>>(this.createUrl([this.api.customer, id])),
  };
  
}
