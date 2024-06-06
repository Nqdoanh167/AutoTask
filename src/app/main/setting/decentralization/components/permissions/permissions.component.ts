import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {IQueryBase} from '@app/types/viewmodels';
import {BsModalService} from 'ngx-bootstrap/modal';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {AddEditPermissionComponent} from '@main/setting/modal-contents/add-edit-permission/add-edit-permission.component';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent
  extends StandardTableComponent<any, IQueryBase>
  implements OnDestroy, OnInit
{
  public override configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
  ];
  public override configButtons: IFilterTopButton[] = [
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

  private destroy$ = new Subject();
  constructor(
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
  ) {
    super();
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {});
  }

  override handleAction(name: string) {
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  override getDataSource(isReset?: boolean) {}

  handleUpdate(data?: any) {
    this.modalService.show(AddEditPermissionComponent, {
      class: 'modal-xl modal-dialog-centered',
    });
  }

  handleDelete(data?: any) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
