import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ObjectAny } from 'src/app/types/viewmodels';
import { SearchHelper } from '@app/utils/search-helper';

@Component({
  selector: 'app-input-checkbox',
  templateUrl: './input-checkbox.component.html',
  styleUrls: ['./input-checkbox.component.scss'],
})
export class InputCheckboxComponent implements OnInit, OnChanges {
  @ViewChild('inputSearch') inputSearch!: any;
  // css
  @Input() customClass: string = '';
  @Input() styleListItem: string = '';
  // end css
  @Input() listItemSelect: Array<any> = [];
  @Input() loading = false;
  @Input() disabled = false;
  @Input() isSelectAll = true;
  @Input() isValidPermissionCheckbox = false;
  @Input() enableRemove = true;
  @Input() enableSearch = true;
  @Input() debounce = 300;
  @Input() placeholder = 'Thành phố/ Tỉnh - Quận/ Huyện';
  @Input() value: string[] = [];
  @Input() tooltipText = '';
  @Input() tooltipPlacement: 'bottom' | 'right' | 'top' | 'left' = 'bottom';
  @Input() template: any;
  @Input() templateValue: any;
  @Input() itemKey = 'id';
  @Input() itemValue = 'name';
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onChange = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSearch = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onRemove = new EventEmitter<any>();
  valueCurrent: string[] = [];
  isListHide = true;
  timeout: any = null;
  textSearch = '';
  _filteredItems: any[] = [];
  @HostListener('document:click', ['$event'])
  onClick(ev: MouseEvent): void { };

  constructor(
    private elemRef: ElementRef,
    private toastr: ToastrService
    // private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // console.log('this 1', this.listItemSelect)
    this._filteredItems = [...this.listItemSelect];
  }
  ngOnChanges(changes: SimpleChanges) {
    // console.log('changes', changes);
    // this.cdr.detectChanges();
    if (changes['listItemSelect']) {
      this._filteredItems = [...changes['listItemSelect'].currentValue];
    }

    if (changes['value']) {
      this.valueCurrent = [...this.value];
      // console.log('this.valueCurrent', this.valueCurrent);
      this.valueCurrent.forEach(v => {
        setTimeout(() => {
          const elmCheckbox = document.getElementById(`checkbox-${v}`)
          if (elmCheckbox) {
            (elmCheckbox as HTMLInputElement).setAttribute('checked', 'true')
          }
        }, 0);
      })
    }
  }
  toggle() {
    if (this.disabled) { return; }

    this.isListHide = !this.isListHide;

    setTimeout(() => {
      this.inputSearch?.nativeElement?.focus();
    }, 200);

    if (!this.isListHide) {
      this.onClick = function (ev: MouseEvent) {
        const clickInside = this.elemRef.nativeElement.contains(ev.target);
        if (!clickInside) {
          this.isListHide = true;
          this.onClick = function (ev: MouseEvent): void { };
        }
      }
    }
  }
  onRemoveItemSelect() {
    this.onRemove.emit(this.value);
  }
  onSelectItem(event: any, type: string, item: any, parent?: any) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {

      if (type === 'all') {
        console.log('event', event);
        this.valueCurrent = [];
        this._filteredItems.forEach((item: any) => {
          this.valueCurrent.push(item[this.itemKey]);
          if (item.children?.length && item.role !== 'OWNER') {
            item.children.forEach((child: any) => {
              this.valueCurrent.push(child[this.itemKey]);
              if (child.children?.length && child.role !== 'OWNER') {
                child.children.forEach((grandChild: any) => {
                  this.valueCurrent.push(grandChild[this.itemKey]);
                })
              }
            })
          }
        })
        // this.valueCurrent = this._filteredItems.map((item: ObjectAny) => item[this.itemKey])
      } else {
        if (!this.valueCurrent.includes(item[this.itemKey])) {
          this.valueCurrent.push(item[this.itemKey]);

          if (item.children?.length && item.role !== 'OWNER') {
            item.children.forEach((child: any) => {
              this.onSelectItem(event, type, child);
            })
          }
        }
      }

    } else {
      if (type === 'all') {
        this.valueCurrent = [];
      } else {
        this.valueCurrent = this.valueCurrent.filter(
          (v) => v !== item[this.itemKey]
        );
        let isCheckChild = true;
        if (this.isValidPermissionCheckbox && parent && parent.children?.length && parent.role !== 'OWNER') {
          const hasCheckbox = parent.children.some((child: any) => this.valueCurrent.includes(child[this.itemKey]));
          if (!hasCheckbox) {
            this.toastr.warning('Bạn là thành viên cần chọn tối thiệu 1 đối tượng');
            this.valueCurrent.push(item[this.itemKey]);
            const elm = document.getElementById(`checkbox-${item[this.itemKey]}`)
            setTimeout(() => {
              if (elm) (elm as HTMLInputElement).checked = true;
            }, 0);
            isCheckChild = false;
          }
        }
        try {
          if (isCheckChild && item.children?.length) {
            item.children.forEach((child: any) => {
              this.onSelectItem(event, type, child);
            })
          }
        } catch (error) {
        }
      }
    }
  }

  // Trường hợp item k phải owner mà bỏ tích toàn bộ child => thằng cha cũng phải bỏ tích

  // if (item.role !== 'OWNER' && !item.children.some((c: any) => this.valueCurrent.includes(c[this.itemKey]))) {
  //   this.onSelectItem(event, type, item);
  // }
  validPermissionCheckbox(items: any, parent?: any) {
    items.forEach((item: any) => {
      if (item.role !== 'OWNER' && item.children?.length) {
        const hasCheckbox = item.children.some((c: any) => this.valueCurrent.includes(c[this.itemKey]));
        console.log('hasCheckbox', hasCheckbox, parent, item);
        if (parent && !hasCheckbox) {
          this.onSelectItem({ target: { checked: false } }, 'item', parent, false);
        } else {
          this.validPermissionCheckbox(item.children, item);
        }
      }
    })
  }
  onChangeInputSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this._filteredItems = new SearchHelper(['name', 'email']).filter(this.listItemSelect, value);
      this.onSearch.emit(value);
    }, this.debounce);
  }
  onFilter() {
    this.onChange.emit(this.valueCurrent);
    this.isListHide = true;
  }
}
