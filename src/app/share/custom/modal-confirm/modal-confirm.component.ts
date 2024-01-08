import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {distinctUntilChanged, of, Subject, switchMap, takeUntil} from 'rxjs';
import {BsModalRef, BsModalService, ModalModule} from 'ngx-bootstrap/modal';
import {ModalConfirmService} from './modal-confirm.service';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';

export interface IModalConfirmContent {
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | string;
  modalType?: 'default' | 'advance' | string;
  context?: any;
}

@Component({
  selector: 'modal-confirm',
  templateUrl: './modal-confirm.component.html',
  styleUrls: ['./modal-confirm.component.scss'],
  providers: [BsModalService],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalModule],
})
export class ModalConfirmComponent implements OnInit, OnDestroy {
  @ViewChild('template', {static: true}) template!: TemplateRef<any>;
  @ViewChild('templateAdvance', {static: true})
  protected templateAdvance!: TemplateRef<any>;
  @Output() confirmEvent = new EventEmitter<any>();
  @Output() declineEvent = new EventEmitter<any>();
  @Input() key?: string;

  public modalContent: IModalConfirmContent = {
    title: 'Xác nhận',
    description: '',
    okText: undefined,
    cancelText: undefined,
    type: 'warning',
    modalType: 'default',
  };
  public templateWillShow: TemplateRef<any> = this.template;
  private destroy$ = new Subject();
  protected modalRef?: BsModalRef;
  protected isOpenBackdrop = false;
  public isClickOverlay: boolean = false;

  constructor(
    private modalService: BsModalService,
    private modalConfirmService: ModalConfirmService,
  ) {}

  ngOnInit(): void {
    this.modalConfirmService?.modalType
      .pipe()
      .subscribe((modalType: string) => {
        if (modalType === 'advance') {
          this.templateWillShow = this.templateAdvance;
        } else {
          this.templateWillShow = this.template;
        }
      });
    this.modalConfirmService?.toggleModal
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(({isOpen, key}) => {
          this.modalConfirmService?.modalContent
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((modalContent: IModalConfirmContent) => {
              this.modalContent = Object.assign(
                this.modalContent,
                modalContent,
              );
            });
          if (key === this.key) {
            return of(isOpen);
          } else return of(false);
        }),
      )
      .subscribe((isOpen: boolean) => {
        if (isOpen) {
          this.openModal(this.modalContent);
        }
      });

    this.modalService.onHide.subscribe(() => {
      this.isOpenBackdrop = false;
      this.modalConfirmService.closeModal();
    });
  }

  openModal(modalContent: IModalConfirmContent) {
    this.isOpenBackdrop = true;
    this.modalRef = this.modalService.show(this.templateWillShow, {
      class: 'modal-md modal-confirm modal-confirm-default',
      backdrop: false,
      ignoreBackdropClick: true,
      keyboard: false,
    });
  }

  confirm(): void {
    this.confirmEvent.emit(this.modalContent?.context);
    this.modalRef?.hide();
    this.modalConfirmService.closeModal();
    this.isOpenBackdrop = false;
  }

  decline(): void {
    this.declineEvent.emit(this.modalContent?.context);
    this.modalRef?.hide();
    this.isOpenBackdrop = false;
  }

  hideModal() {
    this.modalRef?.hide();
    this.modalConfirmService.closeModal();
    this.isOpenBackdrop = false;
  }

  handleClickOverlay($event: any) {
    $event.preventDefault();
    this.isClickOverlay = true;
    if (this.isClickOverlay) {
      setTimeout(() => {
        this.isClickOverlay = false;
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
