import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {User} from '@app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent implements OnDestroy, OnInit {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên nhân viên...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'reload',
      type: ETypeButton.DEFAULT,
      icon: './assets/images/icon/reload.svg',
    },
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm nhân viên',
      icon: './assets/images/icon/plus.svg',
    },
  ];

  public listBizUsers: User[] = [];
  public loading = {
    data: false,
  };

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers = biz.users;
        this.currentBiz = biz.alias || '';
      });
  }

  ngOnInit() {}

  getDataSource(isReset?: boolean) {}
  handleAction(name: string) {
    if (name === 'reload') {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
    }
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
  }

  handleUpdate(value?: any) {
    //   const modalUpdate = this.modalService.show(ModalUpdateActionComponent, {
    //     initialState: {
    //       sourceData: value,
    //     },
    //   });
    //   modalUpdate?.content?.updateSuccess
    //       .pipe()
    //       .subscribe(() => this.getDataSource());
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
