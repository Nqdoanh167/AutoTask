import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {User} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {removeCharacter} from '@app/utils/common';
import {BsModalService} from 'ngx-bootstrap/modal';
import {environment} from '../../../../../../environments/environment';
import {ModalEmployeeInfoComponent} from '@main/setting/modal-contents/modal-employee-info/modal-employee-info.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {CombinedUserAcl, UserAcl} from '@app/types/setting';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent implements OnDestroy, OnInit {
  @Input() isInPermissionModal = false;
  @Input() sourceData: User[] = [];
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

  public listBizUsers: CombinedUserAcl[] = [];
  public listFilteredBizUsers: CombinedUserAcl[] = [];
  public loading = {
    data: false,
  };

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {}

  ngOnInit() {
    if (!this.isInPermissionModal) {
      this.authService.currentBiz
        .pipe(takeUntil(this.destroy$))
        .subscribe((biz) => {
          this.listBizUsers = biz.users as CombinedUserAcl[];
          console.log(this.listBizUsers);
          this.listFilteredBizUsers = biz.users as CombinedUserAcl[];
          this.currentBiz = biz.alias || '';
        });
      this.getUserAcl();
    } else {
      this.configFilters = [];
      this.configButtons = [];
      this.listBizUsers = [...this.sourceData] as CombinedUserAcl[];
      this.listFilteredBizUsers = [...this.sourceData] as CombinedUserAcl[];
    }
  }

  getUserAcl() {
    this.loading.data = true;
    this.autoTaskService.userAcl
      .get()
      .pipe(
        finalize(() => (this.loading.data = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.loading.data = false;
        if (res.status === 200) {
          this.handleMapData(res.data);
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  handleMapData(data: UserAcl[]) {
    this.listBizUsers = this.listFilteredBizUsers =
      this.listBizUsers?.map((user) => {
        const userAcl = data?.find((item) => item.userId === user.id);
        return {
          ...user,
          ...({
            aclBranches: userAcl?.branches || user.branches,
            isActiveAcl: userAcl?.isActive,
          } as CombinedUserAcl),
        };
      }) || [];
  }

  handleAction(name: string) {
    if (name === 'reload') {
      this.getUserAcl();
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

  handleUpdate(value?: CombinedUserAcl) {
    const modalUpdate = this.modalService.show(ModalEmployeeInfoComponent, {
      initialState: {
        sourceData: value,
      },
      class: 'modal-dialog-centered modal-xl',
    });
    modalUpdate?.content?.updateSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getUserAcl());
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
