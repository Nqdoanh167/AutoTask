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
  OnDestroy,
} from '@angular/core';
import {Biz, ObjectAny} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from 'src/app/services/api/auth.service';

@Component({
  selector: 'app-filter-checkbox',
  templateUrl: './filter-checkbox.component.html',
  styleUrls: ['./filter-checkbox.component.scss'],
})
export class FilterCheckboxComponent
  implements OnInit, OnChanges, OnDestroy
{
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
  @Output() changeEvent = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() searchEvent = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() removeEvent = new EventEmitter<any>();
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

  constructor(
    private elemRef: ElementRef,
    private authService: AuthService,
  ) {
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
      case 'branch':
        this.getBranches();
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

  getBranches() {
    this.listItemSelect = this.transformBranchesData(this.dataBiz.listBranches);
  }

  transformBranchesData(branches: any[]) {
    return branches.map(branch => {
      return {
        ...branch,
        children: branch.departments?.map((dept: any) => ({
          ...dept,
          children: dept.teams || []
        })) || []
      };
    });
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
    this.removeEvent.emit(this.value);
  }
 
  onSelectItem(event: Event, type: string, item: any) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (type === 'all') {
        // Get all items including their children recursively when selecting "all"
        this.valueCurrent = this.getAllItemIds(this.listItemSelect);
      } else {
        // For regular items, only add the current item without its children
        if (!this.valueCurrent.includes(item[this.itemKey])) {
          this.valueCurrent.push(item[this.itemKey]);
        }
      }
    } else {
      if (type === 'all') {
        this.valueCurrent = [];
      } else {
        // Remove the current item
        this.valueCurrent = this.valueCurrent.filter(
          (v) => v !== item[this.itemKey],
        );

        // Remove all children recursively
        try {
          if (item.children?.length) {
            const childrenIds = this.getAllItemIds(item.children);
            this.valueCurrent = this.valueCurrent.filter(
              (v) => !childrenIds.includes(v)
            );
          }
        } catch (error) {}
      }
    }
  }

  public getAllItemIds(items: any[]): string[] {
    let ids: string[] = [];
    
    items.forEach(item => {
      ids.push(item[this.itemKey]);
      
      if (item.children?.length) {
        ids = [...ids, ...this.getAllItemIds(item.children)];
      }
    });
    
    return ids;
  }
  onChangeInputSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.searchEvent.emit(value);
    }, this.debounce);
  }
  onFilter() {
    this.changeEvent.emit(this.valueCurrent);
    this.value = this.valueCurrent;
    this.isListHide = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}