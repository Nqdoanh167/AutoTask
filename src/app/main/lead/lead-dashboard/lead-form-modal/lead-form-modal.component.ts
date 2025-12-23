import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Subject, finalize, takeUntil} from 'rxjs';
import {
  ILead,
  ILeadCreateDto,
  ILeadUpdateDto,
  EGenderType,
  IFolderLead,
} from '@app/types/lead';
import {StorageService} from '@app/services/api/storage.service';
import {ToastrService} from 'ngx-toastr';
import {IProvince, IDistrict, IWard} from '@app/types/location';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {Customer} from '@app/types/customer';
import {User} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {
  EChainNextActionType,
  ETaskChainType,
  ITeam,
  ModifiedUserUnit,
} from '@app/types/flow';
import {TreeNodeSelectEvent, TreeNodeUnSelectEvent} from 'primeng/tree';
import {ApiLocationService} from '@app/services/api/location';
import {ITaskChain, IPlatform} from './lead-form-modal.interface';
import {environment} from 'src/environments/environment';
import {LeadConnectionsModalComponent} from '../lead-connections-modal/lead-connections-modal.component';
import {LeadCreateModalComponent} from '../lead-create-modal/lead-create-modal.component';
import {ETabDetail} from '@app/types/lead';
import {TYPE_LEAD_OPTIONS} from '../../lead.variable';

@Component({
  selector: 'app-lead-form-modal',
  templateUrl: './lead-form-modal.component.html',
  styleUrls: ['./lead-form-modal.component.scss'],
})
export class LeadFormModalComponent implements OnInit, OnDestroy {
  public isOpenBackDrop: boolean = false;
  leadForm!: FormGroup;
  lead?: ILead;
  statuses: any[] = [];
  tags: any[] = [];
  sources: any[] = [];
  cachedSources: any[] = [];
  isSubmitting = false;
  isUploadingAvatar = false;
  isEditingTags = false;
  isEditingStatus = false;
  isAddressModalOpen = false;
  platforms: IPlatform[] = [];

  @ViewChild('statusSelect') statusSelect: any;

  provinces: IProvince[] = [];
  districts: IDistrict[] = [];
  wards: IWard[] = [];
  loadingProvinces = false;
  loadingDistricts = false;
  loadingWards = false;

  autoTaskSetting?: any;
  currentBiz?: any;
  listBizUsers: User[] = [];

  public units = this.autoTaskService.getUserUnits(false);

  getTaskDetailUrl(taskId: string) {
    return `${environment.urlDomain}/${this.currentBiz?.alias || ''}/${
      environment.module
    }/dashboard?id=${taskId}`;
  }

  get provinceCodeControl(): FormControl {
    return this.leadForm?.get('provinceCode') as FormControl;
  }

  get districtCodeControl(): FormControl {
    return this.leadForm?.get('districtCode') as FormControl;
  }

  get wardCodeControl(): FormControl {
    return this.leadForm?.get('wardCode') as FormControl;
  }

  get streetControl(): FormControl {
    return this.leadForm?.get('street') as FormControl;
  }

  public EGenderType = EGenderType;

