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
import {Biz, ObjectAny} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import { AuthService } from 'src/app/services/api/auth.service';

@Component({
  selector: 'app-input-checkbox',
  templateUrl: './input-select-checkbox.component.html',
  styleUrls: ['./input-select-checkbox.component.scss'],
})
export class InputSelectCheckboxComponent implements OnInit, OnChanges {
  @ViewChild('inputSearch') inputSearch!: any;
  @HostListener('document:click', ['$event'])
  onClick(ev: MouseEvent): void {}
  // css
  @Input() customClass: string = '';
  @Input() styleListItem: string = '';
  // end css
  @Input() listItemSelect: Array<any> = [];
  @Input() loading = false;
  @Input() disabled = false;
  @Input() isSelectAll = true;
  @Input() enableRemove = true;
  @Input() enableSearch = true;
  @Input() debounce = 300;
  @Input() value: string[] = [];
  @Input() template: any;
  @Input() templateValue: any;
  @Input() itemKey = 'id';
  @Input() itemValue = 'name';
  @Input() selectData: any = {
    type: 'select-checkbox',
    name: '',
    placeHolder: '',
    searchable: false,
    multiple: false,
  };

  // tslint:disable-next-line:no-output-on-prefix
  @Output() onChange = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSearch = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onRemove = new EventEmitter<any>();
  valueCurrent: string[] = [];
  isListHide = true;
  timeout: any = null;

  private destroy$ = new Subject();

  public biz!: Biz;
  public dataBiz: any = {
    branchIds: [],
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
  };

  constructor(private elemRef: ElementRef, private authService: AuthService) {
    this.authService.currentBiz.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.biz = res;
        this.dataBiz.listUsers = res.users || [];
        this.dataBiz.listBranches = res.branches || [];
        this.dataBiz.listRoles = res.roles;
      },
    });
  }

  ngOnInit(): void {
    switch (this.selectData.name) {
      case 'role':
        this.getRoles();
        return;
      case 'user':
        this.getUsers();
        return;
      default:
        return;
    }
  }

  getRoles() {
    this.listItemSelect = this.dataBiz.listRoles;
  }
  getUsers() {
    this.listItemSelect = this.dataBiz.listUsers;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.valueCurrent = [...this.value];
    this.valueCurrent.forEach((v) => {
      setTimeout(() => {
        const elmCheckbox = document.getElementById(`checkbox-${v}`);
        if (elmCheckbox) {
          (elmCheckbox as HTMLInputElement).setAttribute('checked', 'true');
        }
      }, 0);
    });
  }
  toggle() {
    if (this.disabled) {
      return;
    }

    this.isListHide = !this.isListHide;

    setTimeout(() => {
      this.inputSearch?.nativeElement?.focus();
    }, 200);

    if (!this.isListHide) {
      this.onClick = function (ev: MouseEvent) {
        const clickInside = this.elemRef.nativeElement.contains(ev.target);
        if (!clickInside) {
          this.isListHide = true;
          this.onClick = function (ev: MouseEvent): void {};
        }
      };
    }
  }
  onRemoveItemSelect() {
    this.onRemove.emit(this.value);
  }
  onSelectItem(event: Event, type: string, item: any) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (type === 'all') {
        this.valueCurrent = this.listItemSelect.map(
          (item: ObjectAny) => item[this.itemKey]
        );
      } else {
        if (!this.valueCurrent.includes(item[this.itemKey])) {
          this.valueCurrent.push(item[this.itemKey]);
        }
      }
    } else {
      if (type === 'all') {
        this.valueCurrent = [];
      } else {
        this.valueCurrent = this.valueCurrent.filter(
          (v) => v !== item[this.itemKey]
        );

        try {
          if (item.children?.length) {
            const itemIds = item.children.map((c: any) => c[this.itemKey]);
            this.valueCurrent = this.valueCurrent.filter(
              (v) => !itemIds.includes(v)
            );
          }
        } catch (error) {}
      }
    }
  }
  onChangeInputSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.onSearch.emit(value);
    }, this.debounce);
  }
  onFilter() {
    this.onChange.emit(this.valueCurrent);
    this.value = this.valueCurrent;
    this.isListHide = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
