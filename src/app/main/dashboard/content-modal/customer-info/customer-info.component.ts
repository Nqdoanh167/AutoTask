import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ApiLocationService} from '@app/services/api/location';
import {IDistrict, IProvince, IWard} from '@app/types/location';
import {Customer} from '@app/types/viewmodels';
import {CommonService} from '@app/services/common/common.service';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss'],
})
export class CustomerInfoComponent implements OnDestroy, OnInit {
  @Input() formGroup!: FormGroup;
  @Input() submitted: boolean = false;

  private destroy$ = new Subject();

  public listProvince: IProvince[] = [];
  public listDistrict: IDistrict[] = [];
  public listWard: IWard[] = [];
  public trigger = {
    name: false,
  };

  public selectedCustomer: Customer | null = null;

  constructor(
    private readonly apiLocationService: ApiLocationService,
    private readonly commonService: CommonService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
    this.getProvince();
    if (this.f['provinceCode'].value) {
      this.getDistrict(this.f['provinceCode'].value);
    }
    if (this.f['districtCode'].value) {
      this.getWard(this.f['provinceCode'].value, this.f['districtCode'].value);
    }
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
    this.selectedCustomer = customer;
    this.formGroup.patchValue({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      province: customer.province,
      provinceCode: customer.provinceCode,
      district: customer.district,
      districtCode: customer.districtCode,
      ward: customer.ward,
      wardCode: customer.wardCode,
      address: customer.address,
    });
  }
  handleClearSelectedCustomer() {
    this.selectedCustomer = null;
    this.formGroup.patchValue({
      id: null,
      name: null,
      phone: null,
      email: null,
      province: null,
      provinceCode: null,
      district: null,
      districtCode: null,
      ward: null,
      wardCode: null,
      address: null,
    });
  }

  onChangeInputSuggestCustomer(value: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
