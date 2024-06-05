import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {Subject, takeUntil} from 'rxjs';
import {removeCharacter} from '@app/utils/common';
import {AuthService} from '@app/services/api/auth.service';
import {IBranch} from '@app/types/viewmodels';
import {BsModalService} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent implements OnDestroy, OnInit {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm mới',
      icon: './assets/images/icon/plus.svg',
    },
  ];
  public loading = {
    data: false,
  };

  public dataSource: IBranch[] = [];
  public listFilteredBranches: IBranch[] = [];

  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {});
  }

  ngOnInit() {}

  handleAction(name: string) {
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  onSearch(value: {term: string; name: string}) {
    const {term} = value;
    const keyword = removeCharacter(term)
      .toLocaleLowerCase()
      .replace(/[ ]+/, ' ');
    this.listFilteredBranches = this.dataSource.filter(
      (user) =>
        !keyword ||
        (user.name &&
          removeCharacter(user.name).toLocaleLowerCase().indexOf(keyword) > -1),
    );
  }

  handleUpdate(data?: any) {}

  handleDelete(data: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