  public loading = {
    getFolderLead: false,
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

  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadCreateDto | ILeadUpdateDto>();

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
    private modalService: BsModalService,
    private storageService: StorageService,
    private toastr: ToastrService,
    private autoTaskService: AutoTaskService,
    private authService: AuthService,
    private locationService: ApiLocationService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initializeSources();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
    this.loadProvinces();
    this.loadPlatforms();
    this.initializeBranch();
    this.getFolderLead();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public EChainNextActionType = EChainNextActionType;

  initializeSources(): void {
    if (this.cachedSources && this.cachedSources.length > 0) {
      this.sources = this.cachedSources;
    }
  }

  initForm(): void {
    const initialTagIds =
      this.lead?.tagIds || this.lead?.tags?.map((t) => t.id) || [];

    this.leadForm = this.fb.group({
      name: [this.lead?.name || '', [Validators.required]],
      phone: [this.lead?.phone || '', [Validators.required]],
      email: [this.lead?.email || '', [Validators.email]],
      gender: [this.lead?.gender || EGenderType.OTHER],
      statusId: [
        this.lead?.statusId ||
          this.statuses.find((s) => s.isDefault)?.id ||
          null,
        [Validators.required],
      ],
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

  get statusIdControl(): FormControl {
    return this.leadForm?.get('statusId') as FormControl;
  }

  get nameControl(): FormControl {
    return this.leadForm?.get('name') as FormControl;
  }

  getStatusBgColor(statusId: string | null | undefined): string {
    if (!statusId) return '#ccc';
    const status = this.statuses.find((s) => s.id === statusId);
    return status?.bgColor || '#ccc';
  }

  getStatusName(statusId: string | null | undefined): string {
    if (!statusId) return '';
    const status = this.statuses.find((s) => s.id === statusId);
    return status?.name || '';
  }

  get f(): {[key: string]: any} {
    return this.leadForm.controls;
  }

  get isEditMode(): boolean {
    return !!this.lead;
  }

  getFolderLead(): void {
    this.loading.getFolderLead = true;
    this.autoTaskService.leadFolder
      .getWithFunnels()
      .pipe(
        finalize(() => (this.loading.getFolderLead = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            this.folderLeads = res.data;
          }
        },
        error: (err: any) => {
          console.error('Error loading folder leads:', err);
        },
      });
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

    const allowedFieldNames = ['sourceId'];

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

    const branchForm = formData.branch;
    let branch = null;
    if (branchForm) {
      branch = {
        unit: branchForm.level,
        id: branchForm.id,
        name: branchForm.name,
        department: branchForm.department,
        departmentName: branchForm.departmentName,
        team: branchForm.team,
        teamName: branchForm.teamName,
      };
    }

    const cleanedData: Partial<ILeadCreateDto> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (allowedFieldNames.includes(key)) {
        (cleanedData as any)[key] = value;
      } else if (key === 'teams' || key === 'branch') {
        return;
      } else if (value !== null && value !== '' && value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    if (teams.length > 0) {
      (cleanedData as any).teams = teams;
    }

    if (branch) {
      (cleanedData as any).branch = branch;
    }

    if (this.platforms.length > 0) {
      (cleanedData as any).platforms = this.platforms;
    }

    if (this.isEditMode && this.lead) {
      const updateData: ILeadUpdateDto = {
        id: this.lead.id,
        ...cleanedData,
      };
      this.saveEvent.next(updateData);
    } else {
      const createData: ILeadCreateDto = {
        name: formData.name,
        phone: formData.phone,
        statusId: formData.statusId,
        ...cleanedData,
      };
      this.saveEvent.next(createData);
      this.onCancel();
    }
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.leadForm.get(fieldName);
    if (control?.hasError('required')) {
      if (fieldName === 'statusId') return 'Vui lòng chọn trạng thái Lead';
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

  handleCombineAddress(): void {
    const {street, district, ward, province} = this.leadForm.value;
    const addressParts = [street, ward, district, province].filter(Boolean);
    this.leadForm.patchValue({
      address: addressParts.join(', '),
    });
  }

  loadProvinces(): void {
    this.loadingProvinces = true;
    this.locationService
      .getProvince({location: 'VN'}, {cache: true})
      .pipe(
        finalize(() => (this.loadingProvinces = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res?.status === 200 && res.data) {
            this.provinces = res.data;
            if (this.lead?.provinceCode) {
              this.loadDistricts(this.lead.provinceCode, true);
            }
          }
        },
        error: (err) => console.error('Error loading provinces:', err),
      });
  }

  loadDistricts(provinceCode: string, isInitial = false): void {
    if (!provinceCode) {
      this.districts = [];
      this.wards = [];
      return;
    }

    this.loadingDistricts = true;
    this.locationService
      .getDistrict({provinceCode, location: 'VN'})
      .pipe(
        finalize(() => (this.loadingDistricts = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res?.status === 200 && res.data) {
            this.districts = res.data;
            if (
              isInitial &&
              this.lead?.districtCode &&
              this.lead?.provinceCode
            ) {
              this.loadWards(this.lead.provinceCode, this.lead.districtCode);
            }
          }
        },
        error: (err) => console.error('Error loading districts:', err),
      });
  }

  loadWards(provinceCode: string, districtCode: string): void {
    if (!districtCode) {
      this.wards = [];
      return;
    }

    this.loadingWards = true;
    this.locationService
      .getWard({provinceCode, districtCode, location: 'VN'})
      .pipe(
        finalize(() => (this.loadingWards = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res?.status === 200 && res.data) {
            this.wards = res.data;
          }
        },
        error: (err) => console.error('Error loading wards:', err),
      });
  }

  handleChangeLocation(
    value: {
      id: string;
      province?: string;
      provinceCode?: string;
      district?: string;
      districtCode?: string;
      ward?: string;
      wardCode?: string;
    },
    type: 'province' | 'district' | 'ward',
  ) {
    switch (type) {
      case 'province':
        this.districts = [];
        this.wards = [];
        this.leadForm.patchValue({
          district: null,
          districtCode: null,
          ward: null,
          wardCode: null,
        });
        if (!value?.provinceCode) {
          this.leadForm.patchValue({
            province: null,
            provinceCode: null,
          });
          return;
        }
        this.leadForm.patchValue({
          province: value.province,
          provinceCode: value.provinceCode,
        });
        this.loadDistricts(value.provinceCode);
        break;
      case 'district':
        this.wards = [];
        this.leadForm.patchValue({
          ward: null,
          wardCode: null,
        });
        if (!value?.districtCode || !value?.provinceCode) {
          this.leadForm.patchValue({
            district: null,
            districtCode: null,
            ward: null,
            wardCode: null,
          });
          return;
        }
        this.leadForm.patchValue({
          district: value.district,
          districtCode: value.districtCode,
        });
        this.loadWards(value.provinceCode, value.districtCode);
        break;
      case 'ward':
        if (!value?.wardCode || !value?.provinceCode || !value?.districtCode)
          return;
        this.leadForm.patchValue({
          ward: value.ward,
          wardCode: value.wardCode,
        });
        break;
    }
    this.handleCombineAddress();
  }

  groupByFolder = (item: any) => {
    return item.name;
  };

  groupValueFn = (key: string, children: any[]) => {
    return children;
  };

  onCustomerSelect(customer?: Customer): void {
    if (!customer) return;
    this.mapCustomerToLead(customer);
  }

  private mapCustomerToLead(customer: Customer): void {
    const mappedData: any = {};

    if (customer.name) mappedData.name = customer.name;
    if (customer.phone) mappedData.phone = customer.phone;
    if (customer.email) mappedData.email = customer.email;
    if (customer.gender) mappedData.gender = customer.gender;
    if (customer.address) mappedData.address = customer.address;
    if (customer.street) mappedData.street = customer.street;
    if (customer.province) mappedData.province = customer.province;
    if (customer.provinceCode) mappedData.provinceCode = customer.provinceCode;
    if (customer.district) mappedData.district = customer.district;
    if (customer.districtCode) mappedData.districtCode = customer.districtCode;
    if (customer.ward) mappedData.ward = customer.ward;
    if (customer.wardCode) mappedData.wardCode = customer.wardCode;
    if (customer.picture) mappedData.picture = customer.picture;

    this.leadForm.patchValue(mappedData);

    if (customer.provinceCode) {
      this.loadDistricts(customer.provinceCode, false);
      if (customer.districtCode) {
        this.loadWards(customer.provinceCode, customer.districtCode);
      }
    }

    if (mappedData.street) {
      this.handleCombineAddress();
    }
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
    return this.tags.filter((tag) => tagIds.includes(tag.id));
  }

  getSelectedStatus(): any | null {
    const statusId = this.statusIdControl?.value;
    if (!statusId) {
      return null;
    }
    return this.statuses.find((status) => status.id === statusId) || null;
  }

  onTagsClick(event: Event): void {
    event.stopPropagation();
    this.isEditingTags = true;
  }

  onStatusClick(event: Event): void {
    event.stopPropagation();
    this.isEditingStatus = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.statusSelect) {
        if (this.statusSelect.dropdownPanel) {
          this.statusSelect.open();
        } else {
          const container =
            this.statusSelect.element?.nativeElement?.querySelector(
              '.ng-select-container',
            );
          if (container) {
            container.click();
          }
        }
      }
    }, 0);
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

    if (this.isEditingStatus) {
      const statusContainer = this.elementRef.nativeElement.querySelector(
        '.status-edit-container',
      );
      const ngSelectPanel = document.querySelector('.ng-dropdown-panel');

      const clickedInsideStatus = statusContainer?.contains(
        event.target as Node,
      );
      const clickedInsideNgSelect = ngSelectPanel?.contains(
        event.target as Node,
      );

      if (!clickedInsideStatus && !clickedInsideNgSelect) {
        this.isEditingStatus = false;
      }
    }
  }

