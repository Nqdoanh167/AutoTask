import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import {IChangePage, ITypePaginate} from '@app/types/viewmodels';
import {CommonModule} from '@angular/common';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {FormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@Component({
  selector: 'custom-pagination',
  templateUrl: './custom-pagination.component.html',
  styleUrls: ['./custom-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, PaginationModule, FormsModule, NgSelectModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomPaginationComponent implements OnInit, OnChanges {
  @Input() metaData: any = {
    total: 0,
    countRows: 0,
  };
  @Input() total: number = 0;
  @Input('showConfig') showConfig = true;
  @Input() type: ITypePaginate = 'number';
  @Input() selectedSize = 20;
  @Input() currentPage = 1;
  @Input() maxSize = 3;
  @Input() optionSize = [10, 20, 50, 100];
  @Output() changePageEvent = new EventEmitter<{page: number; limit: number}>();
  @Output() changePageLazyEvent = new EventEmitter<IChangePage>();
  @Input() maxRecords: number = 10000; // Giới hạn tối đa của Elasticsearch
  public dataInfo = {
    ...this.metaData,
    start: 0,
    end: 0,
  };

  constructor(private readonly cdr: ChangeDetectorRef) {}
  public Math = Math;

  ngOnChanges(changes: any) {
    // this.cdr.detectChanges();
  }

  ngOnInit(): void {}

  get maxAllowedPage(): number {
    return Math.floor(this.maxRecords / this.selectedSize);
  }
  
  get shouldUseLazyMode(): boolean {
    return this.type === 'lazy' || this.currentPage >= this.maxAllowedPage;
  }
  
  get canGoNext(): boolean {
    return this.total > this.selectedSize * this.currentPage
  }
  
  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  calculateInfo() {
    const start = this.selectedSize * (this.currentPage - 1) + 1;
    const end = this.metaData?.countRows
      ? start + this.metaData?.countRows - 1
      : this.selectedSize * this.currentPage;
    this.dataInfo = {start, end, ...this.metaData};
  }

  pageChanged(
    event: {page?: number; itemsPerPage?: number},
    limit: number | null,
  ): void {
    try {
      if (event.page && !limit && event.page !== this.currentPage) {
        this.changePageEvent.emit({
          page: event.page,
          limit: this.selectedSize,
        });
      }
      if (limit && !event.page) {
        this.changePageEvent.emit({
          page: 1,
          limit: limit,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  changePageLazy(value: IChangePage): void {
    this.changePageLazyEvent.emit(value);
  }

  
}
