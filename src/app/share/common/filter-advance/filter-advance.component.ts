import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {
  EBotherAdvanceBasicFilter,
  ETypeButton,
  ETypeFilter,
  IFilterTopTable,
} from '@app/types/common';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {IDateRange} from '@app/types/viewmodels';
import {takeUntil} from 'rxjs';
import {CustomDatePickerComponent} from '@app/share/custom/custom-date-picker/custom-date-picker.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {DashboardCheckPermission} from '@app/main/dashboard/dashboard-check-permission';
import {cloneDeep, isEqual} from 'lodash';
import moment from 'moment';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule} from '@angular/forms';
import {TreeSelectModule} from 'primeng/treeselect';
import {FilterDataModule} from '@app/share/pipe/filter-data/filter-data.module';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';

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
    TreeSelectModule,
    FilterDataModule,
    BsDropdownModule,
  ],
  templateUrl: './filter-advance.component.html',
  styleUrls: ['./filter-advance.component.scss'],
})
export class FilterAdvanceComponent
  extends DashboardCheckPermission
  implements OnInit, OnDestroy
{
  @ViewChild('popFilter') popFilter?: any;
  @Output() clickButtonEvent = new EventEmitter<string>();
  @Output() toggleButtonEvent = new EventEmitter<{
    value: boolean;
    name?: string;
  }>();
  @Output() popoverEvent = new EventEmitter<{value: string; name: string}>();
  @Output() filterAdvanceEvent = new EventEmitter<any>();
  @Output() scrollToEndEvent = new EventEmitter<any>();
  @Output() searchEvent = new EventEmitter<{term: string; name: string}>();

  public paramsQuery: any = {
    sort: '-createdAt',
    q: '',
  };

  configFilterAdvance: IFilterTopTable[] = [];
  _configFilterAdvanceCopy: IFilterTopTable[] = [];
  configFilterBasic: IFilterTopTable[] = [];
  onSearchingAdvance: string[] = []; // Hiển thị các filter của bộ lọc nâng cao đang được áp dụng

  public conditionList: {key: string; label: string; value: any}[] = [];

  protected readonly ETypeFilter = ETypeFilter;
  protected readonly ETypeButton = ETypeButton;
  constructor() {
    super();
  }

  override ngOnInit() {
    this.autoTaskService.currentActiveViewMode
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentActiveViewMode) => {
        this.currentActiveViewMode = currentActiveViewMode;
        this.onSearchingAdvance = [];
        // if (this.popFilter) {
        //   this.popFilter.hide();
        // }
        this.configFilterAdvance = this.configFilters.filter(
          (item) => item.botherType === EBotherAdvanceBasicFilter.ADVANCE,
        );
        this._configFilterAdvanceCopy = cloneDeep(this.configFilterAdvance);
        this.configFilterBasic = this.configFilters.filter(
          (item) => item.botherType !== EBotherAdvanceBasicFilter.ADVANCE,
        );

        Object.keys(currentActiveViewMode?.options || {}).forEach(
          (key: any) => {
            if (this.configFilterAdvance.some((cA) => cA.name === key)) {
              this.onSearchingAdvance.push(key);
            }
          },
        );
      });
  }

  getUsedConditionKeys = (): string[] => {
    return this.conditionList
      .filter((item) => item.key && item.key.trim() !== '')
      .map((item) => item.key);
  };

  getDefaultValuePopover(name?: string) {
    const filter = this.configFilters.find((item) => item.name === name);
    return filter?.options?.find((item) => filter.value === item['value'])?.[
      'label'
    ];
  }

  getActionResultValue(cdt: any, field: 'type' | 'actionId' | 'resultId') {
    if (!cdt.value || typeof cdt.value !== 'object') {
      if (field === 'type') {
        return 'IN';
      }
      return null;
    }
    return cdt.value[field] || null;
  }

  handleOpenPopover() {
    this.handleActiveViewMode();
    this.conditionList = this.configFilterAdvance
      .filter(
        (item) => item.value || item.allowedExtraValues?.includes(item.value),
      )
      .map((item) => ({
        key: item.name!,
        label: item.placeholder!,
        value:
          item.value || item.allowedExtraValues?.includes(item.value)
            ? item.value
            : '',
      }));
  }

  onChangeValueActionResult(
    cdt: any,
    field: 'actionId' | 'resultId' | 'type',
    value: any,
  ) {
    if (!cdt.value || typeof cdt.value !== 'object') {
      cdt.value = {
        actionId: null,
        resultId: null,
        type: 'IN',
      };
    }

    cdt.value[field] = value;
  }

  onSearchValue(term: string, name: string = 'search') {
    this.searchEvent.emit({term, name});
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
    this.toggleButtonEvent.emit({value: checked, name});
  }

  handleApply() {
    const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');

    this.configFilterAdvance.forEach((configFilter) => {
      const cdt = this.conditionList.find(
        (item) => item.key === configFilter.name,
      );
      const allowedExtraValues = configFilter.allowedExtraValues || [];
      if (cdt && (cdt.value || allowedExtraValues.includes(cdt.value))) {
        objFilterQuery[configFilter.name!] = cdt.value;
      } else delete objFilterQuery[configFilter.name!];
    });

    if (objFilterQuery['actionResult']) {
      if (!objFilterQuery['actionResult']?.actionId) {
        delete objFilterQuery['actionResult'].actionId;
      }
      if (!objFilterQuery['actionResult']?.resultId) {
        delete objFilterQuery['actionResult'].resultId;
      }
      if (
        (!objFilterQuery['actionResult']?.actionId &&
          !objFilterQuery['actionResult']?.resultId) ||
        !objFilterQuery['actionResult']?.type
      ) {
        return;
      }
    }

    console.log('objFilterQuery', objFilterQuery);
    this.paramsQuery.filter = JSON.stringify(objFilterQuery);
    this.filterAdvanceEvent.emit(JSON.parse(this.paramsQuery.filter || '{}'));
    this.popFilter.hide();
  }

  reset() {
    // this.handleOpenPopover();
    this.paramsQuery.filter = '{}';
    this.conditionList = [];
  }

  addFilterCondition() {
    // Doanh code
    // for (const filter of this._configFilterAdvanceCopy) {
    //   if (!this.conditionList.some((item) => item.key === filter.name)) {
    //     if (filter) {
    //       if (filter.type === ETypeFilter.ACTION_RESULT && !filter.value) {
    //         this.conditionList.push({
    //           key: filter.name!,
    //           label: filter.placeholder!,
    //           value: {
    //             actionId: null,
    //             resultId: null,
    //             type: 'IN',
    //           },
    //         });
    //        return
    //       }
    //       this.conditionList.push({
    //         key: filter.name!,
    //         label: filter.placeholder!,
    //         value: '',
    //       });
    //       return;
    //     }
    //   }
    // }

    for (const filter of this._configFilterAdvanceCopy) {
      // Maybe undef
      if (!filter) continue;

      // Already added
      if (this.conditionList.some((item) => item.key === filter.name)) continue;

      const allowedExtraValues = filter.allowedExtraValues || [];
      const defaultValue = '';
      const computedValue =
        filter.value || allowedExtraValues.includes(filter.value)
          ? filter.value
          : defaultValue;

      if (filter.type === ETypeFilter.ACTION_RESULT) {
        this.conditionList.push({
          key: filter.name!,
          label: filter.placeholder!,
          value: {
            actionId: null,
            resultId: null,
            type: 'IN',
          },
        });
        return;
      }

      this.conditionList.push({
        key: filter.name!,
        label: filter.placeholder!,
        value: computedValue,
      });

      return;
    }
  }

  removeFilterCondition(cdtKey: string) {
    this.conditionList = this.conditionList.filter(
      (item) => item.key !== cdtKey,
    );
  }

  getCdtLabel(key: string) {
    const filter = this._configFilterAdvanceCopy.find(
      (item) => item.name === key,
    );
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
              (!this.actionChains?.rows?.length &&
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
          if (
            this.currentActiveViewMode?.options[configFilter.name!]?.actionId
          ) {
            this.clickLoadData('actions');
          }
          if (
            this.currentActiveViewMode?.options[configFilter.name!]?.resultId
          ) {
            this.clickLoadData('results');
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
        this.clickLoadData('tags');
      } else if (filter.name === 'actionIds') {
        this.clickLoadData('actions');
      } else if (filter.name === 'resultIds') {
        this.clickLoadData('results');
      } else if (
        filter.name === 'teamRoles' ||
        filter.name === 'unassignedRoleId'
      ) {
        this.getRole();
      } else if (filter.name === 'sourceIds') {
        this.clickLoadData('sources');
      }
    }

    if (filter.name === 'chainActId' && !this.actionChains?.rows?.length) {
      filter.loading = true;
      this.clickLoadData('actionChains');
    }

    setTimeout(() => {
      filter.loading = false;
    }, 100);
  }

  onChangeCondition(key: string) {
    this.conditionList = this.conditionList.filter((item) => item.key !== key);
    const cdt = this._configFilterAdvanceCopy.find((item) => item.name === key);
    if (key === ETypeFilter.ACTION_RESULT) {
      if (cdt && !cdt.value) {
        cdt.value = {
          actionId: null,
          resultId: null,
          type: 'IN',
        };
      }
    }

    if (cdt) {
      this.conditionList.push({
        key: cdt.name!,
        label: cdt.placeholder!,
        value: cdt.value || '',
      });
    }
  }
}
