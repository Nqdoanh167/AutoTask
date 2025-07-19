import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {distinctUntilKeyChanged, finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {EntityPagination, ITag} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CustomerService} from '@app/services/api/customer.service';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';
import {Customer, CustomerTag, IOrderCustomer} from '@app/types/customer';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ToastrService} from 'ngx-toastr';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ModalUpdateCustomerComponent} from '@main/dashboard/content-modal/modal-update-customer/modal-update-customer.component';
import {RfmService} from '@app/services/api/rfm.service';

type ViewOrderType = 'completed' | 'cancelled' | 'trash';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss'],
})
export class CustomerInfoComponent implements OnDestroy, OnInit, OnChanges {
  @ViewChildren(InputSuggestCustomerComponent)
  inputSuggestCustomers!: QueryList<InputSuggestCustomerComponent>;
  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;
  @Input() hasUpdateTaskPer: boolean = false;
  @Input() selectedCustomerId: string = '';

  @Input() isOpenBackdrop: boolean = false;
  @Output() isOpenBackdropChange = new EventEmitter<boolean>();

  private currentBiz = '';
  private destroy$ = new Subject();

  public listProvince: IProvince[] = [];
  public listDistrict: IDistrict[] = [];
  public listWard: IWard[] = [];
  public trigger = {
    name: false,
  };

  public loading = {
    customer: false,
    updateCustomer: false,
    getInfoRfm: false,
  };
  //Hành vi mua hàng
  public viewBehavior: boolean = true;
  public viewOrderType?: ViewOrderType;
  public viewOrCustomerOrders: IOrderCustomer[] = [];
  public selectedCustomer: Customer | null = null;
  public selectTag: boolean = false;
  public rfmInFo: {
    point?: number;
    groupName?: string;
    isGet: boolean;
  } = {
    point: 0,
    groupName: '',
    isGet: false,
  };

  protected hasPermitCustomer =
    this.authService.checkPermittedModule('customers');

  protected hasPermitRfm = this.authService.checkPermittedModule('rfm');

