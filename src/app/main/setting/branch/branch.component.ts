import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {Subject, takeUntil} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {removeCharacter} from '@app/utils/common';
import {AuthService} from '@app/services/api/auth.service';
import {IBranch} from '@app/types/viewmodels';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss'],
})
export class BranchComponent implements OnDestroy, OnInit {
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên chi nhánh...',
    },
  ];
  public configButtons: IFilterTopButton[] = [
    {
      name: 'add_new',
      type: ETypeButton.PRIMARY,
      label: 'Thêm chi nhánh',
      icon: './assets/images/icon/plus.svg',
    },
  ];
  public loading = {
    data: false,
  };

  public dataSource: IBranch[] = [];
  public listFilteredBranches: IBranch[] = [];

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(private readonly authService: AuthService) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.dataSource = biz.branches;
        this.listFilteredBranches = biz.branches;
        this.currentBiz = biz.alias || '';
      });
  }

  ngOnInit() {}

  handleAction(name: string) {
    if (name === 'add_new') {
      const url = `${environment.urlDomain}/${this.currentBiz}/settings/branches`;
      window.open(url, '_blank');
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
