import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
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
export class AddEditPermissionComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() sourceData?: Permission;
  @Output() successEvent = new EventEmitter();

  public tabs = [
    {key: ETabUpdatePermissionsModal.INFORMATION, name: 'Thông tin'},
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
      name: 'Quản lý Tác vụ',
      key: EPerActType.TASK,
      isOpen: false,
      groups: [
        {
          name: 'Tính năng cơ bản',
          permissions: [
            {
              key: EPerActTask.VIEW_TASK,
              name: 'Truy cập Menu Quản lý tác vụ + Xem Tác vụ',
              isRootPer: true,
              tooltip: `<ul>
                <li>1. Nhân viên bình thường chỉ được xem tác vụ được giao đúng cho Chi nhánh/Phòng ban/Đội nhóm của họ và phải được gán vai trò trên tác vụ.</li>
                <li>2. Quản trị đội nhóm xem được toàn bộ tác vụ của đội.</li>
                <li>3. Quản trị phòng ban xem được toàn bộ tác vụ của phòng và các đội trong đó</li>
                <li>4. Quản trị chi nhánh xem được toàn bộ tác vụ của chi nhánh và phòng ban, đội nhóm trong đó</li>
                <li>5. ROOT hoặc quản lý Biz xem được toàn bộ tác vụ của mọi người trong Biz</li>
                </ul>`,
            },
            {
              key: EPerActTask.VIEW_TASK_SAME_LEVEL,
              name: 'Xem tác vụ của nhân sự cùng cấp',
              tooltip:
                'Nhân viên bình thường sẽ xem được tác vụ của các nhân sự cùng đội nhóm với họ',
            },
            {
              key: EPerActTask.CREATE_TASK,
              name: 'Thêm Tác vụ',
              tooltip:
                'Khi tạo tác vụ, nhân viên có thể điền và chỉnh sửa hầu hết các trường có trong tác vụ (tên, chi nhánh, vai trò, chuỗi hành động,...), kể cả khi họ không được cấp quyền sửa tác vụ ',
            },
            {
              key: EPerActTask.UPDATE_TASK,
              name: 'Sửa Tác vụ',
              tooltip:
                'Chỉnh sửa những thông tin cơ bản của tác vụ như Tên tác vụ, Chi nhánh, Nguồn dữ liệu, Vai trò, Thẻ Tag, Thông tin khách hàng, Ghi chú, Sản phẩm quan tâm\n',
            },
            {key: EPerActTask.DELETE_TASK, name: 'Xóa Tác vụ'},
          ],
        },
        {
          name: 'Chi tiết Tác vụ',
          permissions: [
            {key: EPerActTask.VIEW_HISTORY_TASK, name: 'Xem tab lịch sử'},
            {
              key: EPerActTask.MANAGE_CHAIN,
              name: 'Quản lý chuỗi hành động',
              tooltip:
                'Thêm Sửa/Xóa/Đóng chuỗi + Thêm/Sửa/Xóa hành động trong chuỗi (không bao gồm quyền chỉnh sửa thời gian kết thúc hành động) ',
            },
            {
              key: EPerActTask.EDIT_TIME_ACTION,
              name: 'Chỉnh thời gian kết thúc hành động',
            },
          ],
        },
        {
          name: 'Tính năng hô trợ',
          permissions: [
            {
              key: EPerActTask.CREATE_ORDER,
              name: 'Tạo đơn hàng từ Tác vụ',
              tooltip:
                'Nhân viên có thể tạo Đơn hàng trong module Quản lý bán hàng kể cả khi không có quyền truy cập module này',
            },
          ],
        },
      ],
    },
    {
      name: 'Cấu hình quy tắc và dữ liệu',
      key: EPerActType.FLOW,
      isOpen: false,
      permissions: [
        {
          key: EPerActFlow.VIEW_FLOW,
          name: 'Truy cập Menu Cấu hình quy tắc và dữ liệu và Xem Cấu hình quy tắc & Cấu hình dữ liệu',
          isRootPer: true,
        },
        {
          key: EPerActFlow.UPDATE_FLOW,
          name: 'Thêm, Sửa , Xóa Cấu hình quy tắc & Cấu hình dữ liệu',
        },
      ],
    },
    {
      name: 'Cài đặt',
      key: EPerActType.SETTING,
      isOpen: false,
      groups: [
        {
          name: 'Tính năng cơ bản',
          permissions: [
            {
              key: EPerActSetting.VIEW_MASTER_DATA,
              name: 'Truy cập Menu Cài đặt và Xem Nguồn dữ liệu, Tag, Phân quyền và Vai trò ',
              isRootPer: true,
              tooltip: `<ul>
                <li>- Nhân viên có thể được truy cập vào các menu con bên trong menu Cài đặt để xem các master data như Nguồn dữ liệu, Thẻ tag, Vai trò, Quyền.</li>
                <li>- Đối với danh sách Nhân viên trong Phân quyền:</li>
                <li>1. Nhân viên bình thường chỉ thấy được chính họ trên danh sách.</li>
                <li>2. Quản trị đội nhóm xem được toàn bộ nhân viên trong đội mà họ trên danh sách.</li>
                <li>3. Quản trị phòng ban xem được toàn bộ nhân viên của họ trong phòng và đội mà họ quản lý.</li>
                <li>4. Quản trị chi nhánh xem được toàn bộ nhân viên của họ trong chi nhánh, phòng ban và đội mà họ quản lý.</li>
                <li>5. ROOT hoặc quản lý Biz xem được toàn bộ mọi người trong Biz.</li>
                </ul>`,
            },
            {
              key: EPerActSetting.UPDATE_SOURCE_SETTING,
              name: 'Thêm, Sửa, Xóa Nguồn dữ liệu',
            },
            {
              key: EPerActSetting.UPDATE_TAG_SETTING,
              name: 'Thêm, Sửa, Xóa Tag',
            },
            {
              key: EPerActSetting.UPDATE_ROLE_SETTING,
              name: 'Thêm, Sửa, Xóa Vai trò',
            },
          ],
        },
        {
          name: 'Phân quyền',
          permissions: [
            {
              key: EPerActSetting.VIEW_USER_ACCESS_SAME_LEVEL,
              name: 'Xem nhân sự cùng cấp',
              tooltip:
                'Nhân viên bình thường sẽ xem được các nhân sự cùng đội nhóm với họ trên danh sách nhân viên.',
            },
            {
              key: EPerActSetting.UPDATE_USER_ACCESS,
              name: 'Gán quyền cho nhân sự',
            },
            {
              key: EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
              name: 'Thêm, Sửa, Xóa Quyền',
            },
          ],
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
      this.tabs.push({
        key: ETabUpdatePermissionsModal.EMPLOYEE,
        name: 'Danh sách nhân viên',
      });
      this.pathForm(this.sourceData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.cdr.markForCheck();
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
  }

  onCheckboxChange(
    event: Event,
    permission: IPermissionItem,
    group: IPermissionGroups,
  ) {
    try {
      const {checked} = event.target as HTMLInputElement;
      let value: string[] =
        this.updateForm.get(`permissionAction.${group.key}`)?.value || [];
      if (checked) {
        value.push(permission.key);
      } else {
        const index = value.indexOf(permission.key);
        if (index > -1) {
          value.splice(index, 1);
        }
        if (permission.isRootPer) {
          value = [];
        }
      }
      this.updateForm
        .get(`permissionAction.${group.key}`)
        ?.setValue(value as any);
    } catch (e) {
      console.log(e);
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
