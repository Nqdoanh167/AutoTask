import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomInputSearchComponent } from '@share/custom/custom-input-search/custom-input-search.component';
import {
  EBotherAdvanceBasicFilter,
  ETypeButton,
  ETypeFilter,
  IFilterTopTable,
} from '@app/types/common';
import { CustomSelectSearchComponent } from '@share/custom/custom-select-search/custom-select-search.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { IDateRange } from '@app/types/viewmodels';
import { takeUntil } from 'rxjs';
import { CustomDatePickerComponent } from '@app/share/custom/custom-date-picker/custom-date-picker.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DashboardCheckPermission } from '@app/main/dashboard/dashboard-check-permission';
import { cloneDeep, isEqual } from 'lodash';
import moment from 'moment';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';
import { FilterDataModule } from '@app/share/pipe/filter-data/filter-data.module';

@Component({
  selector: 'app-filter-advance',
  standalone: true,
  imports: [
    CommonModule,
    PopoverModule,
    CustomInputSearchComponent,
    CustomSelectSearchComponent,
    CustomDatePickerComponent,
    TooltipModule,
    NgSelectModule,
    FormsModule,
    TooltipModule,
    TreeSelectModule,
    FilterDataModule
  ],
  templateUrl: './filter-advance.component.html',
  styleUrls: ['./filter-advance.component.scss'],
})
export class FilterAdvanceComponent
  extends DashboardCheckPermission
  implements OnInit, OnDestroy {
  @ViewChild('popFilter') popFilter?: any;
  @Output() clickButtonEvent = new EventEmitter<string>();
  @Output() toggleButtonEvent = new EventEmitter<{
    value: boolean;
    name?: string;
  }>();
  @Output() popoverEvent = new EventEmitter<{value: string; name: string}>();
  @Output() filterAdvanceEvent = new EventEmitter<any>()
  @Output() scrollToEndEvent = new EventEmitter<any>();
  @Output() searchEvent = new EventEmitter<{ term: string; name: string }>();

  public paramsQuery: any = {
    sort: '-createdAt',
    q: '',
  };

  configFilterAdvance: IFilterTopTable[] = [];
  _configFilterAdvanceCopy: IFilterTopTable[] = [];
  configFilterBasic: IFilterTopTable[] = [];
  onSearchingAdvance: string[] = [];

  public cdtList: { key: string; label: string; value: string | string[] }[] = [];

  protected readonly ETypeFilter = ETypeFilter;
  protected readonly ETypeButton = ETypeButton;
  constructor() {
    super();

    this.autoTaskService.currentActiveViewMode
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentActiveViewMode) => {
        this.currentActiveViewMode = currentActiveViewMode;
        this.onSearchingAdvance = [];
        if (this.popFilter) {
          this.popFilter.hide();
        }
        Object.keys(currentActiveViewMode?.options || {}).forEach(
          (key: any) => {
            if (this.configFilterAdvance.some((cA) => cA.name === key)) {
              this.onSearchingAdvance.push(key);
            }
          },
        );
      });
  }

  override ngOnInit() {
    this.configFilterAdvance = this.configFilters.filter(
      (item) => item.botherType === EBotherAdvanceBasicFilter.ADVANCE,
    );
    this._configFilterAdvanceCopy = cloneDeep(this.configFilterAdvance);
    this.configFilterBasic = this.configFilters.filter(
      (item) => item.botherType !== EBotherAdvanceBasicFilter.ADVANCE,
    );
  }

  getUsedConditionKeys = (): string[] => {
    return this.cdtList
      .filter(item => item.key && item.key.trim() !== '')
      .map(item => item.key);
  }

  getDefaultValuePopover(name?: string) {
    const filter = this.configFilters.find((item) => item.name === name);
    return filter?.options?.find((item) => filter.value === item['value'])?.[
      'label'
    ];
  }

  getActionResultValue(cdt: any, field: 'type' | 'actionId' | 'resultId') {
    if (!cdt.value || typeof cdt.value !== 'object') {
      return null;
    }
    return cdt.value[field] || null;
  }

  handleOpenPopover() {
    this.handleActiveViewMode();
    this.cdtList = this.configFilterAdvance
      .filter((item) => item.value)
      .map((item) => ({
        key: item.name!,
        label: item.placeholder!,
        value: item.value || '',
      }));
  }

  onChangeValueActionResult(cdt: any, field: 'actionId' | 'resultId' | 'type', value: any) {
    if (!cdt.value || typeof cdt.value !== 'object') {
      cdt.value = {};
    }
    
    cdt.value[field] = value;
    
    if (field === 'actionId') {
      cdt.value.resultId = null;
      cdt.value.type = null;
    } else if (field === 'resultId') {
      cdt.value.type = null;
    }
  }

  onSearchValue(term: string, name: string = 'search') {
    this.searchEvent.emit({ term, name });
  }

  onPickerDate(value: any, name: string = 'date') {
    try {
      const filter = this.paramsQuery?.filter || '{}';
      let obj = JSON.parse(filter);
      const hValue = value as IDateRange;
      if (name === name) {
        if (hValue?.fromDate && hValue?.toDate) {
          obj[name] = [
            moment(hValue.fromDate).startOf('day').toISOString(),
            moment(hValue.toDate).endOf('day').toISOString(),
          ];
        } else {
          delete obj[name];
        }

        this.paramsQuery.filter = JSON.stringify(obj);

        if (
          !isEqual(obj?.[name], this.currentActiveViewMode?.options?.[name])
        ) {
          return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  onSelectValue(value?: string, name: string = 'select') {
    if (name !== 'sort') {
      const filter = this.paramsQuery.filter || '{}';
      let obj = JSON.parse(filter);
      if (Array.isArray(value) && value.length > 0) {
        obj[name] = value;
      } else if (
        typeof value === 'string' &&
        (!!value || Number(value) === 0)
      ) {
        obj[name] = value;
      } else {
        delete obj[name];
        if (name === 'chainActIds') {
          const configFilterAction = this.configFilters.find(
            (filter) => filter.name === 'actionIds',
          );
          if (configFilterAction) {
            configFilterAction.options = this.actions.rows;
          }
        }
      }
      this.paramsQuery.filter = JSON.stringify(obj);
    } else {
      if (value) {
        this.paramsQuery.sort = value;
      } else {
        delete this.paramsQuery.sort;
      }
      if (value !== this.currentActiveViewMode?.options?.sort) {
      }
    }
  }

  onPopoverValue(value: any, name: string = 'popover') {
    this.popoverEvent.emit({value, name});
  }

  onPickerDateAdvance(value: IDateRange | Date, cdt: any) {
    try {
      const hValue = value as IDateRange;
      if (hValue?.fromDate && hValue?.toDate) {
        cdt.value = [
          moment(hValue.fromDate).startOf('day').toISOString(),
          moment(hValue.toDate).endOf('day').toISOString(),
        ];
      } else {
        delete cdt.value;
      }
    } catch (e) {
      console.log(e);
    }
  }

  onClick(name: string) {
    this.clickButtonEvent.emit(name);
  }

  handleToggleAction(event: any, name?: string) {
    const checked = !!event.target?.checked;
    this.toggleButtonEvent.emit({ value: checked, name });
  }

  handleApply() {
    const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');

    this.configFilterAdvance.forEach((configFilter) => {
      const cdt = this.cdtList.find((item) => item.key === configFilter.name);
      if (cdt && cdt.value) {
        objFilterQuery[configFilter.name!] = cdt.value;
      } else delete objFilterQuery[configFilter.name!];
    });

    if(objFilterQuery['action_result'] ) {
      if(!objFilterQuery['action_result']?.actionId || !objFilterQuery['action_result']?.resultId || !objFilterQuery['action_result']?.type) {
        return
      }
    }

    this.paramsQuery.filter = JSON.stringify(objFilterQuery);
    this.filterAdvanceEvent.emit(JSON.parse(this.paramsQuery.filter || '{}'));
    this.popFilter.hide();
  }

  reset() {
    // this.handleOpenPopover();
    this.paramsQuery.filter = '{}';
    this.cdtList = [];
  }

  addFilterCondition() {
    for (const filter of this._configFilterAdvanceCopy) {
      if (!this.cdtList.some((item) => item.key === filter.name)) {
        if (filter) {
          this.cdtList.push({
            key: filter.name!,
            label: filter.placeholder!,
            value: '',
          });
          return;
        }
      }
    }
  }

  removeFilterCondition(cdtKey: string) {
    this.cdtList = this.cdtList.filter((item) => item.key !== cdtKey);
  }

  getCdtLabel(key: string) {
    const filter = this._configFilterAdvanceCopy.find((item) => item.name === key);
    return filter ? filter.placeholder : key;
  }


  handleActiveViewMode() {
    try {
      this.paramsQuery.filter = '{}';
      const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');

      Object.keys(this.currentActiveViewMode?.options || {}).forEach((key) => {
        if (this.currentActiveViewMode?.options[key]) {
          objFilterQuery[key] = this.currentActiveViewMode?.options[key];
        }
      });

      this.configFilters.forEach((configFilter) => {
        if (
          configFilter.type === ETypeFilter.SELECT ||
          configFilter.type === ETypeFilter.POPOVER ||
          configFilter.type === ETypeFilter.DATE || 
          configFilter.type === ETypeFilter.SEARCH
        ) {
          if (!!this.currentActiveViewMode?.options[configFilter.name!]) {
            if (
              !configFilter?.options?.length ||
              (configFilter?.options?.length === 1 &&
                configFilter.name === 'chainActId')
            ) {
              this.loadData(configFilter);
            }
          }
          if (configFilter.name === 'sort') {
            configFilter.value =
              this.currentActiveViewMode?.options[configFilter.name!] ||
              '-createdAt';
            this.paramsQuery.sort =
              this.currentActiveViewMode?.options[configFilter.name!] ||
              ('-createdAt' as string);
          } else {
            configFilter.value =
              this.currentActiveViewMode?.options[configFilter.name!];
            objFilterQuery[configFilter.name!] = configFilter.value;
          }
        }

        if (configFilter.type === ETypeFilter.ACTION_RESULT) {
          if(this.currentActiveViewMode?.options[configFilter.name!]?.actionId){
            this.clickLoadData('actions')
          }
          if(this.currentActiveViewMode?.options[configFilter.name!]?.resultId){
            this.clickLoadData('results')
          }
          configFilter.value =
            this.currentActiveViewMode?.options[configFilter.name!];
          objFilterQuery[configFilter.name!] = configFilter.value;
        }
      });

      this.configButtons.forEach((configButton) => {
        if (configButton.type === ETypeButton.TOGGLE) {
          configButton.value =
            this.currentActiveViewMode?.options[configButton.name!];
          objFilterQuery[configButton.name!] = configButton.value;
        }

        if (configButton.type === ETypeButton.DEFAULT) {
          configButton.isActive =
            this.currentActiveViewMode?.options[configButton.name!];
          objFilterQuery[configButton.name!] = configButton.isActive;
        }
      });

      this.paramsQuery.filter = JSON.stringify(objFilterQuery);
    } catch (e) {
      console.log(e);
    }
  }

  loadData(filter: IFilterTopTable) {
    if (!filter.options?.length) {
      filter.loading = true;
      if (filter.name === 'tags') {
        this.getTag();
      } else if (filter.name === 'actionIds') {
        this.getAction();
      } else if (filter.name === 'resultIds') {
        this.getResult();
      } else if (filter.name === 'teamRoles' || filter.name === 'unassignedRoleId') {
        this.getRole();
      }
    }

    if (filter.name === 'chainActId' && filter.options?.length === 1) {
      filter.loading = true;
      this.getActionChain();
    }

    setTimeout(() => {
      filter.loading = false;
    }, 100);
  }

}
