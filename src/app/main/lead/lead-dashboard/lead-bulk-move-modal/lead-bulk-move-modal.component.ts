import {Component, OnInit, EventEmitter, Output} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LeadService} from '@app/services/api/lead.service';
import {ToastrService} from 'ngx-toastr';
import {finalize} from 'rxjs';
import {IFunnel} from '@app/types/lead';

@Component({
  selector: 'app-lead-bulk-move-modal',
  templateUrl: './lead-bulk-move-modal.component.html',
  styleUrls: ['./lead-bulk-move-modal.component.scss'],
})
export class LeadBulkMoveModalComponent implements OnInit {
  @Output() moveEvent = new EventEmitter<string>();

  public leadIds: string[] = [];
  public currentFunnelId?: string;
  public funnels: IFunnel[] = [];
  public selectedFunnelId?: string;
  public isLoading = false;
  public isSubmitting = false;

  constructor(
    public bsModalRef: BsModalRef,
    private autoTaskService: AutoTaskService,
    private leadService: LeadService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadFunnels();
  }

  loadFunnels(): void {
    this.isLoading = true;
    this.leadService.leadFunnel
      .get({limit: 1000, sort: 'pos'})
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.funnels = res.data || [];
          } else {
            this.toastrService.error('Không thể tải danh sách phễu');
          }
        },
        error: (err: any) => {
          this.toastrService.error('Không thể tải danh sách phễu');
        },
      });
  }

  onSubmit(): void {
    if (!this.selectedFunnelId) {
      this.toastrService.warning('Vui lòng chọn phễu');
      return;
    }

    if (this.selectedFunnelId === this.currentFunnelId) {
      this.toastrService.warning('Vui lòng chọn phễu khác với phễu hiện tại');
      return;
    }

    this.moveEvent.emit(this.selectedFunnelId);
  }

  cancel(): void {
    this.bsModalRef.hide();
  }
}
