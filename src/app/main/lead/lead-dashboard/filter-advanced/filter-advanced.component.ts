import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {LeadDashboardData} from '../lead-dashboard-data';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';
import {IDateRange} from '@app/types/viewmodels';
import {cloneDeep, isEmpty} from 'lodash';
import moment from 'moment';

@Component({
  selector: 'app-filter-advanced',
  templateUrl: './filter-advanced.component.html',
  styleUrls: ['./filter-advanced.component.scss'],
})
export class FilterAdvancedComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild('popFilter') popFilter?: any;
  @Output() filterAdvanceEvent = new EventEmitter<any>();
  @Output() scrollToEndEvent = new EventEmitter<any>();

  protected readonly ETypeFilter = ETypeFilter;

  private _configCopy: IFilterTopTable[] = [];
  public conditionChoosen: {
    key: string;
    label: string;
    value: any;
    options: IFilterTopTable[];
  }[] = [];
  public cdtAppliedSet: Set<string> = new Set();

  constructor() {
    super();
  }

  override ngOnInit() {
    this._configCopy = cloneDeep(this.configFilters);
    this.conditionChoosen = this.configFilters
      .filter((item) => !isEmpty(item.value))
      .map((item) => ({
        key: item.name!,
        label: item.placeholder!,
        value: item.value || '',
        options: this._configCopy,
      }));
  }

  getCdtLabel(key: string): string {
    return (
      this._configCopy.find((item) => item.name === key)?.placeholder || key
    );
  }

  onChangeCondition(key: string) {
    const cdt = this.conditionChoosen.find((item) => item.key === key);
    const config = this._configCopy.find((item) => item.name === key);
    if (cdt && config) {
      cdt.value = config.value || '';
    }
  }

  onPickerDateAdvance(value: any, cdt: any) {
    const hValue = value as IDateRange;
    if (hValue?.fromDate && hValue?.toDate) {
      cdt.value = [
        moment(hValue.fromDate).startOf('day').toISOString(),
        moment(hValue.toDate).endOf('day').toISOString(),
      ];
    } else {
      delete cdt.value;
    }
  }

  addFilterCondition() {
    for (const filter of this._configCopy) {
      if (
        !filter ||
        this.conditionChoosen.some((item) => item.key === filter.name)
      )
        continue;

      this.conditionChoosen.push({
        key: filter.name!,
        label: filter.placeholder!,
        value: filter.value || '',
        options: this._configCopy,
      });
      return;
    }
  }

  removeFilterCondition(cdtKey: string) {
    this.conditionChoosen = this.conditionChoosen.filter(
      (item) => item.key !== cdtKey,
    );
  }

  reset() {
    this.conditionChoosen = [];
    this.configFilters.forEach((configFilter) => {
      configFilter.value = [];
    });
  }

  handleApply() {
    const objFilterQuery: any = {};
    this.cdtAppliedSet.clear();
    this.configFilters.forEach((configFilter) => {
      const cdt = this.conditionChoosen.find(
        (item) => item.key === configFilter.name,
      );
      if (cdt && !isEmpty(cdt.value)) {
        objFilterQuery[configFilter.name!] = cdt.value;
        configFilter.value = cdt.value;
        this.cdtAppliedSet.add(configFilter.name!);
      }
    });
    this.filterAdvanceEvent.emit(objFilterQuery);
    this.popFilter?.hide();
  }

  loadData(filter: IFilterTopTable) {
    if (!filter.options?.length) {
      filter.loading = true;
      if (filter.name === 'funnelId_in') {
        this.getFolders();
      }
      setTimeout(() => (filter.loading = false), 100);
    }
  }
}
