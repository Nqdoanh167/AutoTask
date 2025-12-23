import {Component, OnInit, OnDestroy} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Subject, finalize, takeUntil} from 'rxjs';
import {ILeadCreateDto, EGenderType} from '@app/types/lead';
import {StorageService} from '@app/services/api/storage.service';
import {ToastrService} from 'ngx-toastr';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {User} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {ITeam} from '@app/types/flow';

@Component({
  selector: 'app-lead-create-modal',
  templateUrl: './lead-create-modal.component.html',
  styleUrls: ['./lead-create-modal.component.scss'],
})
export class LeadCreateModalComponent implements OnInit, OnDestroy {
  leadForm!: FormGroup;
  statuses: any[] = [];
  tags: any[] = [];
  isSubmitting = false;
  isUploadingAvatar = false;

  autoTaskSetting?: any;
  currentBiz?: any;
  listBizUsers: User[] = [];

  public EGenderType = EGenderType;

  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadCreateDto>();

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
    private modalService: BsModalService,
    private storageService: StorageService,
    private toastr: ToastrService,
    private autoTaskService: AutoTaskService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    });

    if ((this.modalRef.content as any)?.statuses) {
      this.statuses = (this.modalRef.content as any).statuses;
    }
    if ((this.modalRef.content as any)?.tags) {
      this.tags = (this.modalRef.content as any).tags;
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

  getErrorMessage(fieldName: string): string {
    const control = this.leadForm.get(fieldName);
    if (control?.hasError('required')) {
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
    if (this.isUploadingAvatar) {
      return;
    }

    this.isUploadingAvatar = true;
    const accept = 'image/x-png,image/gif,image/jpeg,image/x-icon';

    this.storageService.attach(accept, 2).subscribe({
      next: (res) => {
        if (res?.data?.length) {
          const avatarUrl = res.data[0];
          this.leadForm.patchValue({picture: avatarUrl});
        }
        this.isUploadingAvatar = false;
      },
      error: (err) => {
        this.toastr.warning(err || 'Upload ảnh đại diện thất bại');
        this.isUploadingAvatar = false;
      },
    });
  }

  get avatarUrl(): string {
    return this.leadForm.get('picture')?.value || 'assets/images/avatar.svg';
  }

  private loadAutoTaskSetting(): void {
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.autoTaskSetting = setting;
        if (this.autoTaskSetting?.roles?.length && this.currentBiz) {
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
        if (this.autoTaskSetting?.roles?.length && this.currentBiz) {
          this.mappingTeams();
        }
      });
  }

  mappingTeams(): void {
    this.formTeams.clear();
    this.autoTaskSetting?.roles?.forEach((roleId: string) => {
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
    return this.tags.filter((tag) => tagIds.includes(tag.id));
  }

  onSubmit(): void {
    if (this.leadForm.invalid) {
      Object.keys(this.leadForm.controls).forEach((key) => {
        this.leadForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = {...this.leadForm.value};

    const teams: ITeam[] = [];
    if (formData.teams && Array.isArray(formData.teams)) {
      formData.teams.forEach((team: any) => {
        if (team.userId) {
          teams.push({
            roleId: team.roleId,
            roleIcon: team.roleIcon,
            roleName: team.roleName,
            userId: team.userId,
            userName: team.userName,
            userPicture: team.userPicture,
            userEmail: team.userEmail,
          });
        }
      });
    }

    const cleanedData: Partial<ILeadCreateDto> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'teams') {
        return;
      }
      if (value !== null && value !== '' && value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    if (teams.length > 0) {
      (cleanedData as any).teams = teams;
    }

    const createData: ILeadCreateDto = {
      name: formData.name,
      phone: formData.phone,
      statusId: this.statuses.find((s) => s.isDefault)?.id || '',
      ...cleanedData,
    };

    this.saveEvent.next(createData);
    this.onCancel();
  }

  onCancel(): void {
    this.modalRef.hide();
  }
}
