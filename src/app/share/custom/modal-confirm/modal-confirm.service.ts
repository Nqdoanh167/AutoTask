import {Injectable} from '@angular/core';
import {IModalConfirmContent} from './modal-confirm.component';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalConfirmService {
  public toggleModal = new BehaviorSubject<{
    isOpen: boolean;
    key?: string;
  }>({isOpen: false});
  public modalContent = new BehaviorSubject<IModalConfirmContent>({});
  public modalType = new BehaviorSubject<string | 'default' | 'advance'>(
    'default',
  );

  constructor() {}

  openModal(modalContent: IModalConfirmContent, key?: string): void {
    this.modalType.next(modalContent.modalType || 'default');
    this.toggleModal.next({
      isOpen: true,
      key,
    });
    this.modalContent.next(modalContent);
  }

  closeModal(): void {
    this.toggleModal.next({
      isOpen: false,
      key: undefined,
    });
    this.modalContent.next({});
  }
}