  onTagsChange(): void {}

  onStatusChange(): void {}

  toggleEditFacebook(): void {
    this.openConnectionsModal();
  }

  toggleEditZalo(): void {
    this.openConnectionsModal();
  }

  openConnectionsModal(): void {
    const modalRef = this.modalService.show(LeadConnectionsModalComponent, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: true,
      keyboard: false,
      initialState: {
        platforms: this.platforms,
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).saveEvent?.subscribe(
        (platforms: IPlatform[]) => {
          this.platforms = platforms;
          this.cdr.detectChanges();
          modalRef.hide();
        },
      );

      (modalRef.content as any).cancelEvent?.subscribe(() => {});
    }
  }

  loadPlatforms(): void {
    if (this.lead?.platforms) {
      this.platforms = JSON.parse(JSON.stringify(this.lead.platforms));
    } else {
      this.platforms = [];
    }
  }

  getFacebookDisplayValue(): string {
    const facebookPlatform = this.platforms.find(
      (p) => p.platform === 'FACEBOOK',
    );
    if (facebookPlatform && facebookPlatform.connections.length > 0) {
      const firstConnection = facebookPlatform.connections[0];
      return firstConnection.platformId;
    }
    return '';
  }

  getZaloDisplayValue(): string {
    const zaloPersonalPlatform = this.platforms.find(
      (p) => p.platform === 'ZALO_PERSONAL',
    );
    const zaloOAPlatform = this.platforms.find((p) => p.platform === 'ZALO_OA');
    const zaloPlatform = zaloPersonalPlatform || zaloOAPlatform;
    if (zaloPlatform && zaloPlatform.connections.length > 0) {
      const firstConnection = zaloPlatform.connections[0];
      return firstConnection.platformId;
    }
    return '';
  }

