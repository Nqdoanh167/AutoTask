import {Component, OnInit} from '@angular/core';
import {BsModalService, BsModalRef} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ILeadStatus, ILeadStatusCreateDto, ILeadStatusUpdateDto, ELeadStatusType, LEAD_STATUS_TYPE_LABELS} from '@app/types/lead-status';
import {LeadStatusFormModalComponent} from './lead-status-form-modal/lead-status-form-modal.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {calculateNextPos} from '@app/utils/common';

@Component({
  selector: 'app-lead-status',
  templateUrl: './lead-status.component.html',
  styleUrls: ['./lead-status.component.scss'],
})
export class LeadStatusComponent implements OnInit {
  public configFilters: any[] = [];
  public dataSource: ILeadStatus[] = [];
  public loading = false;
  public statusTypeLabels = LEAD_STATUS_TYPE_LABELS;

  constructor(
    private modalService: BsModalService,
    private toastrService: ToastrService,
    private autoTaskService: AutoTaskService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.autoTaskService.leadStatus.get({sort: 'pos'}).subscribe({
      next: (res) => {
        this.dataSource = res.data || [];
        // Nếu có items chưa có pos, tự động gán pos dựa trên index
        this.initializePositions();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lead statuses:', err);
        this.toastrService.error('Không thể tải danh sách trạng thái');
        this.loading = false;
        
        // Mock data for demo (commented for fallback)
        // this.dataSource = [
        //   {
        //     id: '1',
        //     name: 'Lead Mới',
        //     type: ELeadStatusType.NEW,
        //     description: 'Lead vừa được tạo, chưa liên hệ',
        //     isActive: true,
        //     isDefault: true,
        //     bgColor: '#17a2b8',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        //   {
        //     id: '2',
        //     name: 'Đã liên hệ',
        //     type: ELeadStatusType.CONTACTED,
        //     description: 'Đã liên hệ với khách hàng',
        //     isActive: true,
        //     isDefault: false,
        //     bgColor: '#007bff',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        //   {
        //     id: '3',
        //     name: 'Đủ điều kiện',
        //     type: ELeadStatusType.QUALIFIED,
        //     description: 'Khách hàng đủ điều kiện mua hàng',
        //     isActive: true,
        //     isDefault: false,
        //     bgColor: '#6610f2',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        //   {
        //     id: '4',
        //     name: 'Thành công',
        //     type: ELeadStatusType.WON,
        //     description: 'Chốt đơn thành công',
        //     isActive: true,
        //     isDefault: false,
        //     bgColor: '#28a745',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        //   {
        //     id: '5',
        //     name: 'Thất bại',
        //     type: ELeadStatusType.LOST,
        //     description: 'Không chốt được đơn',
        //     isActive: true,
        //     isDefault: false,
        //     bgColor: '#dc3545',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        // ];
      }
    });
  }

  onAddNew() {
    const modalRef: BsModalRef = this.modalService.show(LeadStatusFormModalComponent, {
      class: 'modal-md modal-dialog-centered',
    });

    if (modalRef.content) {
      (modalRef.content as LeadStatusFormModalComponent).saveEvent.subscribe((data: ILeadStatusCreateDto | ILeadStatusUpdateDto) => {
        this.autoTaskService.leadStatus.create(data).subscribe({
          next: (res) => {
            this.toastrService.success('Thêm trạng thái thành công');
            this.invalidateLeadStatusesCache();
            this.loadData();
            modalRef.hide();
          },
          error: (err) => {
            console.error('Error creating status:', err);
            this.toastrService.error('Không thể thêm trạng thái');
          }
        });
      });
    }
  }

  onEdit(item: ILeadStatus) {
    const modalRef: BsModalRef = this.modalService.show(LeadStatusFormModalComponent, {
      class: 'modal-md modal-dialog-centered',
      initialState: {
        status: item,
      },
    });

    if (modalRef.content) {
      (modalRef.content as LeadStatusFormModalComponent).saveEvent.subscribe((data: ILeadStatusCreateDto | ILeadStatusUpdateDto) => {
        if ('id' in data) {
          if (data.isDefault === false) {
            delete data.isDefault;
          }
          this.autoTaskService.leadStatus.update(data.id, data).subscribe({
            next: (res) => {
              if (res.status === 400) {
                this.toastrService.error(res.message);
              } else if (res.status === 200) {
                this.toastrService.success('Cập nhật trạng thái thành công');
                this.invalidateLeadStatusesCache();
                this.loadData();
                modalRef.hide();
              } else {
                console.error('Error updating status:', res);
                this.toastrService.error('Đã có lỗi xảy ra');
              }
            },
            error: (err) => {
              console.error('Error updating status:', err);
              this.toastrService.error('Không thể cập nhật trạng thái');
            }
          });
        }
      });
    }
  }

