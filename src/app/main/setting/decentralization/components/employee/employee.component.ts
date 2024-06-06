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
import {removeCharacter} from '@app/utils/common';
import {BsModalService} from 'ngx-bootstrap/modal';
import {environment} from '../../../../../../environments/environment';
import {ModalEmployeeInfoComponent} from '@main/setting/modal-contents/modal-employee-info/modal-employee-info.component';

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
      label: 'Thêm nhân viên (module Cài đặt)',
      icon: './assets/images/icon/plus.svg',
    },
  ];

  public listBizUsers: User[] = [];
  public listFilteredBizUsers: User[] = [];
  public loading = {
    data: false,
  };

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.listBizUsers = biz.users;
        this.listFilteredBizUsers = biz.users;
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
      const url = `${environment.urlDomain}/${this.currentBiz}/settings/staff`;
      window.open(url, '_blank');
    }
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    const keyword = removeCharacter(term)
      .toLocaleLowerCase()
      .replace(/[ ]+/, ' ');
    this.listFilteredBizUsers = this.listBizUsers.filter(
      (user) =>
        !keyword ||
        (user.name &&
          removeCharacter(user.name).toLocaleLowerCase().indexOf(keyword) > -1),
    );
  }

  handleUpdate(value?: User) {
    const modalUpdate = this.modalService.show(ModalEmployeeInfoComponent, {
      initialState: {
        sourceData: value,
      },
      class: 'modal-dialog-centered modal-xl',
    });
    modalUpdate?.content?.updateSuccess
      .pipe()
      .subscribe(() => this.getDataSource());
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
