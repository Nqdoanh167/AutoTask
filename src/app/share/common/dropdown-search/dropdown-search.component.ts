import { ChangeDetectorRef, Component, ContentChild, Directive, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import * as searchHelper from 'src/app/utils/search-helper';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';


// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ng-label-null-tmp]' })
export class NgLabelNullTemplateDirective {
  constructor(public template: TemplateRef<any>) { }
}

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ng-label-value-tmp]' })
export class NgLabelValueTemplateDirective {
  constructor(public template: TemplateRef<any>) { }
}
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ng-label-tmp]' })
export class NgLabelTemplateDirective {
  constructor(public template: TemplateRef<any>) { }
}
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ng-option-tmp]' })
export class NgOptionTemplateDirective {
  constructor(public template: TemplateRef<any>) { }
}


@Component({
  selector: 'app-dropdown-search',
  templateUrl: './dropdown-search.component.html',
  styleUrls: ['./dropdown-search.component.scss']
})
export class DropdownSearchComponent implements OnInit {
  @Input() placement: string = 'right';
  @Input() placeholder: string = 'Lựa chọn';
  @Input() className: string = '';
  @Input() value: any = null;
  @Input() bindValue: string | null = null;
  @Input() bindLabel: string | null = 'name';
  @Input() nextLevel1: string = '';
  @Input() nextLevel2: string = '';
  @Input() isSearch: boolean = false;
  @Input() readonly: boolean = false;
  @Input()
  get items() { return this._items };

  set items(value: any[] | null) {
    if (value === null) {
      value = [];
    }
    this._items = [...(value || [])];
  };

  @ContentChild(NgLabelNullTemplateDirective, { read: TemplateRef }) labelNullTemplate!: TemplateRef<any>;
  @ContentChild(NgLabelValueTemplateDirective, { read: TemplateRef }) labelValueTemplate!: TemplateRef<any>;
  @ContentChild(NgLabelTemplateDirective, { read: TemplateRef }) labelTemplate!: TemplateRef<any>;
  @ContentChild(NgOptionTemplateDirective, { read: TemplateRef }) optionTemplate!: TemplateRef<any>;
  @ViewChild('dropdown') dropdown!: BsDropdownDirective;

  currentRowValue: any = null;
  currentListRowValue: any[] = [];
  currentListRowValueIds: any[] = [];

  @Output() change = new EventEmitter<any>();

  private _items: any[] = [];    // Fake data items
  _filteredItems: any[] = [];    // Fake data items

  search: { term: string, timeout: any, debounce: number, _isComposing: boolean } = {
    term: '',
    timeout: null,
    debounce: 50,
    _isComposing: false
  }

  constructor(private detect: ChangeDetectorRef) {
  }




  ngOnInit(): void {
    this._filteredItems = [...this._items];
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.bindValue) {
      this.onChangeValue(changes['value'].currentValue);
      // console.log('currentRowValue', this.currentRowValue);
      // console.log('currentListRowValue', this.currentListRowValue);
    }
    // if(changes)
    // console.log('changes', changes);
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.

  }
  onChangeValue(val: string) {
    this.currentRowValue = null;
    this.currentListRowValue = [];

    for (const item of this._items) {
      if (item[this.bindValue!] === val) {
        this.currentRowValue = item;
        this.currentListRowValue = [item];
        break;
      }

      if (!this.currentRowValue && item[this.nextLevel1]?.length && this.nextLevel1) {
        for (const itemLevel1 of item[this.nextLevel1]) {
          if (itemLevel1[this.bindValue!] === val) {
            this.currentRowValue = item;
            this.currentListRowValue = [item, itemLevel1];
            break;
          }
          if (!this.currentRowValue && itemLevel1[this.nextLevel2]?.length && this.nextLevel2) {
            for (const itemLevel2 of itemLevel1[this.nextLevel2]) {
              if (itemLevel2[this.bindValue!] === val) {
                this.currentRowValue = item;
                this.currentListRowValue = [item, itemLevel1, itemLevel2];
                break;
              }
            }
          }

          if (this.currentRowValue) break;
        }
      }
      this.currentListRowValueIds = this.currentListRowValue.map(c => c[this.bindValue!]);
      if (this.currentRowValue) break;
    }
  }
  isActiveOption(otp: any) {
    if (this.value && this.bindValue && (this.value === otp[this.bindValue] || this.currentListRowValueIds.includes(otp[this.bindValue]))) {
      return true
    }
    return false
  }

  // mouseover(item: any) {
  //   if (item) {
  //     this._filteredItems = this.listTypeSource.map(e => {
  //       e.isHover = false;
  //       if (e.id === item.id) {
  //         e.isHover = true;
  //       }
  //       return e;
  //     })
  //   }
  //   this.isHover = true;
  // }

  onCompositionStart() {
    // console.log('onCompositionStart');
    this.search._isComposing = true;
  }

  onCompositionEnd(term: string) {
    // console.log('onCompositionEnd');
    this.search._isComposing = false;
  }

  selectItem(event: Event, row: any, row1?: any, row2?: any) {
    // console.log('event', event);
    this.dropdown.isOpen = false;
    this.currentRowValue = row;
    this.value = row[this.bindValue || 'id'];
    if (this.nextLevel1) {
      let vals = [row];
      if (row1) vals.push(row1);
      if (row2) vals.push(row2);
      this.change.emit(vals);
    } else {
      this.change.emit(row);
    }
    setTimeout(() => {
      this.detect.detectChanges();
    }, 0);
    event.preventDefault();
    event.stopPropagation();    // stop event pre level
  }

  searchFn(term: string) {
    // console.log('searchFn');
    clearTimeout(this.search.timeout);
    setTimeout(() => {
      this.filter(term);
    }, this.search.debounce);
  }

  resetFilteredItems() {
    if (this._filteredItems.length === this._items.length) {
      return;
    }

    this._filteredItems = this._items;
  }

  filter(term: string): void {
    if (!term) {
      this.resetFilteredItems();
      return;
    }

    this._filteredItems = [];
    term = searchHelper.stripSpecialChars(term).toLocaleLowerCase().trim();

    for (const _item of this._items) {
      const matchedItems = [];

      for (const val of Object.values(_item)) {
        if (this._defaultSearchFn(term, JSON.stringify(val))) {
          matchedItems.push(_item);
        }
      }
      if (matchedItems.length > 0) {
        // const [last] = matchedItems.slice(-1);
        // if (last.parent) {
        //     const head = this._items.find(x => x === last.parent);
        //     this._filteredItems.push(head);
        // }
        this._filteredItems.push(_item);
      }
    }
    // console.log('this._filteredItems', this._filteredItems);
  }

  _defaultSearchFn(search: string, label: any) {
    label = searchHelper.stripSpecialChars(label).toLocaleLowerCase();
    return label.indexOf(search) > -1
  }

}
