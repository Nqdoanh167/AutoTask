import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult} from 'src/app/types/viewmodels';
import {Subject, takeUntil, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {IFeedback, IFeedbackConfig} from '@app/types/feedback';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    config: 'config',
  };
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
            `bizs/${res.alias}/feedback`,
          );
        }
      },
    });
  }

  config = {
    get: () =>
      this.httpClient.get<EntityResult<IFeedbackConfig>>(
        this.createUrl([this.api.config]),
      ),
  };

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
