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
import { specialQueryTaskKeys } from '@main/dashboard/dashboard-variables';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DashboardCheckPermission } from '@app/main/dashboard/dashboard-check-permission';
import { isEqual } from 'lodash';
import { ModifiedUserUnit } from '@app/types/flow';
import moment from 'moment';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';

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
  @Output() scrollToEndEvent = new EventEmitter<any>();
  @Output() searchEvent = new EventEmitter<{ term: string; name: string }>();

  public paramsQuery: any = {
    sort: '-createdAt',
    q: '',
  };

  configFilterAdvance: IFilterTopTable[] = [];
  configFilterBasic: IFilterTopTable[] = [];
  onSearchingAdvance: string[] = [];

  public cdtList: { key: string; label: string; value: string | string[] }[] = [];

  public units = this.autoTaskService.getUserUnits(false);
  public selectedUnits: ModifiedUserUnit[] = [];

  public listDifferentQueryKeys = [
    {
      name: 'unassignedRoleIds',
      label: 'Chưa gán vai trò',
      value: []
    }
  ]

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
          // this.handleViewModeChange(true);
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
      // if (!isEqual(obj, this.currentActiveViewMode?.options)) {
      //   // this.handleViewModeChange(true);
      //   return;
      // }
    } else {
      if (value) {
        this.paramsQuery.sort = value;
      } else {
        delete this.paramsQuery.sort;
      }
      if (value !== this.currentActiveViewMode?.options?.sort) {
        // this.handleViewModeChange(true);
      }
    }
  }

  onPopoverValue(value: any, name: string = 'popover') {
    if (value) {
      this.paramsQuery.sort = value;
    } else {
      delete this.paramsQuery.sort;
    }
    const configFilterPopover = this.configFilters.find(
      (filter) => filter.name === 'sort',
    );
    if (configFilterPopover) {
      configFilterPopover.value = value;
    }
    if (value !== this.currentActiveViewMode?.options?.sort) {
      this.handleViewModeChange(true);
    }
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
    if (name === 'isHideExecute') {
      const configButton = this.configButtons.find(
        (cf) => cf.name === 'isHideExecute',
      );
      const obj = JSON.parse(this.paramsQuery.filter || '{}');
      obj['isHideExecute'] = !configButton?.isActive;
      this.paramsQuery.filter = JSON.stringify(obj);
      configButton!.isActive = !configButton?.isActive;
      if (!isEqual(obj, this.currentActiveViewMode?.options)) {
        this.handleViewModeChange(true);
        return;
      }
    } else {
      this.clickButtonEvent.emit(name);
    }
  }

  onChangeDifferentQueryKey(
    event: {
      name: string,
      value: any;
      label: string;
    },
  ) {
    console.log('onChangeDifferentQueryKey', event);
    const { name, value } = event;
    const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');
    objFilterQuery[name] = value;
    this.paramsQuery.filter = JSON.stringify(objFilterQuery);
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

    this.paramsQuery.filter = JSON.stringify(objFilterQuery);
    this.handleViewModeChange(true);
    this.popFilter.hide();
  }

  reset() {
    this.handleOpenPopover();
  }

  addFilterCondition() {
    for (const filter of this.configFilterAdvance) {
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
    const filter = this.configFilterAdvance.find((item) => item.name === key);
    return filter ? filter.placeholder : key;
  }

  handleChangeUnits(event: any) {
    const ids: string[] = [];
    this.selectedUnits.forEach((unit) => {
      ids.push(unit?.team || unit?.department || unit?.id || '');
    });
    const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');
    if (ids.length > 0) {
      objFilterQuery['branchIds'] = ids;
    } else {
      delete objFilterQuery['branchIds'];
    }
    this.paramsQuery.filter = JSON.stringify(objFilterQuery);
  }

  handleActiveViewMode() {
    try {
      this.paramsQuery.filter = '{}';
      this.selectedUnits = [];
      const objFilterQuery = JSON.parse(this.paramsQuery.filter || '{}');

      Object.keys(this.currentActiveViewMode?.options || {}).forEach((key) => {
        if (this.currentActiveViewMode?.options[key]) {
          objFilterQuery[key] = this.currentActiveViewMode?.options[key];
        }
      });

      if (this.currentActiveViewMode?.options?.branchIds) {
        objFilterQuery.branchIds =
          this.currentActiveViewMode?.options.branchIds;
        this.selectedUnits = this.autoTaskService.findUnitsByIds(
          this.currentActiveViewMode?.options.branchIds || [],
        );
      }
      // loop configFilters and update by value of object options in currentActiveViewMode
      this.configFilters.forEach((configFilter) => {
        if (
          configFilter.type === ETypeFilter.SELECT ||
          configFilter.type === ETypeFilter.POPOVER ||
          configFilter.type === ETypeFilter.DATE
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

  override handleViewModeChange(hasChanged: boolean) {
    const changedTab = {
      ...this.currentActiveViewMode,
      hasChanged: hasChanged,
      options: {
        ...JSON.parse(this.paramsQuery.filter || '{}'),
        sort: this.paramsQuery.sort,
        q: this.paramsQuery.q,
      },
    };
    this.autoTaskService.setCurrentActiveViewMode(changedTab);
  }

  getSelectedSummary(nodes: any[]): string {
    const teamIds = new Set();
    const pbKeys = new Set();
    const cnKeys = new Set();

    nodes.forEach((n) => {
      if (n.team) {
        teamIds.add(n.team); // Đội nhóm: ưu tiên cao nhất
      } else if (n.department) {
        // Nếu chưa chọn TEAM của PB này thì mới đếm PB
        const hasTeam = nodes.some(
          (x) => x.team && x.department === n.department,
        );
        if (!hasTeam) {
          pbKeys.add(`${n.id}-${n.department}`); // Dựa theo id CN + id PB
        }
      } else {
        // Nếu chưa chọn PB hoặc TEAM thuộc CN này thì mới đếm CN
        const hasLowerLevel = nodes.some(
          (x) =>
            (x.department && x.id === n.id) || // có PB trong CN này
            (x.team && x.id === n.id), // có TEAM trong CN này
        );
        if (!hasLowerLevel) {
          cnKeys.add(n.id);
        }
      }
    });

    const parts = [];
    if (cnKeys.size) parts.push(`${cnKeys.size}CN`);
    if (pbKeys.size) parts.push(`${pbKeys.size}PB`);
    if (teamIds.size) parts.push(`${teamIds.size}ĐN`);

    return parts.join(' ');
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
      } else if (filter.name === 'teamRoles' || filter.name === 'unassignedRoleIds') {
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
