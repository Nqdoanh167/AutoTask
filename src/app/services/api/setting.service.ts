import {Injectable, OnDestroy} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '@app/services/api/auth.service';
import {environment} from '../../../environments/environment';
import {EntityResult} from '@app/types/viewmodels';
import {BaseApiService} from '@app/services/api/base.service';
import {ISource, ISourceDto} from '@app/types/setting';

@Injectable({
  providedIn: 'root',
})
export class SettingService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    source: 'source',
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
            `bizs/${res.alias}/auto-task`,
          );
        }
      },
    });
  }

  source = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<ISource[]>>(
        this.createUrl([this.api.source]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body: ISourceDto) =>
      this.httpClient.post<EntityResult<ISource>>(
        this.createUrl([this.api.source]),
        body,
      ),
    update: (id: string, body: ISourceDto) =>
      this.httpClient.patch<EntityResult<ISource>>(
        this.createUrl([this.api.source, id]),
        body,
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<any>>(
        this.createUrl([this.api.source, id]),
      ),
  };

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
