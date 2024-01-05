import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base.service';
import { EntityResult, LoyaltyRank } from 'src/app/types/viewmodels';
import { Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
declare const FB: any;

@Injectable({
  providedIn: 'root',
})
export class LoyaltyService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    ranks: 'ranks',
  };
  private defaultParams: any = {};
  constructor(httpClient: HttpClient, private authService: AuthService) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/loyalty`
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
  ranks = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<LoyaltyRank[]>>(
        this.createUrl([this.api.ranks]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        }
      ),
  };
}
