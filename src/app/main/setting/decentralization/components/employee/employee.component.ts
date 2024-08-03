import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  ETypeButton,
  ETypeFilter,
  IFilterTopButton,
  IFilterTopTable,
} from '@app/types/common';
import {finalize, takeUntil} from 'rxjs';
import {removeCharacter} from '@app/utils/common';
import {BsModalService} from 'ngx-bootstrap/modal';
import {environment} from '../../../../../../environments/environment';
import {ModalEmployeeInfoComponent} from '@main/setting/modal-contents/modal-employee-info/modal-employee-info.component';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {
  CombinedUserAcl,
  EBatchActionEmployeePer,
  EPerActSetting,
  EPerActType,
  Permission,
  UserAcl,
  UserAclBranch,
  UserAclDepartment,
  UserAclTeam,
} from '@app/types/setting';
import {CheckboxSortTableComponent} from '@share/common/checkbox-table/checkbox-sort-table.component';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {ToastrService} from 'ngx-toastr';
import {EntityPagination} from '@app/types/viewmodels';
import {NgSelectComponent} from '@ng-select/ng-select';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent
  extends CheckboxSortTableComponent<CombinedUserAcl, any>
  implements OnDestroy, OnInit
{
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;

  @Input() isInPermissionModal = false;
  @Input() sourceData: UserAcl[] = [];
  @Input() permissionDetail?: Permission;

  protected readonly EBatchActionEmployeePer = EBatchActionEmployeePer;
  public override configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm theo Tên nhân viên...',
    },
  ];
  public override configButtons: IFilterTopButton[] = [
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

  protected batchAction = null;
  public listBizUsers: CombinedUserAcl[] = [];
  public listFilteredBizUsers: CombinedUserAcl[] = [];
  public loading = {
    data: false,
  };
  public aclData: EntityPagination<UserAcl> = {
    rows: [],
    loading: false,
  };

  public permission = {
    edit: false,
    removePer: false,
  };

  constructor(
    private readonly modalService: BsModalService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit() {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        const list = biz.users?.map((user) => {
          if (user?.groupIds?.length)
            user.groups = this.currentBiz?.groups?.filter(
              (g) => user.groupIds?.includes(g.id),
            );
          if (user.roleIds?.length)
            user.roles = this.currentBiz?.roles?.filter(
              (g) => user.roleIds?.includes(g.id),
            );
          return user;
        });
        this.listBizUsers = list as CombinedUserAcl[];
        this.listFilteredBizUsers = list as CombinedUserAcl[];
      });
    if (!this.isInPermissionModal) {
      this.getUserAcl();
    } else {
      this.configFilters = [];
      this.configButtons = [];
      this.handleMapData(this.sourceData, true);
    }
    const permissions = this.authService.getUserPerByType(EPerActType.SETTING);
    this.permission.edit = permissions?.some(
      (per) => per === EPerActSetting.UPDATE_USER_ACCESS,
    );
    this.permission.removePer =
      this.isInPermissionModal &&
      permissions?.some(
        (per) => per === EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
      );
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
          this.aclData.rows = res.data;
          this.handleMapData(res.data);
        } else {
          this.commonService.handleResErr(res);
        }
      });
  }

  private findAclById(aclList: UserAcl[], id: string): UserAcl | undefined {
    return aclList?.find((item) => item.userId === id);
  }

  private findPropertyById(
    list: (UserAclBranch | UserAclDepartment | UserAclTeam | any)[],
    id: string,
  ): any {
    if (!list?.length) {
      return;
    }
    return list?.find((item) => item.id === id);
  }

  private mapProperties<T>(
    properties: (T | any)[],
    aclProperties: (T | any)[],
  ): any[] {
    return properties?.map((property) => {
      const aclProperty = this.findPropertyById(aclProperties, property.id);
      return {
        ...property,
        ...aclProperty,
        role: property?.role || aclProperty?.role,
        departments: this.mapProperties<UserAclDepartment>(
          property?.departments,
          aclProperty?.departments,
        ),
        teams: this.mapProperties<UserAclTeam>(
          property?.teams,
          aclProperty?.teams,
        ),
      };
    });
  }

  handleMapData(data: UserAcl[], onlyHasAcl = false) {
    this.listFilteredBizUsers = data?.map((item) => {
      const user = this.listBizUsers?.find((u) => u.id === item.userId);
      if (user) {
        user.aclBranches = this.mapProperties<UserAclBranch>(
          user.roleBranches,
          item.branches || [],
        );
        user.isActiveAcl = item.isActive;
      }
      return user as CombinedUserAcl;
    });

    if (onlyHasAcl) {
      this.listFilteredBizUsers = this.listFilteredBizUsers.filter(
        (user) => user.isActiveAcl !== undefined,
      );
    }

    if (this.isInPermissionModal) {
      this.item.rows = this.listFilteredBizUsers;
    }
  }

  override handleAction(name: string) {
    if (name === 'reload') {
      this.getUserAcl();
    }
    if (name === 'add_new') {
      const url = `${environment.urlDomain}/${this.bizAlias}/settings/staff`;
      window.open(url, '_blank');
    }
  }

  override onSearch(value: {term: string; name: string}) {
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

  removePerOfEmployees(employees: CombinedUserAcl[]) {
    if (!this.permissionDetail) {
      this.toastr.warning('Không tìm thấy thông tin quyền');
      return;
    }
    const title = 'Loại bỏ quyền khỏi nhân viên?';
    const subtext =
      employees.length === 1
        ? `nhân viên ${employees[0].name}`
        : `${employees.length} nhân viên đã chọn`;
    const description = `Bạn sắp bỏ quyền <b>${
      this.permissionDetail?.name || ''
    }</b> khỏi <b>${subtext}</b>, hành động này không thể hoàn tác. 
Nhân viên bị loại bỏ quyền có thể không được phép truy cập & sử dụng module.`;
    const okText = 'Xác nhận';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      const permissionId = this.permissionDetail?.id || '';
      const userIds = employees.map((user) => user.id);
      const data = {
        permissionId,
        userIds,
      };
      this.autoTaskService.userAcl
        .bulkRemovePer(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res.status === 200) {
            this.toastr.success('Loại bỏ quyền thành công');
            this.listFilteredBizUsers = this.listFilteredBizUsers.filter(
              (row) => !userIds.includes(row.id),
            );
            this.handleRefreshRow();
            this.cdr.detectChanges();
          } else {
            this.commonService.handleResErr(res);
          }
        });
    });
  }

  handleChangeBatchAction(action: EBatchActionEmployeePer) {
    if (action === EBatchActionEmployeePer.REMOVE) {
      const selectedRows = this.getCheckRows();
      this.removePerOfEmployees(selectedRows);
    }
    this.selectBatchActions?.handleClearClick();
  }
}
