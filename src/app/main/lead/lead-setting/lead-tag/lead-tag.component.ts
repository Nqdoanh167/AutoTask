import {Component, OnInit} from '@angular/core';
import {BsModalService, BsModalRef} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ILeadTag, ILeadTagCreateDto, ILeadTagUpdateDto} from '@app/types/lead-tag';
import {LeadTagFormModalComponent} from './lead-tag-form-modal/lead-tag-form-modal.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-lead-tag',
  templateUrl: './lead-tag.component.html',
  styleUrls: ['./lead-tag.component.scss'],
})
export class LeadTagComponent implements OnInit {
  public configFilters: any[] = [];
  public dataSource: ILeadTag[] = [];
  public loading = false;

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
    this.autoTaskService.leadTag.get({}).subscribe({
      next: (res) => {
        this.dataSource = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lead tags:', err);
        this.toastrService.error('Không thể tải danh sách tag');
        this.loading = false;
        
        // Mock data for demo (commented for fallback)
        // this.dataSource = [
        //   {
        //     id: '1',
        //     name: 'Hot Lead',
        //     description: 'Khách hàng tiềm năng cao',
        //     isActive: true,
        //     bgColor: '#dc3545',
        //     color: '#ffffff',
        //     icon: 'fa-fire',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        //   {
        //     id: '2',
        //     name: 'VIP',
        //     description: 'Khách hàng VIP',
        //     isActive: true,
        //     bgColor: '#ffc107',
        //     color: '#000000',
        //     icon: 'fa-crown',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        //   },
        // ];
      }
    });
  }

  onAddNew() {
    const modalRef: BsModalRef = this.modalService.show(LeadTagFormModalComponent, {
      class: 'modal-md modal-dialog-centered',
    });

    if (modalRef.content) {
      (modalRef.content as LeadTagFormModalComponent).saveEvent.subscribe((data: ILeadTagCreateDto | ILeadTagUpdateDto) => {
        this.autoTaskService.leadTag.create(data).subscribe({
          next: (res) => {
            this.toastrService.success('Thêm tag thành công');
            this.loadData();
            modalRef.hide();
          },
          error: (err) => {
            console.error('Error creating tag:', err);
            this.toastrService.error('Không thể thêm tag');
          }
        });
      });
    }
  }

  onEdit(item: ILeadTag) {
    const modalRef: BsModalRef = this.modalService.show(LeadTagFormModalComponent, {
      class: 'modal-md modal-dialog-centered',
      initialState: {
        tag: item,
      },
    });

    if (modalRef.content) {
      (modalRef.content as LeadTagFormModalComponent).saveEvent.subscribe((data: ILeadTagCreateDto | ILeadTagUpdateDto) => {
        if ('id' in data) {
          this.autoTaskService.leadTag.update(data.id, data).subscribe({
            next: (res) => {
              this.toastrService.success('Cập nhật tag thành công');
              this.loadData();
              modalRef.hide();
            },
            error: (err) => {
              console.error('Error updating tag:', err);
              this.toastrService.error('Không thể cập nhật tag');
            }
          });
        }
      });
    }
  }

  onDelete(item: ILeadTag) {
    if (confirm(`Bạn có chắc muốn xóa tag "${item.name}"?`)) {
      this.autoTaskService.leadTag.delete(item.id).subscribe({
        next: (res) => {
            this.toastrService.success('Xóa tag thành công');
            this.loadData();
        },
        error: (err) => {
          console.error('Error deleting tag:', err);
          this.toastrService.error('Không thể xóa tag');
        }
      });
    }
  }

  onSearchEvent(event: any) {
    // TODO: Implement search
    console.log('Search:', event);
  }

}