  constructor(
    private readonly apiLocationService: ApiLocationService,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toarst: ToastrService,
    private readonly modalService: BsModalService,
    private readonly rfmService: RfmService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz.alias || '';
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.formGroup.controls;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.['selectedCustomerId'] &&
      changes?.['selectedCustomerId']?.currentValue
    ) {
      this.getCustomerDetail(this.selectedCustomerId);
      this.viewBehavior = true;
      this.rfmInFo = {
        point: 0,
        groupName: '',
        isGet: false,
      };
      this.viewOrderType = undefined;
    }
  }

  ngOnInit(): void {
    if (!this.hasUpdateTaskPer) {
      this.formGroup.disable();
    }
    this.getProvince();
    // this.formGroup.valueChanges
    //   .pipe(distinctUntilKeyChanged('id'))
    //   .subscribe((value) => {
    //     if (value?.id) {
    //       this.getCustomerDetail(value.id);
    //       if (value?.provinceCode) {
    //         this.getDistrict(value?.provinceCode);
    //       }
    //       if (value?.districtCode) {
    //         this.getWard(value?.provinceCode, value?.districtCode);
    //       }
    //     } else {
    //       this.selectedCustomer = null;
    //     }
    //   });
  }

  getCustomerDetail(id: string) {
    if (!this.hasPermitCustomer) return;
    this.loading.customer = true;
    this.customerService.customer
      .getById(id)
      .pipe(
        finalize(() => (this.loading.customer = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            // this.selectedCustomer = res.data;
            this.handleChooseCustomer(res.data, true);
            if (res.data?.provinceCode) {
              this.getDistrict(res.data?.provinceCode);
            }
            if (res.data?.districtCode) {
              this.getWard(res.data?.provinceCode, res.data?.districtCode);
            }

            this.handleViewOrderType('completed');
          } else {
            // this.commonService.handleResErr(res);
            this.toarst.warning('Không tìm thấy khách hàng!');
          }
        },
      });
  }

  getBehaviorInfoCustomer() {
    if (this.rfmInFo.isGet) return;
    if (this.selectedCustomerId && this.hasPermitRfm) {
      this.loading.getInfoRfm = true;
      this.rfmService.customerRfm
        .getBehavior(this.selectedCustomerId)
        .pipe(
          finalize(() => {
            this.rfmInFo.isGet = true;
            this.loading.getInfoRfm = false;
          }),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            if (res && res.status === 200) {
              this.rfmInFo.point = res.data?.point || 0;
              this.rfmInFo.groupName = res.data?.groupName || '';
            } else {
            }
          },
        });
    }
  }

  getAverageOrder(){
    // Tính giá trị đơn trung bình theo trạng thái completed
    const orders = this.selectedCustomer?.orders.filter(
      (order) => order.status === 'completed'
    );

    if (!orders || orders.length === 0) return 0;

    const amount = orders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    return amount / orders.length;
  }

  handleViewCustomer(customerId?: string) {
    if (!customerId) return;
    let url = `${environment.urlDomain}/${this.currentBiz}/customers/${customerId}`;
    window.open(url, '_blank');
  }

  handleViewOrder(orderId?: string) {
    if (!orderId) return;
    let url = `${environment.urlDomain}/${this.currentBiz}/sale-center/?code=${orderId}`;
    window.open(url, '_blank');
  }

  compareFunction(item: CustomerTag, selected: any) {
    return item.id === selected.id;
  }

  getProvince() {
    this.apiLocationService
      .getProvince(
        {
          location: 'VN',
        },
        {cache: true},
      )
      .subscribe({
        next: (res) => {
          this.listProvince = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getDistrict(provinceCode: string) {
    this.apiLocationService
      .getDistrict({
        provinceCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listDistrict = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getWard(provinceCode: string, districtCode: string) {
    this.apiLocationService
      .getWard({
        provinceCode,
        districtCode,
        location: 'VN',
      })
      .subscribe({
        next: (res) => {
          this.listWard = res.data;
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleChangeLocation(value: string, type: 'province' | 'district' | 'ward') {
    switch (type) {
      case 'province':
        this.formGroup.patchValue({
          district: null,
          districtCode: null,
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formGroup.patchValue({
            province: null,
            provinceCode: null,
          });
          return;
        }
        this.formGroup.patchValue({
          province: this.listProvince.find((el) => el.provinceCode === value)
            ?.province,
        });
        this.getDistrict(value);
        break;
      case 'district':
        this.formGroup.patchValue({
          ward: null,
          wardCode: null,
        });
        if (!value) {
          this.formGroup.patchValue({
            district: null,
            districtCode: null,
            ward: null,
            wardCode: null,
          });
          return;
        }
        this.formGroup.patchValue({
          district: this.listDistrict.find((el) => el.districtCode === value)
            ?.district,
        });
        this.getWard(this.formGroup.value.provinceCode, value);
        break;
      case 'ward':
        if (!value) return;
        this.formGroup.patchValue({
          ward: this.listWard.find((el) => el.wardCode === value)?.ward,
        });
        break;
    }
    this.handleCombineAddress();
  }

  handleCombineAddress() {
    const {street, district, ward, province} = this.formGroup.value;
    const addressParts = [street, ward, district, province];
    const address = addressParts.filter((part) => part).join(', ');
    this.formGroup.patchValue({
      address,
    });
  }

  handleChooseCustomer(customer?: Customer, isInit: boolean = false) {
    if (!customer) return;
    this.trigger.name = false;

    const patchData: any = {};
    const formValues = this.formGroup.value;

    const fields: (keyof Customer)[] = [
      'id',
      'name',
      'picture',
      'phone',
      'email',
      'province',
      'provinceCode',
      'district',
      'districtCode',
      'ward',
      'wardCode',
      'tags',
      'address',
      'gender',
      'street',
    ];

    for (const key of fields) {
      patchData[key] = formValues[key];
      const customerValue = customer[key];

      if ((isInit && !patchData[key]) || !isInit) {
        patchData[key] = customerValue;
      }

      if (key === 'provinceCode') {
        // this.getDistrict(patchData[key]);
      }

      if (key === 'districtCode' && patchData[key]) {
        // this.getWard(patchData['provinceCode'], patchData[key]);
      }
    }

    this.formGroup.patchValue(patchData);
    this.selectedCustomer = customer;
  }

  handleClearSelectValue() {
    this.inputSuggestCustomers?.forEach((el) => {
      el.selectedCustomer = undefined;
    });
  }

  updateCustomer() {
    if (!this.hasPermitCustomer) return;
    if (!this.formGroup?.value?.id) {
      this.toarst.warning('Không tìm thấy khách hàng được tham chiếu');
    }
    this.loading.updateCustomer = true;
    const body = {
      ...this.formGroup.value,
      tagIds: this.formGroup?.value?.tags?.map((tag: ITag) => tag.id) || null,
    };
    this.customerService.customer
      .update(this.formGroup.value.id, body)
      .pipe(
        finalize(() => (this.loading.updateCustomer = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.selectedCustomer = res.data;
          this.commonService.handleResSuccess('update');
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  handleSyncCustomer() {
    const title = 'Cập nhật cho bản ghi Khách hàng';
    const description = `Bạn sắp cập nhật ngược thông tin của Khách hàng từ Tác vụ này qua module <b>Khách Hàng</b>, hành động này không thể hoàn tác. 
Tất cả thông tin bạn đã điền trong này, như Tên, thẻ Tag, SĐT, Loại khách hàng và Địa chỉ sẽ được cập nhật vào bản ghi tương ứng trong module <b>Khách Hàng</b>.`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'info',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.updateCustomer();
    });
  }

  handleUpdateCustomer() {
    this.isOpenBackdropChange.emit(true);
    const modalUpdateCustomer = this.modalService.show(
      ModalUpdateCustomerComponent,
      {
        class: 'modal-dialog-centered',
        initialState: {
          dataDetail: this.selectedCustomer!,
        },
      },
    );
    modalUpdateCustomer.content?.updateSuccessEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.selectedCustomer = res;
        modalUpdateCustomer.hide();
      });
    modalUpdateCustomer.onHide?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOpenBackdropChange.emit(false);
    });
  }

  handleClearSelectedCustomer() {
    const title = 'Bỏ chọn khách hàng';
    const description = `Bạn có chắc muốn bỏ tham chiếu khách hàng <b>${
      this.selectedCustomer?.name || ''
    }</b> với module <b>Khách Hàng</b> không?`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.selectedCustomer = null;
      this.formGroup.patchValue({
        id: null,
      });
    });
  }

  onChangeInputSuggestCustomer(value: any) {}

  handleViewOrderType(type: ViewOrderType) {
    if (!this.viewOrderType || this.viewOrderType !== type) {
      this.viewOrderType = type;
      this.viewOrCustomerOrders =
        this.selectedCustomer?.orders?.filter((order) => {
          return order.status === type;
        }) || [];
    } else {
      this.viewOrderType = undefined;
      this.viewOrCustomerOrders = [];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
