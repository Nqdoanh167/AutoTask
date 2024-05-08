import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {
  Biz,
  Customer,
  CustomerTag,
  EInformationContentHistoryTask,
  ENoteContentHistoryTask,
  EOrderProductContentHistoryTask,
  ESubInformationContentHistoryTask,
  ETabHistoryKey,
  EntityPagination,
  ICommonDataSource,
  IContentHistoryTask,
  IDateRange,
  IHistory,
  Order,
} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CustomerService} from '@app/services/api/customer.service';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';
import moment from 'moment';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnDestroy, OnInit {
  @Input() orders!: Order[];
  @Input() loading!: boolean;
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
    updatedAt: 0,
  };
  public ETabHistoryKey = ETabHistoryKey;
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.DATE,
      name: 'createdAt',
      placeholder: 'Ngày tạo',
      subType: 'range',
      clearable: true,
    },
    {
      type: ETypeFilter.SELECT,
      name: 'tab',
      placeholder: 'Tab',
      options: [
        {
          id: ETabHistoryKey.NOTE,
          name: 'Ghi chú',
        },
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
  ];
  constructor(
    private readonly authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz || '';
        this.configFilters[2].options = biz?.users?.map((user) => ({
          label: user.name,
          value: user.id as any,
        }));
      });
  }
  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {
    this.getHistory();
  }
  onSelectFilter(data: {value?: string | string[]; name: string}) {}
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

      this.getHistory();
    } catch (e) {
      console.log(e);
    }
  }
  getHistory() {
    // this.history.rows = [
    //   {
    //     id: '1',
    //     taskId: '1',
    //     bizId: '123456',
    //     tabKey: ETabHistoryKey.NOTE,
    //     actionBy: {
    //       id: 'user123',
    //       name: 'John Doe',
    //       email: 'john@example.com',
    //       picture:
    //         'https://fastly.picsum.photos/id/622/200/300.jpg?hmac=HR8-4uUEihkyJx4VczHLFhVvELy7KCD1jm16BABaDy8',
    //     },
    //     content: {
    //       note: [
    //         {
    //           key: ENoteContentHistoryTask.UPLOAD_FILE,
    //           value: 'Uploaded file document.pdf',
    //         },
    //       ],
    //     },
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     id: '2',
    //     taskId: '1',

    //     bizId: '789012',
    //     tabKey: ETabHistoryKey.ORDER_PRODUCT,
    //     actionBy: {
    //       id: 'user456',
    //       name: 'Jane Smith',
    //       email: 'jane@example.com',
    //       picture:
    //         'https://fastly.picsum.photos/id/622/200/300.jpg?hmac=HR8-4uUEihkyJx4VczHLFhVvELy7KCD1jm16BABaDy8',
    //     },
    //     content: {
    //       orderProduct: [
    //         {
    //           key: EOrderProductContentHistoryTask.ADD_PRODUCT,
    //           value: 'Added product XYZ123 to order #456',
    //         },
    //       ],
    //     },
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     id: '3',
    //     taskId: '1',

    //     bizId: '456789',
    //     tabKey: ETabHistoryKey.INFORMATION,
    //     actionBy: {
    //       id: 'user789',
    //       name: 'Alice Johnson',
    //       email: 'alice@example.com',
    //       picture:
    //         'https://fastly.picsum.photos/id/622/200/300.jpg?hmac=HR8-4uUEihkyJx4VczHLFhVvELy7KCD1jm16BABaDy8',
    //     },
    //     content: {
    //       information: [
    //         {
    //           key: EInformationContentHistoryTask.REMOVE_TAG,
    //           value: "Removed tag 'important' from information",
    //         },
    //       ],
    //     },
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     id: '4',
    //     taskId: '1',

    //     bizId: '234567',
    //     tabKey: ETabHistoryKey.INFORMATION,
    //     actionBy: {
    //       id: 'user234',
    //       name: 'David Brown',
    //       email: 'david@example.com',
    //       picture:
    //         'https://fastly.picsum.photos/id/622/200/300.jpg?hmac=HR8-4uUEihkyJx4VczHLFhVvELy7KCD1jm16BABaDy8',
    //     },
    //     content: {
    //       information: [
    //         {
    //           key: EInformationContentHistoryTask.CHANGE_CHAIN,
    //           value: "Added chain 'Marketing Campaign' to information",
    //           sub: [
    //             {
    //               key: ESubInformationContentHistoryTask.ACTION,
    //               value: 'Set start date to 2024-05-01',
    //             },
    //           ],
    //         },
    //         {
    //           key: EInformationContentHistoryTask.REMOVE_CHAIN,
    //           value: "Added chain 'Marketing Campaign' to information",
    //         },
    //       ],
    //     },
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     id: '5',
    //     taskId: '1',
    //     bizId: '345678',
    //     tabKey: ETabHistoryKey.NOTE,
    //     actionBy: {
    //       id: 'user345',
    //       name: 'Emily Wilson',
    //       email: 'emily@example.com',
    //       picture:
    //         'https://fastly.picsum.photos/id/622/200/300.jpg?hmac=HR8-4uUEihkyJx4VczHLFhVvELy7KCD1jm16BABaDy8',
    //     },
    //     content: {
    //       note: [
    //         {
    //           key: ENoteContentHistoryTask.CHANGE_NOTE,
    //           value: 'Changed note content',
    //         },
    //       ],
    //     },
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // ];

    this.autoTaskService.history.get(this.history.paramsQuery).subscribe({
      next: (res) => {
        this.history.rows = res.data;
        this.history.total = res.total;
      },
      error: (err) => {},
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
  getActionContent(action: string) {
    switch (action) {
      case EOrderProductContentHistoryTask.CREATE_ORDER:
        return `Tạo đơn hàng`;
      case EOrderProductContentHistoryTask.ADD_PRODUCT:
        return `Thêm sản phẩm`;
      case EOrderProductContentHistoryTask.REMOVE_PRODUCT:
        return `Xóa sản phẩm`;
      case EOrderProductContentHistoryTask.ADD_COMBO:
        return `Thêm combo`;
      case EOrderProductContentHistoryTask.REMOVE_COMBO:
        return `Xóa combo`;
      case EOrderProductContentHistoryTask.ADD_BEAUTIFUL_SERVICE:
        return `Thêm dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.REMOVE_BEAUTIFUL_SERVICE:
        return `Xóa dịch vụ đẹp`;
      case EOrderProductContentHistoryTask.ADD_COURSE_EVENT:
        return `Thêm khóa học sự kiện`;
      case EOrderProductContentHistoryTask.REMOVE_COURSE_EVENT:
        return `Xóa khóa học sự kiện`;
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
      case EInformationContentHistoryTask.REMOVE_TAG:
        return `Xóa tag`;
      case EInformationContentHistoryTask.CREATE_TASK:
        return `Tạo task`;
      case EInformationContentHistoryTask.SOURCE:
        return `Nguồn dữ liệu`;
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
      case EInformationContentHistoryTask.LOCKED_CHAIN:
        return `Khóa chuỗi hành động`;
      case ESubInformationContentHistoryTask.ACTION:
        return `Hành động`;
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
