import {Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
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
import {User} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {LeadDashboardData} from '../lead-dashboard.definition';

@Component({
  selector: 'app-lead-create-modal',
  templateUrl: './lead-create-modal.component.html',
  styleUrls: ['./lead-create-modal.component.scss'],
})
export class LeadCreateModalComponent
  extends LeadDashboardData
  implements OnInit
{
  @Output() saveEvent = new EventEmitter<ILead>();
  @Input() currentFunnelId?: string;
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

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
    private storageService: StorageService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.initForm();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
    this.getFolderLead();
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
    });

    if (this.currentFunnelId) {
      this.leadForm.patchValue({
        funnelId: this.currentFunnelId,
      });
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

  onSubmit(): void {
    this.submitted = true;
    if (this.leadForm.invalid) {
      return;
    }

    this.loading.isSubmitting = true;

    this.leadService.lead
      .create(this.leadForm.value)
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
    this.leadService.leadFolder
      .getWithFunnels({
        page: 1,
        limit: 1000,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            this.folderLeads = res.data;
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
}
