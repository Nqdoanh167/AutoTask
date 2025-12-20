import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {debounceTime, Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'custom-input-search',
  template: `
    <div
      class="custom-input-search d-flex align-items-center {{ className }}"
      [ngClass]="{collapsed: isCollapsible && isCollapsed}"
      (click)="onContainerClick()"
    >
      <i class="fa-solid fa-magnifying-glass"></i>
      <input
        #searchInput
        type="text"
        class="form-control {{ className }}"
        id="search-text"
        [(ngModel)]="searchText"
        [placeholder]="placeholder"
        (ngModelChange)="this.searchTextUpdate.next($event)"
        (focus)="onFocus()"
        (blur)="onBlur($event)"
        (keydown.enter)="$event.preventDefault()"
        [ngClass]="{'d-none': isCollapsible && isCollapsed}"
      />
    </div>
  `,
  styleUrls: ['./custom-input-search.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CustomInputSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  public searchText = '';
  @Output() searchEvent = new EventEmitter<string>();
  @Output() focusInputEvent = new EventEmitter<any>();
  @Output() blurInputEvent = new EventEmitter<any>();
  @Input() placeholder = 'Search...';
  @Input() className?: string;
  @Input() isCollapsible = false;
  public searchTextUpdate = new Subject<string>();
  public isCollapsed = true;

  constructor() {
    this.searchTextUpdate
      .pipe(debounceTime(600), distinctUntilChanged())
      .subscribe((value) => {
        this.searchText = value;
        this.searchEvent.emit(value);
      });
  }

  ngOnInit(): void {}

  onFocus() {
    this.focusInputEvent.emit();
  }

  onBlur(e: any) {
    this.blurInputEvent.emit(e);
    if (this.isCollapsible && !this.searchText) {
      setTimeout(() => {
        this.isCollapsed = true;
      }, 200);
    }
  }

  onContainerClick() {
    if (this.isCollapsible && this.isCollapsed) {
      this.isCollapsed = false;
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      }, 0);
    }
  }
}
