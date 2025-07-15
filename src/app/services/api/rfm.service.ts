import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {
  EntityResult,
} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RfmService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  api = {
    customerRfm: 'customer-rfm',
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
          this.setApiAddress(environment.apiAddress, `bizs/${res.alias}/rfm`);
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
  customerRfm = {
    getBehavior: (id: string) =>
      this.httpClient.get<EntityResult<any>>(
        this.createUrl([this.api.customerRfm, id]),
      ),
  };
}
