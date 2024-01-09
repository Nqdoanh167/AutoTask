import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {EActionType} from '@app/types/flow';

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
      value: EActionType.CALL,
      label: 'Gọi điện',
    },
    {
      value: EActionType.SMS,
      label: 'Nhắn tin',
    },
    {
      value: EActionType.CREATE_CUSTOMER,
      label: 'Tạo bản ghi Khách hàng',
    },
    {
      value: EActionType.BLOCK_AUTOMATION,
      label: 'Gọi Block Automation',
    },
    {
      value: EActionType.OTHER,
      label: 'Khác',
    },
    {
      value: EActionType.CREATE_ORDER,
      label: 'Tạo đơn hàng',
    },
    {
      value: EActionType.CLOSE_CHAIN,
      label: 'Đóng chuỗi',
    },
    {
      value: EActionType.CHANGE_ACTION,
      label: 'Chuyển sang Hành động khác',
    },
    {
      value: EActionType.ADD_CHAIN,
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
