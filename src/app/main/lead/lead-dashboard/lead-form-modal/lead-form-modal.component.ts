import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {finalize, takeUntil} from 'rxjs';
import {
  ILead,
  ILeadCreateDto,
  ILeadUpdateDto,
  EGenderType,
  IFolderLead,
  IFunnel,
} from '@app/types/lead';
import {StorageService} from '@app/services/api/storage.service';
import {ToastrService} from 'ngx-toastr';
import {Customer} from '@app/types/customer';
import {User} from '@app/types/viewmodels';
import {EChainNextActionType, ETaskChainType, ITeam} from '@app/types/flow';
import {ITaskChain} from './lead-form-modal.interface';
import {environment} from 'src/environments/environment';
import {TYPE_LEAD_OPTIONS} from '../../lead.variable';
import {ISetting, ISettingTabItem} from '@app/types/setting';
import {LeadDashboardData} from '../lead-dashboard-data';
import {DEFAULT_LEAD_TABS} from '@app/main/setting/tab-display/tab-display.variable';
import {isEmpty} from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lead-form-modal',
  templateUrl: './lead-form-modal.component.html',
  styleUrls: ['./lead-form-modal.component.scss'],
})
export class LeadFormModalComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Input() lead?: ILead;
  @Input() currentFunnelId?: string;
  @Output() saveEvent = new EventEmitter<ILeadCreateDto | ILeadUpdateDto>();

  private listBizUsers: User[] = [];

  public currentSetting!: ISetting;
  public isOpenBackDrop: boolean = false;
  public leadForm!: FormGroup;
  public fieldStates: {
    [key: string]: {editing: boolean; hover: boolean};
  } = {};
  public units = this.autoTaskService.getUserUnits(false);
  public EGenderType = EGenderType;
  public loading = {
    isSubmitting: false,
    isUploadingAvatar: false,
  };
  public funnelOptions: Array<
    IFunnel & {folderName: string; funnelGroupName: string}
  > = [];
  public tabsMenu = {
    left: [] as ISettingTabItem[],
    right: [] as ISettingTabItem[],
  };
  public activeLeftTabMenu: string = 'discuss';
  public activeRightTabMenu: string = 'history';
  public typeLeads = TYPE_LEAD_OPTIONS;
  public genderOptions = [
    {value: EGenderType.MALE, label: 'Nam'},
    {value: EGenderType.FEMALE, label: 'Nữ'},
    {value: EGenderType.OTHER, label: 'Khác'},
  ];
  public EChainNextActionType = EChainNextActionType;
  public readonly hoveredBadgeIndex: number = 0;
  public hoveredBadgeIndexCurrent: number = this.hoveredBadgeIndex;

  public submitted = false;
  public permissions = {
    canEditLead: true,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lead']) {
      this.initForm();
    }
  }

  override ngOnInit(): void {
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.tabsMenu.left = res.leadTabs.filter(
            (tab) => tab.positions.includes('left') && tab.active,
          );
          this.tabsMenu.right = res.leadTabs.filter(
            (tab) => tab.positions.includes('right') && tab.active,
          );
          if (isEmpty(this.tabsMenu.left)) {
            this.tabsMenu.left = DEFAULT_LEAD_TABS.filter(
              (tab) => tab.positions.includes('left') && tab.active,
            );
          }
          if (isEmpty(this.tabsMenu.right)) {
            this.tabsMenu.right = DEFAULT_LEAD_TABS.filter(
              (tab) => tab.positions.includes('right') && tab.active,
            );
          }

          this.activeLeftTabMenu = this.tabsMenu.left[0]?.key || 'discuss';
          this.activeRightTabMenu = this.tabsMenu.right[0]?.key || 'history';
        }
      });
    this.initForm();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
    // this.initializeBranch();
    this.transformFunnelOptions();
  }

  getTaskDetailUrl(taskId: string) {
    return `${environment.urlDomain}/${this.currentBiz?.alias || ''}/${
      environment.module
    }/dashboard?id=${taskId}`;
  }

  initForm(): void {
    const initialTagIds =
      this.lead?.tagIds || this.lead?.tags?.map((t) => t.id) || [];

    this.leadForm = this.fb.group({
      name: [this.lead?.name || '', [Validators.required]],
      phone: [this.lead?.phone || '', [Validators.required]],
      email: [this.lead?.email || ''],
      gender: [this.lead?.gender || EGenderType.OTHER],
      tagIds: [initialTagIds],
      picture: [this.lead?.picture || ''],
      sourceId: [this.lead?.['sourceId'] || null],
      funnelId: [
        this.lead?.['funnelId'] || this.currentFunnelId || '',
        [Validators.required],
      ],
      address: [this.lead?.address || ''],
      street: [this.lead?.street || ''],
      province: [this.lead?.province || null],
      provinceCode: [this.lead?.provinceCode || null],
      district: [this.lead?.district || null],
      districtCode: [this.lead?.districtCode || null],
      ward: [this.lead?.ward || null],
      wardCode: [this.lead?.wardCode || null],
      teams: this.fb.array([]),
      typeLead: ['lead'],
    });

    if (this.currentFunnelId) {
      this.leadForm.patchValue({
        funnelId: this.currentFunnelId,
      });
    }
  }

  get formTeams(): FormArray {
    return this.leadForm.get('teams') as FormArray;
  }

  get tagIdsControl(): FormControl {
    return this.leadForm?.get('tagIds') as FormControl;
  }

  get nameControl(): FormControl {
    return this.leadForm?.get('name') as FormControl;
  }

  get phoneControl(): FormControl {
    return this.leadForm?.get('phone') as FormControl;
  }

  get emailControl(): FormControl {
    return this.leadForm?.get('email') as FormControl;
  }

  get funnelControl(): FormControl {
    return this.leadForm?.get('funnelId') as FormControl;
  }

  get f(): {[key: string]: any} {
    return this.leadForm.controls;
  }

  get isEditMode(): boolean {
    return !!this.lead;
  }

  transformFunnelOptions(): void {
    this.funnelOptions = [];
    this.folder.rows?.forEach((folder) => {
      folder?.funnelGroups?.forEach((funnelGroup) => {
        funnelGroup.funnels?.forEach((funnel) => {
          this.funnelOptions.push({
            ...funnel,
            folderName: folder.name,
            funnelGroupName: funnelGroup.name,
          });
        });
      });
    });
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.leadForm.get(fieldName);
    if (control?.hasError('required')) {
      if (fieldName === 'funnelId') return 'Vui lòng chọn Phễu';
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('email')) {
      return 'Email không hợp lệ';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.leadForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onAvatarClick(): void {
    if (this.loading.isUploadingAvatar) {
      return;
    }

    this.loading.isUploadingAvatar = true;
    const accept = 'image/x-png,image/gif,image/jpeg,image/x-icon';

    this.storageService.attach(accept, 2).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          const avatarUrl = res.data[0];
          this.leadForm.patchValue({picture: avatarUrl});
        }
        this.loading.isUploadingAvatar = false;
      },
      error: (err) => {
        this.toastr.warning(err || 'Upload ảnh đại diện thất bại');
        this.loading.isUploadingAvatar = false;
      },
    });
  }

  get avatarUrl(): string {
    return this.leadForm.get('picture')?.value || 'assets/images/avatar.svg';
  }

  handleCombineAddress(): void {
    const {street, district, ward, province} = this.leadForm.value;
    const addressParts = [street, ward, district, province].filter(Boolean);
    this.leadForm.patchValue({
      address: addressParts.join(', '),
    });
  }

  groupByFolder = (
    item: IFunnel & {folderName: string; funnelGroupName: string},
  ) => {
    return `${item.folderName} - ${item.funnelGroupName}`;
  };

  groupValueFn = (key: string, children: any[]) => {
    return children;
  };

  getFunnelName(): string {
    const funnelId = this.leadForm.get('funnelId')?.value;
    if (!funnelId) return '-';
    const funnel = this.funnelOptions.find((f) => f.id === funnelId);
    return funnel?.name || '-';
  }

  onCustomerSelect(customer?: Customer): void {
    if (!customer) return;
  }

  private loadAutoTaskSetting(): void {
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.currentSetting = setting;
        if (this.currentSetting?.roles?.length && this.currentBiz) {
          this.mappingTeams();
        }
      });
  }

  private loadBizUsers(): void {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz;
        this.listBizUsers = biz?.users || [];
        if (this.currentSetting?.roles?.length && this.currentBiz) {
          this.mappingTeams();
        }
      });
  }

  mappingTeams(): void {
    this.formTeams.clear();
    this.currentSetting?.roles?.forEach((roleId: string) => {
      const findRole = this.currentBiz?.roles?.find(
        (r: any) => r.id === roleId,
      );

      const findTeam = this.lead?.teams?.find(
        (team: ITeam) => team.roleId === roleId,
      );

      this.formTeams.push(
        this.fb.group({
          roleId: findRole?.id || roleId,
          roleIcon: findRole?.icon || 'fa-user',
          roleName: findRole?.name || 'Unknown Role',
          userId: findTeam?.userId || null,
          userName: findTeam?.userName || null,
          userPicture: findTeam?.userPicture || null,
          userEmail: findTeam?.userEmail || null,
        }),
      );
    });
  }

  onChooseTeam(index: number, user: User): void {
    const teamControl = this.formTeams.at(index);
    teamControl.patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  onRemoveTeam(index: number): void {
    const teamControl = this.formTeams.at(index);
    teamControl.patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }

  getAvailableUsers(roleId?: string): User[] {
    if (!roleId || !this.listBizUsers?.length) {
      return [];
    }

    return this.listBizUsers.filter((user: User) => {
      if (!user.isActive) return false;

      const userRoleIds = user.roleIds || [];
      return userRoleIds.includes(roleId);
    });
  }

  getChainName(chain: ITaskChain): string {
    if (chain.name) {
      return chain.name;
    }
    if (chain.status === ETaskChainType.CLOSED) {
      return 'CHỐT ĐƠN';
    }
    return 'TÁC VỤ ĐANG MỞ';
  }

  getSelectedTags(): any[] {
    const tagIds = this.tagIdsControl?.value || [];
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    return this.tags.rows.filter((tag) => tagIds.includes(tag.id));
  }

  getFieldState(fieldName: string) {
    if (!this.fieldStates[fieldName]) {
      this.fieldStates[fieldName] = {
        editing: false,
        hover: false,
      };
    }
    return this.fieldStates[fieldName];
  }

  startFieldEdit(fieldName: string): void {
    this.getFieldState(fieldName).editing = true;
    setTimeout(() => {
      const input = document.querySelector(
        `input[formControlName="${fieldName}"]`,
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      const select = document.querySelector(
        `ng-select[formControlName="${fieldName}"]`,
      ) as HTMLSelectElement;
      if (select) {
        const input = select?.querySelector('input');
        input?.focus();
      }
    }, 50);
  }

  isValueChanged(newValue: any, oldValue: any): boolean {
    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      if (newValue.length !== oldValue.length) return true;
      return !newValue.every((val) => oldValue.includes(val));
    }
    return newValue !== oldValue;
  }

  initializeBranch(): void {
    if (this.lead?.branch) {
      const foundUnit = this.autoTaskService.findUnitFromData(this.lead.branch);
      if (foundUnit) {
        this.leadForm.patchValue({
          branch: foundUnit as any,
        });
      }
    } else {
      let branch = this.autoTaskService.getFirstUnit();
      if (branch) {
        this.leadForm.patchValue({branch} as any);
      }
    }
  }

  onHoverBadge(index: number): void {
    if (this.hoveredBadgeIndex < index) {
      this.hoveredBadgeIndexCurrent = index;
    }
  }

  onLeaveBadge(index: number): void {
    this.hoveredBadgeIndexCurrent = this.hoveredBadgeIndex;
  }

  onClickBadge(status: {statusId: string; statusName: string}): void {
    if (!this.lead?.id || !status?.statusId) {
      return;
    }

    if (this.lead.statusId === status.statusId) {
      return;
    }

    this.loading.isSubmitting = true;
    this.leadService.lead
      .update(this.lead.id, {id: this.lead.id, statusId: status.statusId})
      .pipe(
        finalize(() => (this.loading.isSubmitting = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200 || res.status === 201) {
            this.toastr.success('Cập nhật trạng thái lead thành công');
            if (this.lead) {
              this.lead.statusId = status.statusId;
              this.lead.status = res.data?.status;
            }
            Object.assign(this.lead || {}, res.data);
            this.saveEvent.emit(res.data);
          } else {
            this.toastr.error(
              res.message || 'Có lỗi xảy ra khi cập nhật trạng thái',
            );
          }
        },
        error: (err) => {
          this.toastr.error(
            err.message || 'Có lỗi xảy ra khi cập nhật trạng thái lead',
          );
        },
      });
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.loading.isSubmitting = true;

    const formValue = this.leadForm.value;
    const teams = formValue.teams
      .filter((t: any) => t.userId)
      .map((t: any) => ({
        roleId: t.roleId,
        userId: t.userId,
      }));

    const submitData = {
      ...formValue,
      teams,
      branch: formValue.branch?.id || formValue.branch,
    };

    if (this.isEditMode && this.lead?.id) {
      // Update existing lead
      this.leadService.lead
        .update(this.lead.id, {
          id: this.lead.id,
          ...submitData,
        })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading.isSubmitting = false;
            this.submitted = false;
          }),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200 || res.status === 201) {
              this.toastr.success('Cập nhật lead thành công');
              this.saveEvent.emit(res.data);
              this.modalRef.hide();
            } else {
              this.toastr.error(res.message || 'Cập nhật lead thất bại');
            }
          },
          error: (err) => {
            this.toastr.error(err.message || 'Cập nhật lead thất bại');
          },
        });
    } else {
      // Create new lead
      this.leadService.lead
        .create(submitData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading.isSubmitting = false;
            this.submitted = false;
          }),
        )
        .subscribe({
          next: (res) => {
            if (res.status === 200 || res.status === 201) {
              this.toastr.success('Tạo lead thành công');
              this.saveEvent.emit(res.data);
              this.modalRef.hide();
            } else {
              this.toastr.error(res.message || 'Tạo lead thất bại');
            }
          },
          error: (err) => {
            this.toastr.error(err.message || 'Tạo lead thất bại');
          },
        });
    }
  }

  navigateToTabSettings() {
    this.hideModal();

    this.router.navigate([`/setting/tab-display`], {
      fragment: 'LEAD',
    });
  }
}
