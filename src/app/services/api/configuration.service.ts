import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService extends BaseApiService implements OnDestroy {
  private destroy = new Subject();
  private defaultParams: any = {};

  public api = {
    service: 'services',
  };

  public actionTypes = [
    {
      value: 'call',
      label: 'Gọi điện',
    },
    {
      value: 'sendSMS',
      label: 'Nhắn tin',
    },
    {
      value: 'createRecord',
      label: 'Tạo bản ghi Khách hàng',
    },
    {
      value: 'callBlock',
      label: 'Gọi Block Automation',
    },
    {
      value: 'othor',
      label: 'Khác',
    },
    {
      value: 'closeChain',
      label: 'Đóng chuỗi',
    },
    {
      value: 'move',
      label: 'Chuyển sang Hành động khác',
    },
    {
      value: 'addChainAction',
      label: 'Thêm Chuỗi hành động khác',
    },
  ];
  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(environment.apiAddress, `bizs/${res.alias}/`);
        }
      },
    });
  }

  service = {};

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.destroy.next(true);
    this.destroy.complete();
  }
}
