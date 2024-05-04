import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {Customer, CustomerTag, EntityPagination} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';
import {InputSuggestCustomerComponent} from '@share/common/input-select-customer/input-suggest-customer.component';
import {CustomerService} from '@app/services/api/customer.service';
import {environment} from 'src/environments/environment';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss'],
})
export class CustomerInfoComponent implements OnDestroy, OnInit {
  @ViewChildren(InputSuggestCustomerComponent)
  inputSuggestCustomers!: QueryList<InputSuggestCustomerComponent>;
  private currentBiz = '';
  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;

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
  public selectedCustomer: Customer | null = null;
  public selectTag: boolean = false;
  constructor(
    private readonly apiLocationService: ApiLocationService,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
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

  ngOnInit(): void {
    this.getTag();
    this.getProvince();
    this.formGroup.valueChanges.subscribe((value) => {
      if (value?.id) {
        this.selectedCustomer = {...value};
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
  handleViewCustomer(customerId: string) {
    let url = `${environment.urlDomain}/${this.currentBiz}/customers/${customerId}`;
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
      default:
        return;
    }
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
  handleClearSelectedCustomer() {
    this.handleClearSelectValue();
    this.selectedCustomer = null;
    this.formGroup.patchValue({
      id: null,
      name: null,
      phone: null,
      email: null,
      province: null,
      provinceCode: null,
      tags: null,
      district: null,
      districtCode: null,
      ward: null,
      wardCode: null,
      address: null,
      gender: null,
      street: null,
    });
  }

  onChangeInputSuggestCustomer(value: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
