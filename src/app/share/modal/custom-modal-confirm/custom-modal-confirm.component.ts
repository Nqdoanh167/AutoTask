import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {CommonModule} from '@angular/common';

export interface IModalConfirmContent {
  description: string;
  okText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'error';
}

@Component({
  selector: 'custom-modal-confirm',
  templateUrl: './custom-modal-confirm.component.html',
  styleUrls: ['./custom-modal-confirm.component.scss'],
})
export class CustomModalConfirmComponent implements OnInit, OnDestroy {
  @ViewChild('template') template: any;
  private destroy = new Subject();
  public modalRef?: BsModalRef;
  public modalContent: IModalConfirmContent = {
    description: '',
    okText: 'Ok',
    cancelText: 'Cancel',
    type: 'warning',
  };
  public okFunc?: Function;

  constructor(private modalService: BsModalService) {}

  ngOnInit(): void {}

  openModal(modalContent: IModalConfirmContent, okFunc?: Function) {
    this.modalContent = Object.assign(this.modalContent, modalContent);
    this.modalRef = this.modalService.show(this.template, {class: 'modal-sm'});
    this.okFunc = okFunc;
  }

  confirm(): void {
    this.okFunc?.();
    this.modalRef?.hide();
  }

  decline(): void {
    this.modalRef?.hide();
  }

  hideModal() {
    this.modalRef?.hide();
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
