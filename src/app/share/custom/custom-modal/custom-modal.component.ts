import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomButtonLoadingComponent],
})
export class CustomModalComponent implements OnInit, OnDestroy {
  @Input() type: 'standard' | 'lack-center' = 'standard';
  @Input() isLoading: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Input() hideFooter: boolean = false;
  @Input() textOk: string = 'Lưu';
  @Input() className: string = '';
  @Input() confirmClose: boolean = false;
  @Output() hideModal = new EventEmitter<Event>();
  @Output() submitModal = new EventEmitter<Event>();

  private destroy$ = new Subject();

  constructor(
    private modalRef: BsModalRef,
    private readonly modalConfirmService: ModalConfirmService,
  ) {}

  onHideModal(): void {
    if (this.confirmClose) {
      const title = 'Thoát thay đổi?';
      const description =
        'Thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát không?\n' +
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
        this.hideModal.emit();
        this.modalRef.hide();
      });
    } else {
      this.hideModal.emit();
      this.modalRef.hide();
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    this.submitModal.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
