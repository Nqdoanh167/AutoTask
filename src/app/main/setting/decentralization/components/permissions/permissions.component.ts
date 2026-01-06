import {Component, OnInit} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {finalize, takeUntil} from 'rxjs';
import {ERole, IQueryBase} from '@app/types/viewmodels';
import {BsModalService} from 'ngx-bootstrap/modal';
import {StandardTableComponent} from '@share/common/standard-table/standard-table.component';
import {AddEditPermissionComponent} from '@main/setting/modal-contents/add-edit-permission/add-edit-permission.component';
import {EPerActSetting, EPerActType, Permission} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {AdminService} from '@app/services/api/admin.service';
import cloneDeep from 'lodash/cloneDeep';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent
  extends StandardTableComponent<Permission, IQueryBase>
  implements OnInit
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
      icon: './assets/images/icon-plus-bold.svg',
    },
  ];
  public loading = {
    data: false,
    createDefaultPerms: false,
  };

  public permission = {
    edit: false,
    add: false,
  };

  constructor(
    private readonly modalService: BsModalService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly adminService: AdminService,
  ) {
    super();
    this.item.paramsQuery.filter = JSON.stringify({retrieveUser: true});
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    this.permission.edit = this.permission.add = permissions?.some(
      (per) => per === EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
    );
    if (!this.permission.add) {
      this.configButtons = this.configButtons?.filter(
        (button) => button.name !== 'add_new',
      );
    }
  }

  override ngOnInit() {
    super.ngOnInit();
    if (
      this.currentViewer?.role &&
      [ERole.OWNER, ERole.DEV].includes(this.currentViewer?.role)
    ) {
      this.configButtons.unshift({
        name: 'default-perms',
        type: ETypeButton.PRIMARY,
        label: 'Tạo quyền mặc định',
        icon: './assets/images/icon-plus-bold.svg',
      });
    }
  }

  override handleAction(name: string) {
    if (name === 'add_new') {
      this.handleUpdate();
    }
    if (name === 'default-perms') {
      this.handleCreateDefaultPerms();
    }
  }

  handleCreateDefaultPerms() {
    if (!this.currentBiz?.id) return;
    this.loading.createDefaultPerms = true;
    this.adminService.permission
      .createDefaultPerms({
        bizId: this.currentBiz?.id,
      })
      .pipe(
        finalize(() => {
          this.loading.createDefaultPerms = false;
        }),
      )
      .subscribe((res) => {
        if (res.status === 200) {
          this.commonService.handleResSuccess('create');
          this.getDataSource(true);
        } else {
          this.commonService.handleResErr(res);
        }
      });
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
        sourceData: cloneDeep(data),
      },
    });
    modalAddEdit?.content?.successEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getDataSource();
        modalAddEdit.hide();
      });
  }

  handleDelete(value: Permission) {
    const title = 'Xóa quyền';
    const description = `Bạn sắp xóa quyền <b>${
      value.name || ''
    }</b>, hành động này không thể hoàn tác.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
      context: value,
      errorState:
        'Cẩn trọng với thao tác xoá bản ghi. Các module khác đang sử dụng dữ liệu\n' +
        '        của bản ghi cũng sẽ bị ảnh hưởng.',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDelete(value);
    });
  }

  onDelete(value: Permission) {
    this.autoTaskService.permission
      .delete(value.id)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('delete');
            this.getDataSource();
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }
}
