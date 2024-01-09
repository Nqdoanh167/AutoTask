import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';

@Component({
  selector: 'app-filter-top-table',
  standalone: true,
  imports: [
    CommonModule,
    CustomInputSearchComponent,
    CustomSelectSearchComponent,
  ],
  templateUrl: './filter-top-table.component.html',
  styleUrls: ['./filter-top-table.component.scss'],
})
export class FilterTopTableComponent {
  @Output() searchEvent = new EventEmitter<{term: string; name: string}>();
  @Output() selectEvent = new EventEmitter<{value?: string; name: string}>();
  @Output() clickButtonEvent = new EventEmitter<string>();

  @Input() configFilters: IFilterTopTable[] = [];
  @Input() configButtons: IFilterTopButton[] = [];

  protected readonly ETypeFilter = ETypeFilter;
  protected readonly ETypeButton = ETypeButton;
  constructor() {}
  onSearch(term: string, name: string = 'search') {
    this.searchEvent.emit({term, name});
  }

  onSelectValue(value?: string, name: string = 'select') {
    this.selectEvent.emit({value, name});
  }

  onClick(name: string) {
    this.clickButtonEvent.emit(name);
  }
}
