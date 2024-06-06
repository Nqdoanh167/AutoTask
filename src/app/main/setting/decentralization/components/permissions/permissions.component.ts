import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {finalize, Subject, takeUntil} from 'rxjs';
import {IQueryBase} from '@app/types/viewmodels';
import {BsModalService} from 'ngx-bootstrap/modal';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {AddEditPermissionComponent} from '@main/setting/modal-contents/add-edit-permission/add-edit-permission.component';
import {Permission} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent
  extends StandardTableComponent<Permission, IQueryBase>
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
    private readonly modalService: BsModalService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {
    super();
  }

  override handleAction(name: string) {
    if (name === 'add_new') {
      this.handleUpdate();
    }
  }

  override getDataSource(isReset?: boolean) {
    let params = {...this.item.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.item.loading = true;
    this.autoTaskService.permission
      .get(params)
      .pipe(
        finalize(() => (this.item.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.total;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }

  handleUpdate(data?: Permission) {
    const modalAddEdit = this.modalService.show(AddEditPermissionComponent, {
      class: 'modal-xl modal-dialog-centered',
      initialState: {
        sourceData: data,
      },
    });
    modalAddEdit?.content?.successEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getDataSource();
        modalAddEdit.hide();
      });
  }

  handleDelete(data?: Permission) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
