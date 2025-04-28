import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FallbackImageModule} from '@share/directive/fallback-image/fallback-image.module';
import {NgSelectComponent, NgSelectModule} from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  takeUntil,
} from 'rxjs';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {CustomerService} from '@app/services/api/customer.service';
import {CommonService} from '@app/services/common/common.service';
import {Customer} from '@app/types/customer';

@Component({
  selector: 'app-input-suggest-customer',
  templateUrl: './input-suggest-customer.component.html',
  styleUrls: ['./input-suggest-customer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FallbackImageModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InputSuggestCustomerComponent,
    },
  ],
})
export class InputSuggestCustomerComponent
  implements OnDestroy, OnInit, ControlValueAccessor
{
  @ViewChild(NgSelectComponent) select!: NgSelectComponent;

  @Input() uiType: 'search' | 'text' = 'text';
  @Input() submitted: boolean = false;
  @Input() value: string | undefined = undefined;
  @Input() inputId: string = '';
  @Input() placeholder: string = 'Text...';
  @Input() className?: string = '';
  @Output() valueChange: EventEmitter<string | undefined> = new EventEmitter();
  @Output() selectCustomer: EventEmitter<Customer | undefined> =
    new EventEmitter();

  private destroy$ = new Subject();

  protected input$ = new Subject<string>();
  public trigger = {
    name: false,
    phone: false,
    email: false,
  };
  public customers: ICommonDataLazy<Customer, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
      timeout: 300,
      debounce: 600,
    },
    isAllowLoadMore: false,
  };
  public selectedCustomer: Customer | undefined = undefined;

  // for FormControl
  onChange = (value: string) => {};
  touched: boolean = false;
  disabled: boolean = false;
  onTouched: (() => {}) | undefined;
  // End: for FormControl

  constructor(
    private readonly customerService: CustomerService,
    private readonly commonService: CommonService,
  ) {}

  ngOnInit() {
    this.input$
      .pipe(debounceTime(600), distinctUntilChanged())
      .subscribe((data) => {
        this.customers.paramsQuery = {
          ...this.customers.paramsQuery,
          q: data,
        };
        this.getListCustomer(true, true);
      });
  }

  getListCustomer(isInit: boolean = false, isSearching: boolean = false) {
    try {
      this.customers.loading = true;
      const ids: string[] = [];
      const query = {
        ...this.customers.paramsQuery,
        ...(isInit && ids.length && {ids: ids}),
      };
      if (isSearching) {
        this.customers.paramsQuery.page = 1;
        this.customers.rows = [];
      }

      this.customerService.customer
        .get(query)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.customers.loading = false)),
        )
        .subscribe({
          next: (res) => {
            if (res && res.status === 200) {
              this.customers.rows = res.data;
            } else {
              this.commonService.handleResErr(res);
            }
          },
          error: (err) => {
            this.commonService.handleErr(err);
          },
        });
    } catch (e) {
      console.log(e);
    }
  }

  handleBlur($event: any) {}

  handleChooseCustomer(customer: Customer) {
    this.select.handleClearClick();
    this.trigger.name = false;
    this.selectCustomer.emit(customer);
  }

  onSearch(event?: any) {
    const value = event?.target?.value;
    this.trigger.name = true;
    this.valueChange.next(value);
    this.onChange(value);
    this.input$.next(value);
  }

  trackByFn(item: Customer) {
    return item.id;
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  // for FormControl
  writeValue(value: string) {
    this.value = value;
  }
  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }
  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }
  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }
  // End: for FormControl

  clickLoadData() {
    if (!this.customers.rows.length) {
      this.customers.paramsQuery.page = 1;
      this.getListCustomer(true, true);
    }
  }

  scrollLoadData(event: {start: number; end: number}) {
    if (
      !this.customers.loading &&
      event.end + 4 >
        this.customers.paramsQuery.limit! * this.customers.paramsQuery.page!
    ) {
      this.customers.paramsQuery.page! += 1;
      this.getListCustomer();
    }
  }
  searchFn(event: {term: string}) {
    clearTimeout(this.customers.paramsQuery['timeout']);
    this.customers.paramsQuery['timeout'] = setTimeout(() => {
      this.customers.paramsQuery.q = event.term;
      this.getListCustomer(false, true);
    }, this.customers.paramsQuery['debounce']);
  }
}
