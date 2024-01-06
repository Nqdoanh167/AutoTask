import {Component, Input, OnInit} from '@angular/core';
import {ISelectSearch, ObjectAny} from '@app/types/viewmodels';
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule} from '@angular/forms';
import {TranslocoModule} from '@ngneat/transloco';

@Component({
  selector: 'custom-select-search',
  template: `
    <div
      class="custom-select-search {{ className }}"
      *transloco="let tc; read: 'common'"
    >
      <ng-select
        (change)="handleChangeValue($event)"
        [(ngModel)]="dataSelect"
        appearance="outline"
        id="select-search"
        [searchable]="selectData.searchable || false"
        [placeholder]="selectData.placeHolder || ''"
        class="dropdown-auto-width"
        [class.custom-input-multiple]="selectData.multiple"
        [multiple]="selectData.multiple || false"
        (search)="selectData.onSearch?.($event)"
        [closeOnSelect]="!selectData.multiple"
      >
        <ng-template *ngIf="selectData.isCreatable" ng-header-tmp>
          <div (click)="selectData.onCreateOption?.()" class="cursor-point">
            <div class="option-create cursor-pointer">
              <i class="fa-solid fa-plus me-2"></i>
              {{ tc('button.add') }}
            </div>
          </div>
        </ng-template>
        <ng-option
          *ngFor="let item of selectData?.options; index as i"
          [value]="item.value"
          ><div [ngStyle]="item.style">
            {{ item.label }}
          </div></ng-option
        >
      </ng-select>
    </div>
  `,
  styleUrls: ['./custom-select-search.component.scss'],
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule, TranslocoModule],
})
export class CustomSelectSearchComponent implements OnInit {
  public dataSelect: any = undefined;
  @Input() className?: string;
  @Input() selectData: ISelectSearch = {
    name: '',
    options: [],
    placeHolder: '',
    onChange: () => {},
    searchable: false,
    onSearch: () => {},
    multiple: false,
    isCreatable: false,
    onCreateOption: () => {},
  };

  constructor() {}

  ngOnInit(): void {}

  handleChangeValue($event: any) {
    this.selectData.onChange?.($event);
  }
}
