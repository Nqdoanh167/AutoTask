import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  Biz,
  EInformationContentHistoryTask,
  ENoteContentHistoryTask,
  EOrderProductContentHistoryTask,
  ESubInformationContentHistoryTask,
  ESubOrderProductHistoryTask,
  ETabHistoryKey,
  ICommonDataSource,
  IDateRange,
  IHistory,
} from '@app/types/viewmodels';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import moment from 'moment';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {SmsOttCallService} from '@app/services/api/smsOttCall.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnDestroy, OnInit, OnChanges {
  @Input() taskId!: string;
  public currentBiz!: Biz;
  public history: ICommonDataSource<IHistory, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };

  private destroy$ = new Subject();
  public sort = {
    createdAt: 0,
  };
  public ETabHistoryKey = ETabHistoryKey;
  public CALL_PHONE_ACTION = EInformationContentHistoryTask.CALL_PHONE;
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
  ];
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SELECT,
      name: 'tabKey',
      placeholder: 'Tab',
      options: [
        // {
        //   id: ETabHistoryKey.NOTE,
        //   name: 'Ghi chú',
        // },
        {
          id: ETabHistoryKey.ORDER_PRODUCT,
          name: 'Đơn hàng & Sản phẩm',
        },
        {
          id: ETabHistoryKey.INFORMATION,
          name: 'Thông tin',
        },
      ],
      bindLabel: 'name',
      bindValue: 'id',
      clearable: true,
      searchable: true,
      multiple: false,
    },
    {
      type: ETypeFilter.SELECT,
      name: 'actionBy',
      placeholder: 'Nhân sự thực hiện',
      options: [],
      bindLabel: 'label',
      bindValue: 'value',
      clearable: true,
      searchable: true,
      multiple: true,
    },
    {
      type: ETypeFilter.DATE,
      name: 'createdAt',
      placeholder: 'Ngày tạo',
      subType: 'range',
      clearable: true,
    },
  ];
  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
    private smsOttCallService: SmsOttCallService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz || '';
        this.configFilters[1].options = biz?.users?.map((user) => ({
          label: user.name,
          value: user.id as any,
        }));
      });
  }

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnInit(): void {
    this.getHistory();
    // this.getSmSOttCall();
  }

  getSmSOttCall() {
    this.smsOttCallService.history.get().subscribe({
      next: (res: any) => {
        console.log('res snms', res);
      },
    });
  }

  onSelectFilter(data: {value?: string | string[]; name: string}) {
    const filter = this.history.paramsQuery?.filter || '{}';
    let obj = JSON.parse(filter);

    obj[data.name] = data.value;
    if (Array.isArray(data.value) && data.value.length === 0) {
      delete obj[data.name];
    }
    this.history.paramsQuery.filter = JSON.stringify(obj);
    this.getHistory();
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getHistory();
    }
  }
  handleAudioCallPhone(link: string) {}
  onPickerDateFilter(data: {value?: IDateRange | Date; name: string}) {
    try {
      const {value, name} = data;
      const filter = this.history.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      const hValue = value as IDateRange;
      if (name === name) {
        if (hValue?.fromDate && hValue?.toDate) {
          obj[name] = [
            moment(hValue.fromDate).startOf('day').toISOString(),
            moment(hValue.toDate).endOf('day').toISOString(),
          ];
        } else {
          delete obj[name];
        }

        this.history.paramsQuery.filter = JSON.stringify(obj);
      }
      if (obj[name]?.length) {
        this.getHistory();
      }
    } catch (e) {
      console.log(e);
    }
  }

  changeSort(sort: 'createdAt') {
    switch (this.sort[sort]) {
      case 0:
        this.sort[sort] = 1;
        break;
      case 1:
        this.sort[sort] = -1;
        break;
      case -1:
        this.sort[sort] = 0;
        break;
      default:
        break;
    }
    this.getHistory();
  }

  getHistory() {
    console.log('check voice history');
    this.history.loading = true;
    this.history.paramsQuery.filter = JSON.stringify({
      ...JSON.parse(this.history.paramsQuery.filter || '{}'),
      taskId: this.taskId,
    });
    if (this.sort.createdAt !== 0) {
      let sortAll = this.history.paramsQuery.sort?.split(',') || [];
      sortAll.push(this.sort.createdAt === 1 ? `createdAt` : `-createdAt`);
      this.history.paramsQuery.sort = sortAll.join(',');
    }

    console.log('this.query', this.history.paramsQuery);
    this.autoTaskService.history
      .get(this.history.paramsQuery)
      .pipe(
        finalize(() => (this.history.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          this.history.rows = res.data?.map((item) => {
            return {
              ...item,
              actionBy:
                this.currentBiz.users?.find(
                  (user) => user.id === item.actionBy.id,
                ) ||
                item.actionBy ||
                {},
            };
          });
          this.history.total = res.total;
        },
      });
  }

  getTabKey(tab: ETabHistoryKey) {
    switch (tab) {
      case ETabHistoryKey.NOTE:
        return 'Ghi chú';
      case ETabHistoryKey.ORDER_PRODUCT:
        return 'Đơn hàng & Sản phẩm';
      case ETabHistoryKey.INFORMATION:
        return 'Thông tin';
      default:
        return '';
    }
  }
  getActionContent(action?: string) {
    switch (action) {
      case EOrderProductContentHistoryTask.CREATE_ORDER:
        return `Tạo đơn hàng`;
      case EOrderProductContentHistoryTask.ADD_PRODUCTS:
        return `Thêm sản phẩm`;
      case EOrderProductContentHistoryTask.CHANGE_WAREHOUSES:
        return `Thay đổi kho`;
      case EOrderProductContentHistoryTask.REMOVE_PRODUCTS:
        return `Xóa sản phẩm`;
      case EOrderProductContentHistoryTask.CHANGE_PRODUCTS:
        return `Thay đổi sản phẩm`;
      case EOrderProductContentHistoryTask.ADD_COMBOS:
        return `Thêm combo`;
      case EOrderProductContentHistoryTask.REMOVE_COMBOS:
        return `Xóa combo`;
      case EOrderProductContentHistoryTask.CHANGE_COMBOS:
        return `Thay đổi combo`;
      case EOrderProductContentHistoryTask.ADD_BEAUTISERVICES:
        return `Thêm dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.REMOVE_BEAUTISERVICES:
        return `Xóa dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.CHANGE_BEAUTISERVICES:
        return `Thay đổi dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.ADD_COURSEEVENTS:
        return `Thêm khóa học sự kiện`;
      case EOrderProductContentHistoryTask.REMOVE_COURSEEVENTS:
        return `Xóa khóa học sự kiện`;
      case EOrderProductContentHistoryTask.CHANGE_COURSEEVENTS:
        return `Thay đổi khóa học sự kiện`;
      case ENoteContentHistoryTask.ADD_NOTE:
        return `Thêm ghi chú`;
      case ENoteContentHistoryTask.CHANGE_NOTE:
        return `Sửa ghi chú`;
      case ENoteContentHistoryTask.UPLOAD_FILE:
        return `Tải file lên`;
      case ENoteContentHistoryTask.REMOVE_FILE:
        return `Xóa file`;
      case ENoteContentHistoryTask.REMOVE_NOTE:
        return `Xóa ghi chú`;
      case EInformationContentHistoryTask.ADD_TAG:
        return `Thêm tag`;
      case EInformationContentHistoryTask.CHANGE_TAG:
        return `Thay đổi tag`;
      case EInformationContentHistoryTask.REMOVE_TAG:
        return `Xóa tag`;
      case EInformationContentHistoryTask.CREATE_TASK:
        return `Tác vụ được tạo`;
      case EInformationContentHistoryTask.CHANGE_CUSTOMER:
        return `Thay đổi khách hàng`;
      case EInformationContentHistoryTask.NAME_TASK:
        return `Thay đổi tên task`;
      case EInformationContentHistoryTask.SOURCE:
        return `Nguồn dữ liệu`;
      case EInformationContentHistoryTask.CHANGE_SOURCE:
        return `Thay đổi nguồn dữ liệu`;
      case EInformationContentHistoryTask.CHANGE_NOTE_I:
        return `Thay đổi ghi chú`;
      case EInformationContentHistoryTask.COUNSELOR:
        return `Nhân sự phụ trách`;
      case EInformationContentHistoryTask.CUSTOMER:
        return `Khách hàng`;
      case EInformationContentHistoryTask.ADD_CHAIN:
        return `Thêm chuỗi hành động`;
      case EInformationContentHistoryTask.REMOVE_CHAIN:
        return `Xóa chuỗi hành động`;
      case EInformationContentHistoryTask.CHANGE_CHAIN:
        return `Thay đổi chuỗi hành động`;
      case EInformationContentHistoryTask.INIT_PRODUCT:
        return `Khởi tạo sản phẩm`;
      case EInformationContentHistoryTask.CHANGE_ACTION:
        return `Thay đổi hành động`;
      case EInformationContentHistoryTask.SEND_BLOCK_AUTOMATION:
        return `Gửi block automation`;
      case EInformationContentHistoryTask.CALL_PHONE:
        return `Gọi điện thoại`;
      case EInformationContentHistoryTask.LOCKED_CHAIN:
        return `Khóa chuỗi hành động`;
      case EInformationContentHistoryTask.ROLE:
        return `Vai trò`;
      case EInformationContentHistoryTask.BRANCH:
        return `Gán chi nhánh`;
      case EInformationContentHistoryTask.CHANGE_BRANCH:
        return `Thay đổi chi nhánh`;
      case EInformationContentHistoryTask.CHAT_LINK:
        return `Thay đổi Link Cuộc hội thoại`;
      case ESubInformationContentHistoryTask.ACTION:
        return `Hành động`;
      case ESubInformationContentHistoryTask.NONE:
        return ``;
      case ESubOrderProductHistoryTask.NONE:
        return ``;
      case EInformationContentHistoryTask.DRAW_TASK:
        return `Rút số thành công`;
      case EInformationContentHistoryTask.DROP_TASK:
        return `Thả số thành công`;
      case EInformationContentHistoryTask.CLOSE_TASK:
        return `Đóng tác vụ`;
      default:
        return '';
    }
  }
  handleViewOrder(id: string) {
    let url = `${environment.urlDomain}/${this.currentBiz.alias}/sale-center/?code=${id}`;
    window.open(url, '_blank');
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
