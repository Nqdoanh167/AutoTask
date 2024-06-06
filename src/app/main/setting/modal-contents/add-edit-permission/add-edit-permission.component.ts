import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {finalize, Subject, takeUntil} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {
  EPerActFlow,
  EPerActSetting,
  EPerActTask,
  EPerActType,
  ETabUpdatePermissionsModal,
  IPermissionGroups,
  Permission,
  PermissionDto,
} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-add-edit-permission',
  templateUrl: './add-edit-permission.component.html',
  styleUrls: ['./add-edit-permission.component.scss'],
})
export class AddEditPermissionComponent implements OnInit, OnDestroy {
  @Input() sourceData?: Permission;
  @Output() successEvent = new EventEmitter();

  public tabs = [
    {key: ETabUpdatePermissionsModal.INFORMATION, name: 'Thông tin'},
    {key: ETabUpdatePermissionsModal.EMPLOYEE, name: 'Danh sách nhân viên'},
  ];
  public activeTab: ETabUpdatePermissionsModal =
    ETabUpdatePermissionsModal.INFORMATION;

  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    isActive: [false],
    description: [null],
    permissionAction: this.fb.group({
      task: [],
      flow: [],
      setting: [],
    }),
  });

  public permissionGroups: IPermissionGroups[] = [
    {
      name: 'Quản lý Task',
      key: EPerActType.TASK,
      isOpen: false,
      permissions: [
        {key: EPerActTask.CREATE_TASK, name: 'Tạo Task'},
        {key: EPerActTask.UPDATE_TASK, name: 'Cập nhật Task'},
        {key: EPerActTask.DELETE_TASK, name: 'Xóa Task'},
        {key: EPerActTask.VIEW_INFORMATION_TASK, name: 'Xem tab thông tin'},
        {key: EPerActTask.VIEW_ORDER_TASK, name: 'Xem tab đơn hàng'},
        {key: EPerActTask.VIEW_HISTORY_TASK, name: 'Xem tab lịch sử'},
        {key: EPerActTask.CREATE_ORDER, name: 'Tạo đơn hàng'},
        {
          key: EPerActTask.MANAGER_CHAIN,
          name: 'Quản lý chuỗi công việc (Không chỉnh thời gian)',
        },
        {
          key: EPerActTask.EDIT_TIME_ACTION,
          name: 'Chỉnh sửa thời gian hành động',
        },
        {
          key: EPerActTask.MANGER_ACTION,
          name: 'Quản lý hành động trong chuỗi (Không chỉnh thời gian)',
        },
      ],
    },
    {
      name: 'Cấu hình quy tắc và dữ liệu',
      key: EPerActType.FLOW,
      isOpen: false,
      permissions: [{key: EPerActFlow.FLOW, name: 'Mặc định'}],
    },
    {
      name: 'Cài đặt',
      key: EPerActType.SETTING,
      isOpen: false,
      permissions: [
        {key: EPerActSetting.SOURCE_SETTING, name: 'Cấu hình Nguồn dữ liệu'},
        {key: EPerActSetting.TAG_SETTING, name: 'Cấu hình Tag'},
        {key: EPerActSetting.ROLE_SETTING, name: 'Cấu hình vai trò'},
        {
          key: EPerActSetting.PERMISSION_SETTING_USER_IN_BRANCH,
          name: 'Cấu hình quyền cho nhân viên cùng chi nhánh (QL chi nhánh)',
        },
        {
          key: EPerActSetting.PERMISSION_SETTING_USER_IN_DEPARTMENT,
          name: 'Cấu hình quyền cho nhân viên cùng phòng ban (QL phòng ban)',
        },
        {
          key: EPerActSetting.PERMISSION_SETTING_USER_IN_TEAM,
          name: 'Cấu hình quyền cho nhân viên cùng đội nhóm (QL đội nhóm)',
        },
        {key: EPerActSetting.PERMISSION_SETTING_ACCESS, name: 'Cấu hình quyền'},
      ],
    },
  ];

  public submitted = false;
  public loading = {
    submit: false,
    data: false,
  };

  protected readonly ETabUpdatePermissionsModal = ETabUpdatePermissionsModal;

  private destroy$ = new Subject();

  constructor(
    private readonly commonService: CommonService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly autoTaskService: AutoTaskService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.pathForm(this.sourceData);
    }
  }

  pathForm(data?: Permission) {
    this.updateForm.patchValue({
      ...this.sourceData,
    } as Permission as any);
    const permissionAction = this.sourceData;
    const permissionActionForm = this.updateForm.get('permissionAction')
      ?.value || {task: [], flow: [], setting: []};
    const {task, flow, setting} = permissionActionForm;
    if (permissionAction) {
      Object.keys(permissionAction.permissionAction).forEach((key) => {
        const group = this.permissionGroups.find((item) => item.key === key);
        if (group) {
          group.isOpen = true;
        }
      });
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {
    this.loading.submit = true;
    const data = this.updateForm.value as unknown as PermissionDto;
    if (this.sourceData) {
      this.autoTaskService.permission
        .update(this.sourceData.id, data)
        .pipe(
          finalize(() => (this.loading.submit = false)),
          takeUntil(this.destroy$),
        )
        .subscribe((res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
            this.successEvent.emit();
          } else {
            this.commonService.handleResErr(res);
          }
        });
    } else {
      this.autoTaskService.permission
        .create(data)
        .pipe(
          finalize(() => (this.loading.submit = false)),
          takeUntil(this.destroy$),
        )
        .subscribe((res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('create');
            this.successEvent.emit();
          } else {
            this.commonService.handleResErr(res);
          }
        });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  selectTab(tab: ETabUpdatePermissionsModal) {
    this.activeTab = tab;
  }

  handleToggleGroup(group: IPermissionGroups) {
    group.isOpen = !group.isOpen;
    const {key} = group;
    this.updateForm.get(`permissionAction.${key}`)?.setValue(null);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
