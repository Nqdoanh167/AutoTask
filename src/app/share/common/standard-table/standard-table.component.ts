import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {ICommonDataSource, IPageChange} from '@app/types/viewmodels';
import {sortBy, sortIcon} from '@app/utils/common';
import {FilterTopTableComponent} from '@share/common/filter-top-table/filter-top-table.component';
import {ConvertTypeModule} from '@share/pipe/convertType/convertType.module';
import {PaginationModule} from 'ngx-bootstrap/pagination';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IFilterTopButton, IFilterTopTable} from '@app/types/common';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-standard-table',
  standalone: true,
  imports: [
    FilterTopTableComponent,
    ConvertTypeModule,
    PaginationModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './standard-table.component.html',
  styleUrl: './standard-table.component.scss',
})
export class StandardTableComponent<T, K extends any> implements OnInit {
  @Input() isHidePaginate: boolean = false;
  @Input() isHideFilter: boolean = false;

  protected readonly cdr = inject(ChangeDetectorRef);

  protected sortProperty: string = 'createdAt';
  protected sortOrder = 1;

  public configFilters: IFilterTopTable[] = [];
  public configButtons: IFilterTopButton[] = [];

  public item: ICommonDataSource<T, K | any> = {
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

  constructor() {}

  ngOnInit() {
    this.getDataSource();
  }

  handleAction(name: string) {}

  getDataSource(isReset?: boolean) {}

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.item.paramsQuery.q = term;
    this.getDataSource(true);
  }

  sortBy(property: string): void {
    const {sortProperty, sortOrder, sortQuery} = sortBy(
      this.sortOrder,
      this.sortProperty,
      property,
    );
    [this.sortProperty, this.sortOrder] = [sortProperty, sortOrder];
    this.item.paramsQuery = {
      ...this.item.paramsQuery,
      sort: sortQuery ? sortQuery : undefined,
    };
    this.getDataSource(true);
  }

  sortIcon(property: string) {
    return sortIcon(property, this.sortProperty, this.sortOrder);
  }

  pageChanged(data: IPageChange): void {
    const {event, limit} = data;
    if (event.page) {
      this.item.paramsQuery = {...this.item.paramsQuery, page: event.page};
    }
    if (limit?.target?.value) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        limit: Number(limit?.target?.value || 10),
        page: 1,
      };
    }
    this.getDataSource();
  }

  onSelectFilter(data: {value?: string; name: string}) {
    try {
      const {value, name} = data;
      const filter = this.item.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      if (!value?.length) {
        delete obj[name];
      } else {
        if (value || Number(value) === 0) {
          obj[name] = value;
        } else {
          delete obj[name];
        }
      }
      this.item.paramsQuery.filter = JSON.stringify(obj);
      this.getDataSource(true);
    } catch (e) {
      console.log(e);
    }
  }
}
