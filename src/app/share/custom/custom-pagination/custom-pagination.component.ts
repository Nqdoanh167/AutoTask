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
  @Input() type: ITypePaginate = 'number';
  @Input() selectedSize = 10;
  @Input() optionSize = [10, 20, 50];
  @Output() changePageSizeEvent = new EventEmitter<number>();
  @Output() changePageEvent = new EventEmitter<number>();
  @Output() changePageLazyEvent = new EventEmitter<IChangePage>();
  public dataInfo = {
    ...this.metaData,
    start: 0,
    end: 0,
  };

  public currentPage = 1;

  changePageSize(value: number) {
    this.changePageSizeEvent.emit(value);
  }

  constructor() {}

  calculateInfo() {
    const start = this.selectedSize * (this.currentPage - 1) + 1;
    const end = this.metaData?.countRows
      ? start + this.metaData?.countRows - 1
      : this.selectedSize * this.currentPage;
    this.dataInfo = {start, end, ...this.metaData};
  }

  ngOnChanges(changes: any) {
    this.dataInfo = {...this.dataInfo, ...changes.metaData.currentValue};
    this.calculateInfo();
  }

  ngOnInit(): void {
    this.calculateInfo();
  }

  onChangePage(event: any) {
    // console.log("-> event", event);
    // this.currentPage = event.page;
    this.changePageEvent.emit(event.page);
  }

  changePageLazy(value: IChangePage): void {
    this.changePageLazyEvent.emit(value);
  }
}
