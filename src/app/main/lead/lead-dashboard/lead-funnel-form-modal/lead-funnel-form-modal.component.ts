import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

export interface ILeadFunnelFormData {
  name: string;
  description?: string;
  folderId?: string;
  leadStatusDefaultId: string;
  leadStatusIds: string[];
}

// Custom validator for array fields
function arrayNotEmpty(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!Array.isArray(value) || value.length === 0) {
    return { required: true };
  }
  return null;
}

// Custom validator to ensure default status is included in selected statuses
function defaultStatusInSelectedStatuses(formGroup: AbstractControl): ValidationErrors | null {
  const defaultStatusId = formGroup.get('leadStatusDefaultId')?.value;
  const selectedStatuses = formGroup.get('leadStatusIds')?.value;

  if (!defaultStatusId || !Array.isArray(selectedStatuses)) {
    return null;
  }

  if (!selectedStatuses.includes(defaultStatusId)) {
    return { defaultNotInSelected: true };
  }

  return null;
}

@Component({
  selector: 'app-lead-funnel-form-modal',
  templateUrl: './lead-funnel-form-modal.component.html',
  styleUrls: ['./lead-funnel-form-modal.component.scss'],
})
export class LeadFunnelFormModalComponent implements OnInit, OnDestroy {
  funnelForm!: FormGroup;
  funnel?: any; // For edit mode
  private _folders: any[] = [];
  private _leadStatuses: any[] = [];
  isSubmitting = false;

  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadFunnelFormData>();

  get folders(): any[] {
    return this._folders;
  }

  set folders(value: any[]) {
    this._folders = value || [];
    // Auto-select first folder if form exists and no value selected
    if (this.funnelForm && this._folders.length > 0 && !this.funnelForm.get('folderId')?.value) {
      this.funnelForm.get('folderId')?.setValue(this._folders[0].id);
    }
  }

  get leadStatuses(): any[] {
    return this._leadStatuses;
  }

  set leadStatuses(value: any[]) {
    this._leadStatuses = value || [];
    // Auto-select first status if form exists and no value selected
    if (this.funnelForm && this._leadStatuses.length > 0) {
      // For default status (single select)
      if (!this.funnelForm.get('leadStatusDefaultId')?.value) {
        this.funnelForm.get('leadStatusDefaultId')?.setValue(this._leadStatuses[0].id);
      }
      // For multiple statuses (initialize with empty array if no value)
      if (!this.funnelForm.get('leadStatusIds')?.value || this.funnelForm.get('leadStatusIds')?.value.length === 0) {
        this.funnelForm.get('leadStatusIds')?.setValue([this._leadStatuses[0].id]);
      }
    }
  }

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
    this.funnelForm = this.fb.group({
      name: [this.funnel?.name || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.funnel?.description || '', [Validators.maxLength(500)]],
      folderId: [this.funnel?.folderId || '', [Validators.required]],
      leadStatusDefaultId: [this.funnel?.leadStatusDefaultId || '', [Validators.required]],
      leadStatusIds: [this.funnel?.leadStatusIds || [], [arrayNotEmpty]],
    }, { validators: defaultStatusInSelectedStatuses });

    // Auto-select first options if no existing values and data is available
    if (!this.funnel?.folderId && this.folders.length > 0) {
      this.funnelForm.get('folderId')?.setValue(this.folders[0].id);
    }
    if ((!this.funnel?.leadStatusDefaultId) && this.leadStatuses.length > 0) {
      this.funnelForm.get('leadStatusDefaultId')?.setValue(this.leadStatuses[0].id);
    }
    if ((!this.funnel?.leadStatusIds || this.funnel.leadStatusIds.length === 0) && this.leadStatuses.length > 0) {
      this.funnelForm.get('leadStatusIds')?.setValue([this.leadStatuses[0].id]);
    }
  }

  get isEditMode(): boolean {
    return !!this.funnel;
  }

  onSubmit(): void {
    if (this.funnelForm.invalid) {
      Object.keys(this.funnelForm.controls).forEach(key => {
        this.funnelForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.funnelForm.value };

    // Clean data: remove empty values but keep arrays
    const cleanedData: ILeadFunnelFormData = {
      name: formData.name,
      leadStatusDefaultId: formData.leadStatusDefaultId,
      leadStatusIds: formData.leadStatusIds,
      folderId: formData.folderId,
    };

    if (formData.description) {
      cleanedData.description = formData.description;
    }

    this.saveEvent.next(cleanedData);
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.funnelForm.get(fieldName);
    if (control?.hasError('required')) {
      if (fieldName === 'leadStatusIds') {
        return 'Vui lòng chọn ít nhất một trạng thái lead';
      }
      if (fieldName === 'leadStatusDefaultId') {
        return 'Vui lòng chọn trạng thái mặc định';
      }
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Độ dài tối đa là ${maxLength} ký tự`;
    }

    // Check form-level validation errors
    if (fieldName === 'leadStatusDefaultId' && this.funnelForm.hasError('defaultNotInSelected')) {
      return 'Trạng thái mặc định phải nằm trong danh sách trạng thái đã chọn';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.funnelForm.get(fieldName);
    const hasFormError = fieldName === 'leadStatusDefaultId' && this.funnelForm.hasError('defaultNotInSelected');
    return !!(control && (control.invalid || hasFormError) && (control.dirty || control.touched));
  }

}
