import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CustomModalComponent} from '@app/share/custom/custom-modal/custom-modal.component';
import {finalize, Subject, takeUntil} from 'rxjs';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-modal-delete-multi',
  templateUrl: './modal-delete-multi.component.html',
  imports: [CustomModalComponent, CommonModule, ProgressbarModule],
  standalone: true,
})
export class ModalDeleteMultiComponent implements OnDestroy {
  @Input() taskIds!: string[];
  @Input() taskCodes!: string[];
  @Output() success = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toastrService: ToastrService,
  ) {}

  handleDeleteMultiTasks() {
    const title = 'Bạn có chắc chắn muốn xóa các tác vụ này?';
    const description =
      'Các tác vụ này sẽ bị xóa vĩnh viễn và không thể khôi phục.\n' +
      'Hành động này không thể hoàn tác!';
    const okText = 'Đồng ý';
    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.autoTaskService.task.deleteMulti(this.taskIds)
        .pipe(
          finalize(() => {
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (res) => {
            if(res.status === 200) {
              this.toastrService.success('Vui lòng đợi...');
              this.success.emit();
            }else {
              this.toastrService.error('Xóa tác vụ thất bại');
            }
          },
          error: (err) => {
            this.toastrService.error(
              'Xóa tác vụ thất bại.',)
          },
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
