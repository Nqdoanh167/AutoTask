import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ICommonDataSource, IPageChange} from '@app/types/viewmodels';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ConvertTypeModule} from '@share/pipe/convertType/convertType.module';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IFilterTopButton, IFilterTopTable} from '@app/types/common';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-standard-data-size',
  standalone: true,
  imports: [
    FilterTopTableComponent,
    ConvertTypeModule,
    PaginationModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './standard-data-size.component.html',
  styleUrl: './standard-data-size.component.scss',
})
export class StandardDataSizeComponent<T, K extends any> {
  @Input() isHidePaginate: boolean = false;
  @Input() isHideFilter: boolean = false;
  @Input() configFilters: IFilterTopTable[] = [];
  @Input() configButtons: IFilterTopButton[] = [];
  @Input() item: ICommonDataSource<T, K | any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      limit: 20,
      page: 1,
      q: '',
      sort: '-createdAt',
    },
    total: 0,
  };

  @Output() searchEvent = new EventEmitter<{term: string; name: string}>();
  @Output() pageChangeEvent = new EventEmitter<IPageChange>();
  @Output() selectFilterEvent = new EventEmitter<{
    value?: string;
    name: string;
  }>();
  @Output() actionEvent = new EventEmitter<string>();

  constructor() {}

  handleAction(name: string) {
    this.actionEvent.emit(name);
  }

  getDataSource(isReset?: boolean) {}

  onSearch(value: {term: string; name: string}) {
    this.searchEvent.emit(value);
  }

  pageChanged(event: {page?: number; itemsPerPage?: number}, limit: any): void {
    this.pageChangeEvent.emit({event, limit});
  }

  onSelectFilter(data: {value?: string; name: string}) {
    this.selectFilterEvent.emit(data);
  }
}
