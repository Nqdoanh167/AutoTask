import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule} from '@angular/forms';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';

@Component({
  selector: 'custom-select-search',
  template: `
    <div
      class="custom-select-search {{ selectData.className }} {{ className }}"
    >
      <ng-select
        [ngStyle]="{minWidth: minWidth}"
        (change)="handleChangeValue($event)"
        [(ngModel)]="dataSelect"
        appearance="outline"
        id="select-search"
        [searchable]="selectData.searchable || false"
        [placeholder]="selectData.placeholder || ''"
        class="dropdown-auto-width"
        [class.custom-input-multiple]="selectData.multiple"
        [multiple]="selectData.multiple || false"
        (search)="onSearchOption()"
        (scrollToEnd)="onSearchOption()"
        [closeOnSelect]="!selectData.multiple"
        [clearable]="!!selectData.clearable"
      >
        <ng-template *ngIf="selectData.isCreatable" ng-header-tmp>
          <div (click)="onCreateOption()" class="cursor-point">
            <div class="option-create cursor-pointer">
              <i class="fa-solid fa-plus me-2"></i>
              Add option
            </div>
          </div>
        </ng-template>
        <ng-option
          *ngFor="let item of selectData?.options; index as i"
          [value]="item[selectData.bindValue!]"
          ><div [ngStyle]="item['style']">
            {{ item[selectData.bindLabel!] }}
          </div></ng-option
        >
      </ng-select>
    </div>
  `,
  styleUrls: ['./custom-select-search.component.scss'],
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule],
})
export class CustomSelectSearchComponent implements OnInit {
  public dataSelect: any = undefined;
  @Input() className?: string;
  @Input() minWidth?: string;
  @Input() selectData: IFilterTopTable = {
    type: ETypeFilter.SELECT,
    name: '',
    options: [],
    placeholder: '',
    searchable: false,
    multiple: false,
    isCreatable: false,
    bindLabel: 'name',
    bindValue: 'id',
  };
  @Output() selectEvent = new EventEmitter<string>();
  @Output() scrollToEndEvent = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  onSearchOption() {}

  onCreateOption() {}

  handleChangeValue(value?: string) {
    this.selectEvent.emit(value);
  }
}
