import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Customer} from '@app/types/customer';
import {Subject} from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {CommonService} from '@app/services/common/common.service';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {SelectLocationComponent} from '@share/common/select-location/select-location.component';
import {ISelectedLocation} from '@app/types/location';
import {CustomerService} from '@app/services/api/customer.service';

@Component({
  selector: 'app-modal-update-customer',
  standalone: true,
  imports: [
    CustomModalComponent,
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    SelectLocationComponent,
  ],
  templateUrl: './modal-update-customer.component.html',
  styleUrl: './modal-update-customer.component.scss',
})
export class ModalUpdateCustomerComponent implements OnInit, OnDestroy {
  @Input({required: true}) dataDetail!: Customer;
  @Output() updateSuccessEvent = new EventEmitter<Customer>();

  private destroy$ = new Subject();

  public submitted = false;
  public updateForm = this.fb.group({
    id: [null],
    name: [null, [Validators.required, Validators.maxLength(255)]],
    gender: 'other',
    phone: null,
    email: null,
    address: null,
    street: null,
    tags: null,
    ward: null,
    wardCode: null,
    district: null,
    districtCode: null,
    province: null,
    provinceCode: null,
  });

  public selectedLocation?: ISelectedLocation;

  public loading = {
    submit: false,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit(): void {
    if (this.dataDetail) {
      this.updateForm.patchValue({
        ...(this.dataDetail as any),
      });
      this.selectedLocation = {
        province: {
          provinceCode: this.dataDetail?.provinceCode,
          province: this.dataDetail?.province,
        },
        district: {
          districtCode: this.dataDetail?.districtCode,
          district: this.dataDetail?.district,
        },
        ward: {
          wardCode: this.dataDetail?.wardCode,
          ward: this.dataDetail?.ward,
        },
      };
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const body = {
      ...this.updateForm.value,
    };
    this.customerService.customer
      .update(this.dataDetail.id, body)
      .pipe()
      .subscribe((res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess('update');
          this.updateSuccessEvent.emit(res.data);
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  handleEmittedEvent(data: ISelectedLocation) {
    this.selectedLocation = {...data};
    this.updateForm.patchValue({
      province: data.province?.province || null,
      provinceCode: data.province?.provinceCode || null,
      district: data.district?.district || null,
      districtCode: data.district?.districtCode || null,
      ward: data.ward?.ward || null,
      wardCode: data.ward?.wardCode || null,
    } as any);
    this.handleCombineAddress();
  }

  handleCombineAddress() {
    const {street, district, ward, province} = this.updateForm.value;
    const addressParts = [street, ward, district, province];
    const address = addressParts.filter((part) => part).join(', ');
    this.updateForm.patchValue({
      address,
    } as any);
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
