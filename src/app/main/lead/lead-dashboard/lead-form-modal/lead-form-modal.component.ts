import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {finalize, takeUntil} from 'rxjs';
import {
  ILead,
  ILeadCreateDto,
  ILeadUpdateDto,
  EGenderType,
  IFolderLead,
} from '@app/types/lead';
import {StorageService} from '@app/services/api/storage.service';
import {ToastrService} from 'ngx-toastr';
import {Customer} from '@app/types/customer';
import {User} from '@app/types/viewmodels';
import {EChainNextActionType, ETaskChainType, ITeam} from '@app/types/flow';
import {ITaskChain} from './lead-form-modal.interface';
import {environment} from 'src/environments/environment';
import {ETabDetail} from '@app/types/lead';
import {TYPE_LEAD_OPTIONS} from '../../lead.variable';
import {ISetting} from '@app/types/setting';
import {LeadUpdateModalComponent} from '../lead-update-modal/lead-update-modal.component';
import {take} from 'rxjs';
import {LeadDashboardData} from '../lead-dashboard-data';

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
  @Output() saveEvent = new EventEmitter<ILeadCreateDto | ILeadUpdateDto>();

  private listBizUsers: User[] = [];

  public currentSetting!: ISetting;
  public isOpenBackDrop: boolean = false;
  public leadForm!: FormGroup;
  public isEditingTags = false;
  public units = this.autoTaskService.getUserUnits(false);
  public EGenderType = EGenderType;
  public loading = {
    getFolderLead: false,
    isSubmitting: false,
    isUploadingAvatar: false,
  };
  public folderLeads: IFolderLead[] = [];
  public menus = [
    {
      key: ETabDetail.DISCUSS,
      name: 'Thảo luận',
      icon: 'attribute',
    },
    {key: ETabDetail.TASK, name: 'Tác vụ', icon: 'order'},
    {key: ETabDetail.ATTRIBUTE, name: 'Attribute', icon: 'attribute'},
    {key: ETabDetail.PRODUCT, name: 'Sản phẩm', icon: 'user'},
    {key: ETabDetail.PACKAGE, name: 'Gói dịch vụ', icon: 'connections'},
  ];
  public activeTab: string = ETabDetail.DISCUSS;
  public typeLeads = TYPE_LEAD_OPTIONS;
  public genderOptions = [
    {value: EGenderType.MALE, label: 'Nam'},
    {value: EGenderType.FEMALE, label: 'Nữ'},
    {value: EGenderType.OTHER, label: 'Khác'},
  ];
  public EChainNextActionType = EChainNextActionType;
  public readonly hoveredBadgeIndex: number = 0;
  public hoveredBadgeIndexCurrent: number = this.hoveredBadgeIndex;

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly modalService: BsModalService,
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService,
    private readonly elementRef: ElementRef,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.initForm();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
    this.initializeBranch();
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
      email: [this.lead?.email || '', [Validators.email]],
      gender: [this.lead?.gender || EGenderType.OTHER],
      tagIds: [initialTagIds],
      picture: [this.lead?.picture || ''],
      sourceId: [this.lead?.['sourceId'] || null],
      funnelId: [this.lead?.['funnelId'] || '', [Validators.required]],
      address: [this.lead?.address || ''],
      street: [this.lead?.street || ''],
      province: [this.lead?.province || null],
      provinceCode: [this.lead?.provinceCode || null],
      district: [this.lead?.district || null],
      districtCode: [this.lead?.districtCode || null],
      ward: [this.lead?.ward || null],
      wardCode: [this.lead?.wardCode || null],
      teams: this.fb.array([]),
      branch: [null, [Validators.required]],
      typeLead: ['lead'],
    });
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

  get f(): {[key: string]: any} {
    return this.leadForm.controls;
  }

  get isEditMode(): boolean {
    return !!this.lead;
  }

  getFolderLead(): void {
    this.loading.getFolderLead = true;
    this.leadService.leadFolder
      .getWithFunnels({
        page: 1,
        limit: 1000,
      })
      .pipe(
        finalize(() => (this.loading.getFolderLead = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.folderLeads = res.data;
            this.leadService.setListLeadFolder(res.data);
          }
        },
        error: (err: any) => {
          console.error('Error loading folder leads:', err);
        },
      });
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.leadForm.get(fieldName);
    if (control?.hasError('required')) {
      if (fieldName === 'funnelId') return 'Vui lòng chọn Phễu';
      if (fieldName === 'branch') return 'Vui lòng chọn Chi nhánh';
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

  groupByFolder = (item: any) => {
    return item.name;
  };

  groupValueFn = (key: string, children: any[]) => {
    return children;
  };

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

  onTagsClick(event: Event): void {
    event.stopPropagation();
    this.isEditingTags = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isEditingTags) {
      const tagsContainer = this.elementRef.nativeElement.querySelector(
        '.tags-edit-container',
      );
      const ngSelectPanel = document.querySelector('.ng-dropdown-panel');

      const clickedInsideTags = tagsContainer?.contains(event.target as Node);
      const clickedInsideNgSelect = ngSelectPanel?.contains(
        event.target as Node,
      );

      if (!clickedInsideTags && !clickedInsideNgSelect) {
        this.isEditingTags = false;
      }
    }
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

  openUpdateModal(): void {
    this.isOpenBackDrop = true;
    const modal = this.modalService.show(LeadUpdateModalComponent, {
      class: 'modal-dialog-centered modal-xl',
      initialState: {
        lead: this.lead,
      },
    });

    modal.content?.saveEvent?.subscribe((updatedLead: ILead) => {
      if (this.lead?.id === updatedLead.id) {
        Object.assign(this.lead, updatedLead);
        this.initForm();
      }
    });

    modal.onHidden?.pipe(take(1)).subscribe(() => {
      this.isOpenBackDrop = false;
    });
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
}
