import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ESourceArgKey, ISettingTabItem} from '@app/types/setting';

@Component({
  selector: 'app-modal-create-update-tab',
  templateUrl: './modal-create-update-tab.component.html',
})
export class ModalCreateUpdateTabComponent implements OnInit {
  @Input() tabData?: ISettingTabItem;
  @Output() saveEvent = new EventEmitter<any>();

  public iframeForm: FormGroup;
  public submitted = false;
  public previewUrl = '';

  public listSourceArgKey = [
    {
      label: 'Họ tên khách hàng',
      value: ESourceArgKey.NAME,
    },
    {
      label: 'Số điện thoại',
      value: ESourceArgKey.PHONE,
    },
    {
      label: 'Email',
      value: ESourceArgKey.EMAIL,
    },
    {
      label: 'Địa chỉ (Số nhà/Đường/Phố)',
      value: ESourceArgKey.ADDRESS,
    },
    {
      label: 'Tỉnh/Thành phố',
      value: ESourceArgKey.PROVINCE_CODE,
    },
    {
      label: 'Quận/Huyện',
      value: ESourceArgKey.DISTRICT_CODE,
    },
    {
      label: 'Phường/Xã',
      value: ESourceArgKey.WARD_CODE,
    },
  ];

  constructor(
    private readonly fb: FormBuilder,
    public readonly bsModalRef: BsModalRef,
  ) {
    this.iframeForm = this.fb.group({
      name: [null, [Validators.required]],
      url: [null, [Validators.required]],
      isActive: [true],
      parameters: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    if (this.tabData) {
      this.iframeForm.patchValue({
        name: this.tabData.name || null,
        url: (this.tabData as any).url || null,
        isActive: this.tabData.active,
      });

      const parameters = (this.tabData as any).parameters || [];
      parameters.forEach((param: {argKey: string; argRef: string}) => {
        this.formParameters().push(
          this.fb.group({
            argKey: [param.argKey, Validators.required],
            argRef: [param.argRef, Validators.required],
          }),
        );
      });
    }

    this.iframeForm.valueChanges.subscribe(() => {
      this.updatePreviewUrl();
    });

    this.updatePreviewUrl();
  }

  get f(): {[key: string]: AbstractControl} {
    return this.iframeForm.controls;
  }

  formParameters(): FormArray {
    return <FormArray>this.iframeForm.get('parameters');
  }

  checkExistArgKey(argKey: string): boolean {
    return this.formParameters().controls.some(
      (control) => control?.get('argKey')?.value === argKey,
    );
  }

  handleAddParameter(): void {
    this.formParameters().push(
      this.fb.group({
        argKey: [null, Validators.required],
        argRef: [null, Validators.required],
      }),
    );
  }

  handleRemoveParameter(index: number): void {
    this.formParameters().removeAt(index);
    this.updatePreviewUrl();
  }

  updatePreviewUrl(): void {
    const url = this.iframeForm.get('url')?.value;
    if (!url) {
      this.previewUrl = '';
      return;
    }

    const params = this.formParameters().value;
    const queryParams: string[] = [];

    params.forEach((param: {argKey: string; argRef: string}) => {
      if (param.argRef) {
        // Mock value for preview
        let mockValue = '';
        switch (param.argKey) {
          case ESourceArgKey.PHONE:
            mockValue = '09020xxxxx';
            break;
          case ESourceArgKey.NAME:
            mockValue = 'Nguyễn Văn A';
            break;
          case ESourceArgKey.EMAIL:
            mockValue = 'example@email.com';
            break;
          default:
            mockValue = 'value';
        }
        queryParams.push(`${param.argRef}=${mockValue}`);
      }
    });

    if (queryParams.length > 0) {
      this.previewUrl = `${url}?${queryParams.join('&')}`;
    } else {
      this.previewUrl = url;
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.iframeForm.valid) {
      const formValue = this.iframeForm.value;
      this.saveEvent.emit({
        name: formValue.name,
        url: formValue.url,
        isActive: formValue.isActive,
        parameters: formValue.parameters,
        key: this.tabData?.key || `iframe_${Date.now()}`,
      });
      this.bsModalRef.hide();
    }
  }

  hideModal(): void {
    this.bsModalRef.hide();
  }
}
