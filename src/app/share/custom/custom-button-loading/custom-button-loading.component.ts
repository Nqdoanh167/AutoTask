import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'custom-button-loading',
  template: `
    <button
      (click)="onAction()"
      [type]="type"
      class="d-flex align-items-center input-size-sm {{ className }}"
      [ngClass]="{loading: isLoading}"
      [disabled]="isDisabled"
    >
      <span
        *ngIf="isLoading"
        class="spinner-border spinner-border-sm me-2"
        role="status"
        aria-hidden="true"
      ></span>
      <span>{{ textButton }}</span>
    </button>
  `,
  styleUrls: ['./custom-button-loading.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class CustomButtonLoadingComponent implements OnInit {
  @Input() isLoading = false;
  @Input() isDisabled = false;
  @Input() type = 'button';
  @Input() textButton = 'Save';
  @Input() className?: string;
  @Output() action = new EventEmitter<Event>();

  constructor() {}

  ngOnInit(): void {}

  onAction() {
    this.action.emit();
  }
}
