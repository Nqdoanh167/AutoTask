import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {CommonModule, NgClass} from '@angular/common';
import omitBy from 'lodash/omitBy';
import isNil from 'lodash/isNil';
import {takeUntil} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import reverse from 'lodash/reverse';
import uniqBy from 'lodash/uniqBy';
import {
  IDistrict,
  IParamsSearchLocation,
  IProvince,
  ISelectedLocation,
  IWard,
} from '@app/types/location';
import {ApiLocationService} from '@app/services/api/location';

@Component({
  selector: 'select-location',
  templateUrl: './select-location.component.html',
  styleUrls: ['./select-location.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectModule,
    NgClass,
    FormsModule,
    CommonModule,
  ],
})
export class SelectLocationComponent implements OnInit, OnDestroy {
  @Input() type: 'provinceCode' | 'districtCode' | 'wardCode' = 'wardCode';
  @Input() typeDisplay: 'vertical' | 'horizontal' = 'vertical';
  @Input() showLabel = false;
  @Output() emitData = new EventEmitter<any>();

  public formLocation = this.fb.group({
    provinceCode: [null],
    districtCode: [null],
    wardCode: [null],
  });

  private destroy$ = new Subject();

  protected provinces: IProvince[] = [];
  protected districts: IDistrict[] = [];
  protected wards: IWard[] = [];

  @Input() selected?: ISelectedLocation = {
    province: undefined,
    district: undefined,
    ward: undefined,
  };

  protected loadingLocation = {
    province: false,
    district: false,
    ward: false,
  };

  constructor(
    private readonly detectChange: ChangeDetectorRef,
    private readonly apiLocationService: ApiLocationService,
    private readonly toastr: ToastrService,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    if (this.selected) {
      const {province, district, ward} = this.selected;
      this.provinces = (province ? [province] : []) as IProvince[];
      this.districts = (district ? [district] : []) as IDistrict[];
      this.wards = (ward ? [ward] : []) as IWard[];
      this.formLocation.patchValue({
        provinceCode: province?.provinceCode || null,
        districtCode: district?.districtCode || null,
        wardCode: ward?.wardCode || null,
      } as any);
      this.detectChange.detectChanges();
    }
  }

  getProvince() {
    this.apiLocationService
      .getProvince({
        location: 'VN',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingLocation.province = false;
          if (res?.data) {
            if (res) {
              this.provinces = uniqBy([...res.data], 'id');
              this.detectChange.detectChanges();
            }
          }
        },
        error: () => {
          this.toastr.error('Lấy dữ liệu Location thất bại');
        },
      });
  }

  getDistrict() {
    this.loadingLocation.district = true;
    const params: IParamsSearchLocation = {location: 'VN'};
    if (this.selected?.province?.provinceCode)
      params['provinceCode'] = this.selected.province?.provinceCode;
    this.apiLocationService
      .getDistrict(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingLocation.district = false;
          if (res?.data) {
            if (res) {
              this.districts = uniqBy([...res.data], 'id');
              this.detectChange.detectChanges();
            }
          }
        },
        error: () => {
          this.toastr.error('Lấy dữ liệu Location thất bại');
        },
      });
  }

  getWard() {
    this.loadingLocation.ward = true;
    const params: IParamsSearchLocation = {
      location: 'VN',
    };
    if (
      this.selected?.district?.districtCode &&
      this.selected?.province?.provinceCode
    ) {
      params['provinceCode'] = this.selected?.province?.provinceCode;
      params['districtCode'] = this.selected?.district?.districtCode;
    }
    this.apiLocationService
      .getAllWard(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingLocation.ward = false;
          if (res?.data) {
            let arrayWard = reverse([...res.data]);
            arrayWard?.forEach((item) => {
              this.wards.unshift(item);
            });
            this.wards = uniqBy(this.wards, 'id');
            this.detectChange.detectChanges();
          }
        },
        error: () => {
          this.toastr.error('Lấy dữ liệu Location thất bại');
        },
      });
  }

  handleChangeValue(data: string, type: string) {
    try {
      const selectedValue = {...this.selected};
      if (type === 'provinceCode') {
        selectedValue.province =
          this.provinces.find((item) => item.provinceCode === data) ||
          undefined;
        selectedValue.district = undefined;
        selectedValue.ward = undefined;
        this.formLocation.patchValue({
          districtCode: null,
          wardCode: null,
        });
        this.selected = {...selectedValue};
        if (['districtCode', 'wardCode'].includes(this.type)) {
          this.getDistrict();
        }
      }
      if (type === 'districtCode') {
        selectedValue.district =
          this.districts.find((item) => item.districtCode === data) ||
          undefined;
        selectedValue.ward = undefined;
        this.formLocation.patchValue({
          wardCode: null,
        });
        this.selected = {...selectedValue};
        if (this.type === 'wardCode') {
          this.getWard();
        }
      }
      if (type === 'wardCode') {
        selectedValue.ward =
          this.wards.find((item) => item.wardCode === data) || undefined;
        this.selected = {...selectedValue};
      }
      this.emitData.emit(omitBy(selectedValue, isNil));
    } catch (e) {
      console.error(e);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