  onSetDefault(item: ILeadStatus) {
    if (item.isDefault) {
      return; // Already default, should be disabled but just in case
    }

    if (confirm(`Bạn có chắc muốn đặt "${item.name}" làm trạng thái mặc định?`)) {
      this.autoTaskService.leadStatus.update(item.id, { isDefault: true }).subscribe({
        next: (res) => {
          this.toastrService.success('Đặt trạng thái mặc định thành công');
          this.invalidateLeadStatusesCache();
          this.loadData();
        },
        error: (err) => {
          console.error('Error setting default status:', err);
          this.toastrService.error('Không thể đặt trạng thái mặc định');
        }
      });
    }
  }

  onDelete(item: ILeadStatus) {
    if (item.isDefault) {
      this.toastrService.warning('Không thể xóa trạng thái mặc định');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa trạng thái "${item.name}"?`)) {
      this.autoTaskService.leadStatus.delete(item.id).subscribe({
        next: (res) => {
          this.toastrService.success('Xóa trạng thái thành công');
          this.invalidateLeadStatusesCache();
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting status:', err);
          this.toastrService.error('Không thể xóa trạng thái');
        }
      });
    }
  }

  onSearchEvent(event: any) {
    // TODO: Implement search
    console.log('Search:', event);
  }

  /**
   * Invalidate lead statuses cache (shared with dashboard)
   */
  private invalidateLeadStatusesCache() {
    localStorage.removeItem('leadStatuses_cache');
    localStorage.removeItem('leadStatuses_cache_timestamp');
  }

  /**
   * Khởi tạo pos cho các items chưa có pos
   * Gán pos dựa trên index (index * 1000) để đảm bảo có khoảng cách đủ lớn
   */
  private initializePositions() {
    let hasItemsWithoutPos = false;
    const itemsToUpdate: Array<{id: string; pos: number}> = [];

    this.dataSource.forEach((item, index) => {
      if (item.pos === undefined || item.pos === null) {
        hasItemsWithoutPos = true;
        // Gán pos tạm thời cho UI
        item.pos = (index + 1) * 1000;
        // Lưu vào danh sách để update
        if (item.id) {
          itemsToUpdate.push({ id: item.id, pos: item.pos });
        }
      }
    });

    // Nếu có items chưa có pos, batch update để lưu vào DB
    if (hasItemsWithoutPos && itemsToUpdate.length > 0) {
      this.batchUpdatePositions(itemsToUpdate);
    }
  }

  /**
   * Batch update positions cho nhiều items
   */
  private batchUpdatePositions(items: Array<{id: string; pos: number}>) {
    // Update từng item (có thể tối ưu thành batch API nếu backend hỗ trợ)
    let completed = 0;
    const total = items.length;

    items.forEach(({ id, pos }) => {
      this.autoTaskService.leadStatus.update(id, { pos }).subscribe({
        next: (res) => {
          completed++;
          if (completed === total) {
            // Tất cả đã update xong, invalidate cache
            this.invalidateLeadStatusesCache();
          }
        },
        error: (err) => {
          console.error(`Error updating pos for item ${id}:`, err);
          completed++;
        }
      });
    });
  }

  onDrop(event: CdkDragDrop<ILeadStatus[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    if (!this.dataSource[event.previousIndex]?.id) {
      return;
    }

    // Đảm bảo tất cả items đều có pos trước khi tính toán
    // Nếu có item chưa có pos, gán pos tạm thời dựa trên index
    this.dataSource.forEach((item, index) => {
      if (item.pos === undefined || item.pos === null) {
        item.pos = (index + 1) * 1000;
      }
    });

    // Di chuyển item trong mảng dataSource
    moveItemInArray(this.dataSource, event.previousIndex, event.currentIndex);
    
    // Lấy danh sách pos sau khi di chuyển
    const afterMovedPosList = this.dataSource.map((item) => item.pos || 0);
    
    // Lấy item đã di chuyển
    const movedItem = this.dataSource[event.currentIndex];

    // Tính toán pos mới sử dụng calculateNextPos
    const newPos = calculateNextPos(afterMovedPosList, event.currentIndex);
    movedItem.pos = newPos;

    // Gọi API để update pos
    this.autoTaskService.leadStatus.update(movedItem.id, { pos: newPos }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.toastrService.success('Cập nhật vị trí thành công');
          this.invalidateLeadStatusesCache();
        } else {
          // Rollback nếu có lỗi
          moveItemInArray(this.dataSource, event.currentIndex, event.previousIndex);
          this.toastrService.error('Không thể cập nhật vị trí');
        }
      },
      error: (err) => {
        console.error('Error updating position:', err);
        // Rollback nếu có lỗi
        moveItemInArray(this.dataSource, event.currentIndex, event.previousIndex);
        this.toastrService.error('Không thể cập nhật vị trí');
      }
    });
  }
}
