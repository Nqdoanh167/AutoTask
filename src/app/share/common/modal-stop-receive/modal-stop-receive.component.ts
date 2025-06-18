import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-modal-stop-receive',
  templateUrl: './modal-stop-receive.component.html',
  styleUrls: ['./modal-stop-receive.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class ModalStopReceiveComponent implements OnInit {
  @Output() updateSuccess = new EventEmitter<boolean>();

  formGroup!: FormGroup;
  loading = false;

  // Options for stop receiving duration
  stopOptions = [
    {id: '15m', label: 'Trong 15 phút', value: 15 * 60 * 1000},
    {id: '1h', label: 'Trong 1 giờ', value: 60 * 60 * 1000},
    {id: '8h', label: 'Trong 8 giờ', value: 8 * 60 * 60 * 1000},
    {id: '24h', label: 'Trong 24 giờ', value: 24 * 60 * 60 * 1000},
    {id: 'until_restart', label: 'Đến khi tôi bật lại', value: -1},
  ];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      stopDuration: ['15m', Validators.required],
    });
  }

  onSubmit(): void {
    //   const formValue = this.formGroup.value;
    //   const selectedOption = this.stopOptions.find(option => option.id === formValue.stopDuration);
    //   if (!selectedOption) return;
    //   this.loading = true;
    //   // Calculate end time if not "until restart"
    //   const endTime = selectedOption.id === 'until_restart'
    //     ? null
    //     : new Date(Date.now() + selectedOption.value).toISOString();
    //   const payload = {
    //     stopReceiving: true,
    //     stopUntil: endTime,
    //     stopUntilRestart: selectedOption.id === 'until_restart'
    //   };
    //   this.settingService.updateUserSettings(payload)
    //     .pipe(finalize(() => this.loading = false))
    //     .subscribe({
    //       next: (res) => {
    //         if (res.status === 200) {
    //           this.commonService.showSuccess('Đã ngừng nhận số thành công');
    //           this.updateSuccess.emit(true);
    //           this.bsModalRef.hide();
    //         }
    //       },
    //       error: (err) => {
    //         this.commonService.showError('Có lỗi xảy ra khi cập nhật cài đặt');
    //       }
    //     });
  }
}
