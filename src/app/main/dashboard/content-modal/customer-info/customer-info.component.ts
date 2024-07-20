import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
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

type ViewOrderType = 'completed' | 'cancelled';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss'],
})
export class CustomerInfoComponent implements OnDestroy, OnInit {
  @ViewChildren(InputSuggestCustomerComponent)
  inputSuggestCustomers!: QueryList<InputSuggestCustomerComponent>;
  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;
  @Input() hasUpdateTaskPer: boolean = false;
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
  public tags: EntityPagination<CustomerTag> = {
    rows: [],
    loading: false,
  };
  public loading = {
    customer: false,
    updateCustomer: false,
  };
  public viewOrderType?: ViewOrderType;
  public viewOrCustomerOrders: IOrderCustomer[] = [];
  public selectedCustomer: Customer | null = null;
  public selectTag: boolean = false;

  protected hasPermitCustomer = false;

  constructor(
    private readonly apiLocationService: ApiLocationService,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toarst: ToastrService,
    private readonly modalService: BsModalService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz.alias || '';
        this.hasPermitCustomer = !!biz?.user?.moduleAliases?.find(
          (el) => el === 'customers',
        );
      });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
    if (!this.hasUpdateTaskPer) {
      this.formGroup.disable();
    }
    this.getTag();
    this.getProvince();
    this.formGroup.valueChanges
      .pipe(distinctUntilKeyChanged('id'))
      .subscribe((value) => {
        if (value?.id) {
          this.getCustomerDetail(value.id);
          if (value?.provinceCode) {
            this.getDistrict(value?.provinceCode);
          }
          if (value?.districtCode) {
            this.getWard(value?.provinceCode, value?.districtCode);
          }
        } else {
          this.selectedCustomer = null;
        }
      });
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
            this.selectedCustomer = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleViewCustomer(customerId: string) {
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
      .getProvince({
        location: 'VN',
      })
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

  getTag() {
    if (!this.hasPermitCustomer) return;
    this.customerService.tag.get().subscribe({
      next: (res) => {
        if (res && res.status === 200) {
          this.tags.rows = res.data;
        } else {
          this.commonService.handleResErr(res);
        }
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

  handleChooseCustomer(customer?: Customer) {
    if (!customer) return;
    this.trigger.name = false;

    this.formGroup.patchValue({
      id: customer.id,
      name: customer.name,
      picture: customer.picture,
      phone: customer.phone,
      email: customer.email,
      province: customer.province,
      provinceCode: customer.provinceCode,
      district: customer.district,
      districtCode: customer.districtCode,
      ward: customer.ward,
      wardCode: customer.wardCode,
      tags: customer.tags,
      address: customer.address,
      gender: customer.gender,
      street: customer.street,
    });
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
