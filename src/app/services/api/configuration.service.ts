import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {EActionType, ENextStepType, EResultType} from '@app/types/flow';

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
      value: EActionType.SEND_BLOCK_AUTOMATION,
      label: 'Gửi Block Automation',
    },
    {
      value: EActionType.OTHER,
      label: 'Khác',
    },
  ];

  public resultTypes = [
    {
      value: EResultType.SUCCESS,
      label: 'Thành công',
    },
    {
      value: EResultType.FAILED,
      label: 'Thất bại',
    },
    {
      value: EResultType.COMPLETED,
      label: 'Hoàn thành',
    },
    {
      value: EResultType.UNCOMPLETED,
      label: 'Chưa hoàn thành',
    },
    {
      value: EResultType.SKIP,
      label: 'Bỏ qua',
    },
  ];

  public nextStepTypes = [
    {
      value: ENextStepType.CONTINUE_TO_NEXT_ACTION,
      label: 'Hành động tiếp theo trong chuỗi',
    },

    {
      value: ENextStepType.CREATE_ORDER,
      label: 'Tạo đơn hàng',
    },
    {
      value: ENextStepType.CALL_BLOCK_AUTOMATION,
      label: 'Gọi Block Automation',
    },
    {
      value: ENextStepType.CLOSE_CHAIN,
      label: 'Đóng chuỗi HĐ',
    },
    {
      value: ENextStepType.CLOSE_CHAIN_AND_CLONE_TASK,
      label: 'Đóng chuỗi HĐ và tạo bản sao công việc',
    },
    {
      value: ENextStepType.ADD_CHAIN,
      label: 'Thêm HĐ từ chuỗi khác',
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
