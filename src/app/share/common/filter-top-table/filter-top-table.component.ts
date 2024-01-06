import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomInputSearchComponent} from '@share/custom/custom-input-search/custom-input-search.component';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {CustomSelectSearchComponent} from '@share/custom/custom-select-search/custom-select-search.component';

@Component({
  selector: 'app-filter-top-table',
  standalone: true,
  imports: [
    CommonModule,
    CustomInputSearchComponent,
    CustomSelectSearchComponent,
  ],
  templateUrl: './filter-top-table.component.html',
  styleUrls: ['./filter-top-table.component.scss'],
})
export class FilterTopTableComponent {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Search...',
    },
    {
      type: ETypeFilter.SELECT,
      placeholder: 'Status',
      options: [],
    },
    {
      type: ETypeFilter.SELECT,
      placeholder: 'Type',
      options: [],
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add',
      type: ETypeButton.PRIMARY,
      label: 'Thêm mới',
      icon: './assets/images/icon/plus.svg',
    },
  ];

  protected readonly ETypeFilter = ETypeFilter;
  protected readonly ETypeButton = ETypeButton;
  constructor() {}
  onSearch(searchText: string) {}
}
