import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {Category, EntityResult, Group, Product} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

declare const FB: any;

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    product: '',
    category: 'categories',
    group: 'groups',
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
            `bizs/${res.alias}/products`,
          );
          this.defaultParams = {
            bizId: res.id,
          };
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
  product = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Product[]>>(
        this.createUrl([this.api.product]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Product>>(
        this.createUrl([this.api.product]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Product>>(
        this.createUrl([this.api.product, id]),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Product>>(
        this.createUrl([this.api.product, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Product>>(
        this.createUrl([this.api.product, id]),
      ),
  };
  category = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Category[]>>(
        this.createUrl([this.api.category]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Category>>(
        this.createUrl([this.api.category]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Category>>(
        this.createUrl([this.api.category, id]),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Category>>(
        this.createUrl([this.api.category, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Category>>(
        this.createUrl([this.api.category, id]),
      ),
  };
  group = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Group[]>>(
        this.createUrl([this.api.group]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Group>>(
        this.createUrl([this.api.group]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Group>>(
        this.createUrl([this.api.group, id]),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Group>>(
        this.createUrl([this.api.group, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Group>>(
        this.createUrl([this.api.group, id]),
      ),
  };
}
