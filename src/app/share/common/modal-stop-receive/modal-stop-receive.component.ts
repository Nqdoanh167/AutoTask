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
import {BaseComponentsComponent} from '@app/share/common/base-components/base-components.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {UserAcl} from '@app/types/setting';
import {finalize, takeUntil} from 'rxjs';

@Component({
  selector: 'app-modal-stop-receive',
  templateUrl: './modal-stop-receive.component.html',
  styleUrls: ['./modal-stop-receive.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class ModalStopReceiveComponent
  extends BaseComponentsComponent
  implements OnInit
{
  @Output() updateSuccess = new EventEmitter<boolean>();

  formGroup!: FormGroup;
  loading = false;
  userAcl!: UserAcl;

  // Options for stop receiving duration
  stopOptions = [
    {id: 'continue', label: 'Vẫn tiếp tục nhận số', value: 0},
    {id: '15m', label: 'Trong 15 phút', value: 15},
    {id: '1h', label: 'Trong 1 giờ', value: 60},
    {id: '8h', label: 'Trong 8 giờ', value: 8 * 60},
    {id: '24h', label: 'Trong 24 giờ', value: 24 * 60},
    {id: 'until_restart', label: 'Đến khi tôi bật lại', value: -1},
  ];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private autoTaskService: AutoTaskService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserAclData();
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      stopReceiveTaskDuration: [0],
    });
  }

  loadUserAclData(): void {
    this.loading = true;
    this.autoTaskService.userAcl
      .get()
      .pipe(takeUntil(this.destroy$), finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const user = response.data.find((user) => user.userId === this.currentUser?.id);
          if (user) {
            this.userAcl = user;
            this.formGroup.patchValue({
              stopReceiveTaskDuration: this.userAcl.stopReceiveTaskDuration || 0,
            });
          }
        },
      });
  }

  onSubmit(): void {
    if (this.formGroup.invalid) {
      return;
    }

    this.loading = true;
    this.autoTaskService.userAcl.upsert({
      ...this.userAcl,
      stopReceiveTaskDuration: this.formGroup.value.stopReceiveTaskDuration,
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.updateSuccess.emit(true);
          this.bsModalRef.hide();
        },
      });
  }
}
