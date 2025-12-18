import {Component, EventEmitter, Output} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {calculateNextPos} from '@app/utils/common';
import {ILeadStatus} from '@app/types/lead';

@Component({
  selector: 'app-sort-lead-status-modal',
  templateUrl: './sort-lead-status-modal.component.html',
  styleUrls: ['./sort-lead-status-modal.component.scss'],
})
export class SortLeadStatusModalComponent {
  @Output() onStatusUpdated = new EventEmitter<ILeadStatus[]>();

  public statuses: ILeadStatus[] = [];
  public loading = false;

  constructor(
    public bsModalRef: BsModalRef,
    private toastrService: ToastrService,
    private autoTaskService: AutoTaskService,
  ) {}

  onDrop(event: CdkDragDrop<ILeadStatus[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    if (!this.statuses[event.previousIndex]?.id) {
      return;
    }

    // Đảm bảo tất cả items đều có pos trước khi tính toán
    this.statuses.forEach((status, index) => {
      if (status.pos === undefined || status.pos === null) {
        status.pos = (index + 1) * 1000;
      }
    });

    // Di chuyển item trong mảng statuses
    moveItemInArray(this.statuses, event.previousIndex, event.currentIndex);

    // Lấy danh sách pos sau khi di chuyển
    const afterMovedPosList = this.statuses.map((status) => status.pos || 0);

    // Lấy item đã di chuyển
    const movedStatus = this.statuses[event.currentIndex];

    // Tính toán pos mới sử dụng calculateNextPos
    const newPos = calculateNextPos(afterMovedPosList, event.currentIndex);
    movedStatus.pos = newPos;

    // Gọi API để update pos
    this.loading = true;
    this.autoTaskService.leadStatus
      .update(movedStatus.id, {pos: newPos})
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.status === 200) {
            this.toastrService.success('Cập nhật vị trí thành công');
            this.onStatusUpdated.emit([...this.statuses]);
          } else {
            // Rollback nếu có lỗi
            moveItemInArray(
              this.statuses,
              event.currentIndex,
              event.previousIndex,
            );
            this.toastrService.error('Không thể cập nhật vị trí');
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error updating position:', err);
          // Rollback nếu có lỗi
          moveItemInArray(
            this.statuses,
            event.currentIndex,
            event.previousIndex,
          );
          this.toastrService.error('Không thể cập nhật vị trí');
        },
      });
  }

  onCancel() {
    this.bsModalRef.hide();
  }

  trackByStatusId(index: number, status: ILeadStatus): string {
    return status.id;
  }
}
