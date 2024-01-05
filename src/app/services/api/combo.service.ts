import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, BeautyService, Combo} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ComboService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    combo: '',
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
            `bizs/${res.alias}/combos`,
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
  combo = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Combo[]>>(
        this.createUrl([this.api.combo]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
  };
}
