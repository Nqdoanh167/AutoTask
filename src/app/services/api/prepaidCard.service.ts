import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, PrepaidCard} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PrepaidCardService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    card: 'cards',
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
            `bizs/${res.alias}/prepaid-card`,
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
  card = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<PrepaidCard[]>>(
        this.createUrl([this.api.card]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<PrepaidCard>>(
        this.createUrl([this.api.card, id]),
        {
          params: {},
        },
      ),
    showCode: (code: string) =>
      this.httpClient.get<EntityResult<PrepaidCard>>(
        this.createUrl([this.api.card, 'code', code]),
        {
          params: {},
        },
      ),
  };
}
