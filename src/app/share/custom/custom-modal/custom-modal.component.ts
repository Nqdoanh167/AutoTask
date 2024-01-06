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
import {CustomButtonLoadingComponent} from '@share/custom/custom-button-loading/custom-button-loading.component';
import {TranslocoModule} from '@ngneat/transloco';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonLoadingComponent,
    TranslocoModule,
  ],
})
export class CustomModalComponent implements OnInit, OnDestroy {
  @Input() isLoading: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Output() hideModal = new EventEmitter<Event>();
  @Output() submitModal = new EventEmitter<Event>();

  private destroy$ = new Subject();

  constructor(private modalRef: BsModalRef) {}

  onHideModal(): void {
    this.hideModal.emit();
    this.modalRef.hide();
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