  getFacebookConnectionsCount(): number {
    const facebookPlatform = this.platforms.find(
      (p) => p.platform === 'FACEBOOK',
    );
    return facebookPlatform?.connections.length || 0;
  }

  getZaloConnectionsCount(): number {
    const zaloPersonalPlatform = this.platforms.find(
      (p) => p.platform === 'ZALO_PERSONAL',
    );
    const zaloOAPlatform = this.platforms.find((p) => p.platform === 'ZALO_OA');
    return (
      (zaloPersonalPlatform?.connections.length || 0) +
      (zaloOAPlatform?.connections.length || 0)
    );
  }

  openAddressModal(): void {
    this.isAddressModalOpen = true;
  }

  closeAddressModal(): void {
    this.isAddressModalOpen = false;
    this.handleCombineAddress();
  }

  getFullAddress(): string {
    const {street, ward, district, province} = this.leadForm.value;
    const parts = [street, ward, district, province].filter(Boolean);
    return parts.join(', ');
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

  handleChangeUnit(value: TreeNodeSelectEvent | TreeNodeUnSelectEvent): void {
    const node = value.node as ModifiedUserUnit;
  }

  preventUnselect(value: TreeNodeUnSelectEvent): void {
    const currentBranchValue = this.leadForm.get('branch')?.value;
    if (currentBranchValue) {
      setTimeout(() => {
        this.leadForm.patchValue({
          branch: currentBranchValue,
        });
      }, 0);
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  onEditIconClick(): void {
    this.isOpenBackDrop = true;
    const modalRef = this.modalService.show(LeadCreateModalComponent, {
      class: 'modal-dialog-centered',
      initialState: {
        statuses: this.statuses,
        tags: this.tags,
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).saveEvent?.subscribe((data: any) => {
        this.saveEvent.next(data);
      });

      modalRef.onHidden?.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.isOpenBackDrop = false;
      });
    }
  }
}
