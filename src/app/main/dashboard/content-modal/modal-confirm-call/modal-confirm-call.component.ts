import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {CustomModalComponent} from '@share/custom/custom-modal/custom-modal.component';
import {ITask} from '@app/types/flow';

@Component({
  selector: 'app-modal-confirm-call',
  standalone: true,
  imports: [CustomModalComponent],
  templateUrl: './modal-confirm-call.component.html',
  styleUrl: './modal-confirm-call.component.scss',
})
export class ModalConfirmCallComponent implements OnInit, OnDestroy {
  @Input() customerPhone: string = '';
  @Input() task!: ITask;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {}
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
