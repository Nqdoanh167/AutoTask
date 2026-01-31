import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Input,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {finalize, takeUntil} from 'rxjs';
import {EGenderType, ILead, IFolderLead, IFunnel} from '@app/types/lead';
import {StorageService} from '@app/services/api/storage.service';
import {ToastrService} from 'ngx-toastr';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {LeadService} from '@app/services/api/lead.service';
import {User} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {ISetting} from '@app/types/setting';
import {ISelectedLocation} from '@app/types/location';
import {IPlatform} from '../lead-form-modal/lead-form-modal.interface';
import {LeadDashboardData} from '../lead-dashboard.definition';

@Component({
  selector: 'app-lead-update-modal',
  templateUrl: './lead-update-modal.component.html',
  styleUrls: ['./lead-update-modal.component.scss'],
})
export class LeadUpdateModalComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @Output() saveEvent = new EventEmitter<ILead>();
  @Input() lead?: ILead;

  leadForm!: FormGroup;
  currentSetting!: ISetting;
  listBizUsers: User[] = [];
  public EGenderType = EGenderType;
  private folderLeads: IFolderLead[] = [];
  public funnelOptions: Array<
    IFunnel & {folderName: string; funnelGroupName: string}
  > = [];
  public loading = {
    isSubmitting: false,
    isUploadingAvatar: false,
  };
  public submitted = false;
  public selectedLocation: ISelectedLocation = {
    province: undefined,
    district: undefined,
    ward: undefined,
  };
  public platforms: IPlatform[] = [];

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
    private storageService: StorageService,
    private toastr: ToastrService,
    override autoTaskService: AutoTaskService,
    override leadService: LeadService,
    override authService: AuthService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.initForm();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
    this.getFolderLead();
    this.loadLeadData();
  }

  initForm(): void {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      gender: [EGenderType.OTHER],
      birthday: [null],
      tagIds: [[]],
      picture: [''],
      teams: this.fb.array([]),
      funnelId: [null, [Validators.required]],
      provinceCode: [null],
      districtCode: [null],
      wardCode: [null],
      ward: [null],
      district: [null],
      province: [null],
      street: [''],
      address: [''],
      platforms: [[]],
    });
  }

  loadLeadData(): void {
    if (!this.lead) return;

    const location: ISelectedLocation = {};
    if (this.lead.provinceCode && this.lead.province) {
      location.province = {
        provinceCode: this.lead.provinceCode,
        province: this.lead.province,
      };
    }
    if (this.lead.districtCode && this.lead.district) {
      location.district = {
        districtCode: this.lead.districtCode,
        district: this.lead.district,
      };
    }
    if (this.lead.wardCode && this.lead.ward) {
      location.ward = {
        wardCode: this.lead.wardCode,
        ward: this.lead.ward,
      };
    }
    this.selectedLocation = location;
    this.platforms = this.lead.platforms || [];

    this.leadForm.patchValue({
      name: this.lead.name || '',
      phone: this.lead.phone || '',
      email: this.lead.email || '',
      gender: this.lead.gender || EGenderType.OTHER,
      birthday: this.lead.birthday || null,
      tagIds: this.lead.tagIds || [],
      picture: this.lead.picture || '',
      funnelId: this.lead.funnelId || null,
      provinceCode: this.lead.provinceCode || null,
      districtCode: this.lead.districtCode || null,
      wardCode: this.lead.wardCode || null,
      province: this.lead.province || null,
      ward: this.lead.ward || null,
      district: this.lead.district || null,
      street: this.lead.street || '',
      address: this.lead.address || '',
    });

    if (this.currentSetting?.roles?.length && this.currentBiz) {
      this.mappingTeams();
    }
  }

  get f(): {[key: string]: AbstractControl} {
    return this.leadForm.controls;
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

  get avatarUrl(): string {
    return this.leadForm.get('picture')?.value || 'assets/images/avatar.svg';
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
    if (!this.lead?.teams) {
      this.formTeams.clear();
      this.currentSetting?.roles?.forEach((roleId: string) => {
        const findRole = this.currentBiz?.roles?.find(
          (r: any) => r.id === roleId,
        );
        this.formTeams.push(
          this.fb.group({
            roleId: findRole?.id || roleId,
            roleIcon: findRole?.icon || 'fa-user',
            roleName: findRole?.name || 'Unknown Role',
            userId: null,
            userName: null,
            userPicture: null,
            userEmail: null,
          }),
        );
      });
      return;
    }

    this.formTeams.clear();
    this.currentSetting?.roles?.forEach((roleId: string) => {
      const findRole = this.currentBiz?.roles?.find(
        (r: any) => r.id === roleId,
      );
      const existingTeam = this.lead?.teams?.find(
        (t: any) => t.roleId === roleId,
      );

      this.formTeams.push(
        this.fb.group({
          roleId: findRole?.id || roleId,
          roleIcon: findRole?.icon || 'fa-user',
          roleName: findRole?.name || 'Unknown Role',
          userId: existingTeam?.userId || null,
          userName: existingTeam?.userName || null,
          userPicture: existingTeam?.userPicture || null,
          userEmail: existingTeam?.userEmail || null,
        }),
      );
    });
  }

  onChooseTeam(index: number, user: User): void {
    this.formTeams.at(index).patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  onRemoveTeam(index: number): void {
    this.formTeams.at(index).patchValue({
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

  getSelectedTags(): any[] {
    const tagIds = this.tagIdsControl?.value || [];
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    return this.tags.rows.filter((tag) => tagIds.includes(tag.id));
  }

  handleLocationChange(location: ISelectedLocation): void {
    this.selectedLocation = location;
    this.leadForm.patchValue({
      provinceCode: location.province?.provinceCode || null,
      districtCode: location.district?.districtCode || null,
      wardCode: location.ward?.wardCode || null,
      province: location.province?.province || null,
      district: location.district?.district || null,
      ward: location.ward?.ward || null,
    });
    this.handleCombineAddress();
  }

  handleCombineAddress(): void {
    const street = this.leadForm.get('street')?.value || '';
    const parts: string[] = [];
    if (street) parts.push(street);
    if (this.selectedLocation.ward?.ward)
      parts.push(this.selectedLocation.ward.ward);
    if (this.selectedLocation.district?.district)
      parts.push(this.selectedLocation.district.district);
    if (this.selectedLocation.province?.province)
      parts.push(this.selectedLocation.province.province);
    const address = parts.join(', ');
    this.leadForm.patchValue({address});
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.leadForm.invalid) {
      return;
    }

    this.loading.isSubmitting = true;

    const formValue = this.leadForm.value;
    const updateData = {
      id: this.lead?.id,
      ...formValue,
      platforms: this.platforms,
      teams: formValue.teams
        .filter((t: any) => t.userId)
        .map((t: any) => ({
          roleId: t.roleId,
          userId: t.userId,
        })),
    };

    if (!this.lead?.id) {
      this.toastr.error('Không tìm thấy ID lead');
      return;
    }

    this.leadService.lead
      .update(this.lead.id, updateData)
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
            this.onCancel();
          } else {
            this.toastr.error(res.message);
          }
        },
        error: (err) => {
          this.toastr.error(err.message);
        },
      });
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getFolderLead(): void {
    this.leadService.listLeadFolder.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res) {
          this.folderLeads = res || [];
          this.transformFunnelOptions();
        }
      },
      error: (err: any) => {
        console.error('Error loading folder leads:', err);
      },
    });
  }

  transformFunnelOptions(): void {
    this.funnelOptions = [];
    this.folderLeads?.forEach((folder) => {
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

  groupByFolder = (
    item: IFunnel & {folderName: string; funnelGroupName: string},
  ) => {
    return `${item.folderName} - ${item.funnelGroupName}`;
  };

  handleChangeBirthday(value: any): void {
    this.leadForm.patchValue({
      birthday: value,
    });
  }
}
