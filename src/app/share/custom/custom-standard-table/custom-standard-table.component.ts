import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IColumnStandard, IPaginationStandard} from '@app/types/viewmodels';

@Component({
  selector: 'app-custom-standard-table',
  templateUrl: './custom-standard-table.component.html',
  styleUrls: ['./custom-standard-table.component.scss'],
  standalone: true,
  imports: [CommonModule, PaginationModule, ReactiveFormsModule, FormsModule],
})
export class CustomStandardTableComponent implements OnInit {
  @Input() keyTranslate: string = '';
  @Input() loading: boolean = false;
  @Input() columns: IColumnStandard<any>[] = [];
  @Input() dataSource: any[] = [];
  @Input() pagination: IPaginationStandard = {
    page: 1,
    total: 2,
    limit: 10,
    current: 1,
    pageSize: 10,
  };

  @Output() pageChangeEvent = new EventEmitter<IPaginationStandard>();

  constructor() {}

  ngOnInit(): void {}

  pageChanged(event: {page?: number; itemsPerPage?: number}, limit: any): void {
    if (event.page) {
      this.pagination = {...this.pagination, page: event.page};
    }
    if (limit?.target?.value) {
      this.pagination = {
        ...this.pagination,
        limit: Number(limit?.target?.value || 10),
        page: 1,
      };
    }
    this.pageChangeEvent.emit(this.pagination);
  }

  getValueFromDataIndex(row: any, dataIndex: string): any {
    // Split the dataIndex into individual keys
    const keys = dataIndex.split('.');

    // Access the nested properties one by one
    let value = row;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        break;
      }
    }

    return value;
  }
}
