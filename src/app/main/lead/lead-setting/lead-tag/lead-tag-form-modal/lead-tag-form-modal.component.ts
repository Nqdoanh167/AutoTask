import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { ILeadTag, ILeadTagCreateDto, ILeadTagUpdateDto } from '@app/types/lead-tag';

@Component({
  selector: 'app-lead-tag-form-modal',
  templateUrl: './lead-tag-form-modal.component.html',
  styleUrls: ['./lead-tag-form-modal.component.scss'],
})
export class LeadTagFormModalComponent implements OnInit, OnDestroy {
  tagForm!: FormGroup;
  tag?: ILeadTag;
  isSubmitting = false;
  
  // Predefined colors
  predefinedColors = [
    { bg: '#dc3545', text: '#ffffff', name: 'Đỏ' },
    { bg: '#fd7e14', text: '#ffffff', name: 'Cam' },
    { bg: '#ffc107', text: '#000000', name: 'Vàng' },
    { bg: '#28a745', text: '#ffffff', name: 'Xanh lá' },
    { bg: '#20c997', text: '#ffffff', name: 'Xanh lơ' },
    { bg: '#17a2b8', text: '#ffffff', name: 'Xanh dương nhạt' },
    { bg: '#007bff', text: '#ffffff', name: 'Xanh dương' },
    { bg: '#6610f2', text: '#ffffff', name: 'Tím' },
    { bg: '#e83e8c', text: '#ffffff', name: 'Hồng' },
    { bg: '#6c757d', text: '#ffffff', name: 'Xám' },
  ];

  // Predefined icons
  predefinedIcons = [
    'fa-tag',
    'fa-star',
    'fa-heart',
    'fa-flag',
    'fa-bookmark',
    'fa-fire',
    'fa-bolt',
    'fa-crown',
    'fa-gem',
    'fa-award',
    'fa-trophy',
    'fa-medal',
    'fa-certificate',
    'fa-thumbs-up',
    'fa-check-circle',
  ];
  
  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadTagCreateDto | ILeadTagUpdateDto>();

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
    this.tagForm = this.fb.group({
      name: [this.tag?.name || '', [Validators.required]],
      description: [this.tag?.description || ''],
      isActive: [this.tag?.isActive ?? true],
      bgColor: [this.tag?.bgColor || '#007bff'],
      color: [this.tag?.color || '#ffffff'],
      icon: [this.tag?.icon || 'fa-tag'],
    });
  }

  get isEditMode(): boolean {
    return !!this.tag;
  }

  onSubmit(): void {
    if (this.tagForm.invalid) {
      Object.keys(this.tagForm.controls).forEach(key => {
        this.tagForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.tagForm.value };

    // Remove empty values
    const cleanedData: Partial<ILeadTagCreateDto> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    if (this.isEditMode && this.tag) {
      const updateData: ILeadTagUpdateDto = {
        id: this.tag.id,
        ...cleanedData,
      };
      this.saveEvent.next(updateData);
    } else {
      const createData: ILeadTagCreateDto = {
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
    const control = this.tagForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.tagForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  selectColor(color: { bg: string; text: string }): void {
    this.tagForm.patchValue({
      bgColor: color.bg,
      color: color.text,
    });
  }

  selectIcon(icon: string): void {
    this.tagForm.patchValue({
      icon: icon,
    });
  }

  get previewStyle(): any {
    return {
      'background-color': this.tagForm.get('bgColor')?.value || '#007bff',
      'color': this.tagForm.get('color')?.value || '#ffffff',
    };
  }

  get selectedIcon(): string {
    return this.tagForm.get('icon')?.value || 'fa-tag';
  }
}
