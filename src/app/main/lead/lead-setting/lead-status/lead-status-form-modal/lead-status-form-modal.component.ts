import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { 
  ILeadStatus, 
  ILeadStatusCreateDto, 
  ILeadStatusUpdateDto,
  ELeadStatusType,
  LEAD_STATUS_TYPE_LABELS 
} from '@app/types/lead-status';

@Component({
  selector: 'app-lead-status-form-modal',
  templateUrl: './lead-status-form-modal.component.html',
  styleUrls: ['./lead-status-form-modal.component.scss'],
})
export class LeadStatusFormModalComponent implements OnInit, OnDestroy {
  statusForm!: FormGroup;
  status?: ILeadStatus;
  isSubmitting = false;
  
  // Expose enum and labels for template
  public ELeadStatusType = ELeadStatusType;
  public statusTypeLabels = LEAD_STATUS_TYPE_LABELS;
  public statusTypeOptions = Object.keys(ELeadStatusType).map(key => ({
    value: ELeadStatusType[key as keyof typeof ELeadStatusType],
    label: LEAD_STATUS_TYPE_LABELS[ELeadStatusType[key as keyof typeof ELeadStatusType]],
  }));

  // Predefined colors for status
  predefinedColors = [
    { bg: '#17a2b8', name: 'Xanh dương nhạt' },
    { bg: '#007bff', name: 'Xanh dương' },
    { bg: '#6610f2', name: 'Tím' },
    { bg: '#28a745', name: 'Xanh lá' },
    { bg: '#20c997', name: 'Xanh lơ' },
    { bg: '#ffc107', name: 'Vàng' },
    { bg: '#fd7e14', name: 'Cam' },
    { bg: '#dc3545', name: 'Đỏ' },
    { bg: '#6c757d', name: 'Xám' },
    { bg: '#e83e8c', name: 'Hồng' },
  ];
  
  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadStatusCreateDto | ILeadStatusUpdateDto>();

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.statusForm = this.fb.group({
      name: [this.status?.name || '', [Validators.required]],
      description: [this.status?.description || ''],
      type: [this.status?.type || ELeadStatusType.NEW, [Validators.required]],
      isActive: [this.status?.isActive ?? true],
      isDefault: [this.status?.isDefault ?? false],
      bgColor: [this.status?.bgColor || '#007bff'],
    });

    if (this.isEditMode && this.status && this.status?.isDefault === true) {
      this.statusForm.get('isDefault')?.disable();
    }
  }

  get isEditMode(): boolean {
    return !!this.status;
  }

  onSubmit(): void {
    if (this.statusForm.invalid) {
      Object.keys(this.statusForm.controls).forEach(key => {
        this.statusForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.statusForm.value };

    // Remove empty values
    const cleanedData: Partial<ILeadStatusCreateDto> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    if (this.isEditMode && this.status) {
      const updateData: ILeadStatusUpdateDto = {
        id: this.status.id,
        ...cleanedData,
      };
      this.saveEvent.next(updateData);
    } else {
      const createData: ILeadStatusCreateDto = {
        name: formData.name,
        ...cleanedData,
      };
      this.saveEvent.next(createData);
    }
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.statusForm.get(fieldName);
    if (control?.hasError('required')) {
      if (fieldName === 'name') return 'Vui lòng nhập tên trạng thái';
      if (fieldName === 'type') return 'Vui lòng chọn loại trạng thái';
      return 'Trường này là bắt buộc';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.statusForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  selectColor(color: string): void {
    this.statusForm.patchValue({
      bgColor: color,
    });
  }

  get previewStyle(): any {
    return {
      'background-color': this.statusForm.get('bgColor')?.value || '#007bff',
      'color': '#ffffff',
    };
  }

  get selectedType(): ELeadStatusType {
    return this.statusForm.get('type')?.value || ELeadStatusType.NEW;
  }
}
