import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {
  EBotherAdvanceBasicFilter,
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {IDateRange} from '@app/types/viewmodels';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {Subject, takeUntil} from 'rxjs';
import {CustomDatePickerComponent} from '@app/share/custom/custom-date-picker/custom-date-picker.component';
import {specialQueryTaskKeys} from '@main/dashboard/dashboard-variables';

@Component({
  selector: 'app-filter-top-table',
  standalone: true,
  imports: [
    CommonModule,
    PopoverModule,
    CustomInputSearchComponent,
    CustomSelectSearchComponent,
    CustomDatePickerComponent,
  ],
  templateUrl: './filter-top-table.component.html',
  styleUrls: ['./filter-top-table.component.scss'],
})
export class FilterTopTableComponent implements OnInit, OnDestroy {
  @ViewChild('popFilter') popFilter?: any;

  @Output() pickerDateEvent = new EventEmitter<{
    value: IDateRange | Date;
    name: string;
  }>();
  @Output() searchEvent = new EventEmitter<{term: string; name: string}>();
  @Output() popoverEvent = new EventEmitter<{value: string; name: string}>();
  @Output() selectEvent = new EventEmitter<{value?: string; name: string}>();
  @Output() scrollToEndEvent = new EventEmitter<string>();
  @Output() clickButtonEvent = new EventEmitter<string>();
  @Output() toggleButtonEvent = new EventEmitter<{
    value: boolean;
    name?: string;
  }>();

  @Input() configFilters: IFilterTopTable[] = [];
  @Input() configButtons: IFilterTopButton[] = [];

  configFilterAdvance: IFilterTopTable[] = [];
  configFilterBasic: IFilterTopTable[] = [];
  onSearchingAdvance: string[] = [];
  private destroy$ = new Subject();

  protected readonly ETypeFilter = ETypeFilter;
  protected readonly ETypeButton = ETypeButton;
  constructor(private readonly autoTaskService: AutoTaskService) {
    this.autoTaskService.currentActiveViewMode
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentActiveViewMode) => {
        this.onSearchingAdvance = [];
        if (this.popFilter) {
          this.popFilter.hide();
        }
        Object.keys(currentActiveViewMode?.options || {}).forEach(
          (key: any) => {
            if (this.configFilterAdvance.some((cA) => cA.name === key)) {
              this.onSearchingAdvance.push(key);
            } else if (specialQueryTaskKeys.includes(key)) {
              this.onSearchingAdvance.push(key);
            }
          },
        );
      });
  }

  ngOnInit() {
    this.configFilterAdvance = this.configFilters.filter(
      (item) => item.botherType === EBotherAdvanceBasicFilter.ADVANCE,
    );
    this.configFilterBasic = this.configFilters.filter(
      (item) => item.botherType !== EBotherAdvanceBasicFilter.ADVANCE,
    );
  }

  getDefaultValuePopover(name?: string) {
    const filter = this.configFilters.find((item) => item.name === name);
    return filter?.options?.find((item) => filter.value === item['value'])?.[
      'label'
    ];
  }

  handleOpenPopover(event: any) {
    // this.filteredTabs = this.tabs;
  }

  onSearch(term: string, name: string = 'search') {
    this.searchEvent.emit({term, name});
  }

  onPickerDate(value: any, name: string = 'date') {
    this.pickerDateEvent.emit({value, name});
  }

  onSelectValue(value?: string, name: string = 'select') {
    this.selectEvent.emit({value, name});
  }

  onPopoverValue(value: any, name: string = 'popover') {
    this.popoverEvent.emit({value, name});
  }

  handleSearchingView(value: any, name: string) {
    // console.log(value, name);
    // if (isEmpty(value)) {
    //   this.onSearchingAdvance = this.onSearchingAdvance.filter(
    //     (item) => item !== name,
    //   );
    // } else {
    //   this.onSearchingAdvance.indexOf(name) === -1
    //     ? this.onSearchingAdvance.push(name)
    //     : null;
    // }
    // setTimeout(() => {
    // console.log(this.onSearchingAdvance);
    // }, 200);
  }

  onSearchAdvance(term: string, name: string = 'search') {
    this.handleSearchingView(term, name);
    this.searchEvent.emit({term, name});
  }

  onPickerDateAdvance(
    value: IDateRange | Date,
    name: string = 'date',
    subType: string,
  ) {
    // const valueHandleView: any = cloneDeep(value);
    // if (subType === 'range') {
    //   if (!valueHandleView?.fromDate && !valueHandleView?.toDate) {
    //     this.handleSearchingView(undefined, name);
    //     this.pickerDateEvent.emit({value, name});
    //     return;
    //   }
    // }
    this.handleSearchingView(value, name);
    this.pickerDateEvent.emit({value, name});
  }

  onSelectValueAdvance(value?: string, name: string = 'select') {
    this.handleSearchingView(value, name);
    this.selectEvent.emit({value, name});
  }

  onClick(name: string) {
    this.clickButtonEvent.emit(name);
  }

  handleToggleAction(event: any, name?: string) {
    const checked = !!event.target?.checked;
    this.toggleButtonEvent.emit({value: checked, name});
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
