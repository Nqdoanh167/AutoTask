import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {NgForOf} from '@angular/common';
import {TabsModule} from 'ngx-bootstrap/tabs';

@Component({
  selector: 'app-custom-tab-set',
  standalone: true,
  imports: [NgForOf, TabsModule],
  templateUrl: './custom-tab-set.component.html',
  styleUrl: './custom-tab-set.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabSetComponent<T extends any> implements OnInit, OnChanges {
  @Input() tabs: ({label: string; value: T} | any)[] = [];
  @Input() activeTab?: T;
  @Output() activeTabChange = new EventEmitter<T>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('thang ne', this.tabs);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.cdr.detectChanges();
  }

  selectTab(tab: T) {
    this.activeTab = tab;
    this.activeTabChange.emit(tab);
  }
}
