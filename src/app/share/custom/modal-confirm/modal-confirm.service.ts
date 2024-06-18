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
  public okFunc = new BehaviorSubject<Function | null>(null);
  public declineFunc = new BehaviorSubject<Function | null>(null);

  constructor() {}

  openModal(
    modalContent: IModalConfirmContent,
    key?: string,
    okFunc?: Function,
    declineFunc?: Function,
  ): void {
    this.modalType.next(modalContent.modalType || 'default');
    this.toggleModal.next({
      isOpen: true,
      key,
    });
    this.okFunc.next(okFunc || null);
    this.declineFunc.next(declineFunc || null);
    this.modalContent.next(modalContent);
  }

  closeModal(): void {
    this.toggleModal.next({
      isOpen: false,
      key: undefined,
    });
    this.modalContent.next({});
  }

  successEvent() {
    this.closeModal();
  }
}
