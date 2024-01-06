import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import {IChangePage, IMetaData, ITypePaginate} from '@app/types/viewmodels';
import {CommonModule} from '@angular/common';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {FormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';

@Component({
  selector: 'custom-pagination',
  templateUrl: './custom-pagination.component.html',
  styleUrls: ['./custom-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, PaginationModule, FormsModule, NgSelectModule],
})
export class CustomPaginationComponent implements OnInit, OnChanges {
  @Input() metaData: IMetaData = {
    total: 0,
    countRows: 0,
  };
  @Input() total: number = 0;
  @Input() type: ITypePaginate = 'number';
  @Input() selectedSize = 20;
  @Input() currentPage = 1;
  @Input() optionSize = [10, 20, 50, 100];
  @Output() changePageEvent = new EventEmitter<{page: number; limit: number}>();
  @Output() changePageLazyEvent = new EventEmitter<IChangePage>();
  public dataInfo = {
    ...this.metaData,
    start: 0,
    end: 0,
  };

  constructor() {}

  ngOnChanges(changes: any) {}

  ngOnInit(): void {}

  calculateInfo() {
    const start = this.selectedSize * (this.currentPage - 1) + 1;
    const end = this.metaData?.countRows
      ? start + this.metaData?.countRows - 1
      : this.selectedSize * this.currentPage;
    this.dataInfo = {start, end, ...this.metaData};
  }

  pageChanged(event: {page?: number; itemsPerPage?: number}, limit: any): void {
    if (event.page) {
      this.currentPage = event.page;
    }
    if (limit?.target?.value) {
      this.selectedSize = Number(limit?.target?.value || 20);
    }
    this.changePageEvent.emit({
      page: this.currentPage,
      limit: this.selectedSize,
    });
  }

  changePageLazy(value: IChangePage): void {
    this.changePageLazyEvent.emit(value);
  }
}
