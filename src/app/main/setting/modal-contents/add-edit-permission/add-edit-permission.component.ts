import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  IPermissionItem,
  Permission,
  PermissionDto,
} from '@app/types/setting';
import {AutoTaskService} from '@app/services/api/autoTask.service';

@Component({
  selector: 'app-add-edit-permission',
  templateUrl: './add-edit-permission.component.html',
  styleUrls: ['./add-edit-permission.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    isActive: [true],
    description: [null],
    permissionAction: this.fb.group({
      task: [],
      flow: [],
      setting: [],
    }),
  });

  public permissionGroups: IPermissionGroups[] = [
    {
      name: 'Quản lý tác vụ',
      key: EPerActType.TASK,
      isOpen: false,
      permissions: [
        {key: EPerActTask.VIEW_TASK, name: 'Xem Task'},
        {key: EPerActTask.VIEW_TASK_BIZ, name: 'Xem toàn bộ Task trong Biz'},
        {key: EPerActTask.CREATE_TASK, name: 'Tạo Task'},
        {key: EPerActTask.UPDATE_TASK, name: 'Cập nhật Task'},
        {key: EPerActTask.DELETE_TASK, name: 'Xóa Task'},
        {key: EPerActTask.VIEW_INFORMATION_TASK, name: 'Xem tab thông tin'},
        {key: EPerActTask.VIEW_HISTORY_TASK, name: 'Xem tab lịch sử'},
        {key: EPerActTask.CREATE_ORDER, name: 'Tạo đơn hàng'},
        {
          key: EPerActTask.MANAGE_CHAIN,
          name: 'Quản lý chuỗi công việc',
        },
        {
          key: EPerActTask.EDIT_TIME_ACTION,
          name: 'Chỉnh sửa thời gian hành động',
        },
        {
          key: EPerActTask.MANAGE_ACTION,
          name: 'Quản lý hành động trong chuỗi (Không chỉnh thời gian)',
        },
      ],
    },
    {
      name: 'Cấu hình quy tắc và dữ liệu',
      key: EPerActType.FLOW,
      isOpen: false,
      permissions: [
        {key: EPerActFlow.VIEW_FLOW, name: 'Xem Cấu hình quy tắc & dữ liệu'},
        {key: EPerActFlow.UPDATE_FLOW, name: 'Sửa Cấu hình quy tắc & dữ liệu'},
      ],
    },
    {
      name: 'Cài đặt',
      key: EPerActType.SETTING,
      isOpen: false,
      permissions: [
        {key: EPerActSetting.VIEW_SOURCE_SETTING, name: 'Xem Nguồn dữ liệu'},
        {key: EPerActSetting.VIEW_TAG_SETTING, name: 'Xem Tag'},
        {key: EPerActSetting.VIEW_ROLE_SETTING, name: 'Xem Vai trò'},
        {
          key: EPerActSetting.UPDATE_SOURCE_SETTING,
          name: 'Thêm, Sửa, Xóa Nguồn dữ liệu',
        },
        {key: EPerActSetting.UPDATE_TAG_SETTING, name: 'Thêm, Sửa, Xóa Tag'},
        {
          key: EPerActSetting.UPDATE_ROLE_SETTING,
          name: 'Thêm, Sửa, Xóa Vai trò',
        },
        {
          key: EPerActSetting.VIEW_USER_ACCESS,
          name: 'Xem Nhân viên',
        },
        {
          key: EPerActSetting.VIEW_USER_ACCESS_BIZ,
          name: 'Xem toàn bộ nhân sự trong Nhân viên',
        },
        {
          key: EPerActSetting.UPDATE_USER_ACCESS,
          name: 'Gán quyền cho nhân sự',
        },
        {
          key: EPerActSetting.VIEW_PERMISSION_SETTING_ACCESS,
          name: 'Xem Quyền',
        },
        {
          key: EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
          name: 'Thêm, Sửa, Xóa Quyền',
        },
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
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  formPermissionAction(key: EPerActType) {
    return this.updateForm.get(`permissionAction.${key}`) as AbstractControl;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.pathForm(this.sourceData);
    }
  }

  pathForm(data?: Permission) {
    this.updateForm.patchValue({
      ...data,
    } as Permission as any);
    const permissionAction = data?.permissionAction || {
      task: [],
      flow: [],
      setting: [],
    };
    if (permissionAction) {
      Object.keys(permissionAction).forEach((key) => {
        const values = permissionAction[key as EPerActType] || [];
        if (!values.length) return;
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
    this.cdr.detectChanges();
  }

  onCheckboxChange(
    event: Event,
    permission: IPermissionItem,
    group: IPermissionGroups,
  ) {
    const {checked} = event.target as HTMLInputElement;
    const value: string[] =
      this.updateForm.get(`permissionAction.${group.key}`)?.value || [];
    if (checked) {
      value.push(permission.key);
    } else {
      const index = value.indexOf(permission.key);
      if (index > -1) {
        value.splice(index, 1);
      }
    }
    this.updateForm
      .get(`permissionAction.${group.key}`)
      ?.setValue(value as any);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
