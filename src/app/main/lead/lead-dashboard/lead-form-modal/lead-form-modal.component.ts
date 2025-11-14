import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ILead, ILeadCreateDto, ILeadUpdateDto, EGenderType } from '@app/types/lead';
import { StorageService } from '@app/services/api/storage.service';
import { ToastrService } from 'ngx-toastr';
import { ISelectedLocation } from '@app/types/location';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { Customer } from '@app/types/customer';
import { UserAcl } from '@app/types/setting';
import { User } from '@app/types/viewmodels';
import { AuthService } from '@app/services/api/auth.service';
import { ITeam } from '@app/types/flow';

@Component({
  selector: 'app-lead-form-modal',
  templateUrl: './lead-form-modal.component.html',
  styleUrls: ['./lead-form-modal.component.scss'],
})
export class LeadFormModalComponent implements OnInit, OnDestroy {
  leadForm!: FormGroup;
  lead?: ILead;
  statuses: any[] = [];
  tags: any[] = [];
  sources: any[] = []; // Danh sách nguồn dữ liệu
  funnels: any[] = []; // Danh sách phễu
  funnelFolders: any[] = []; // Danh sách thư mục phễu với funnel con
  cachedFunnels: any[] = []; // Cached funnels data passed from parent
  cachedSources: any[] = []; // Cached sources data passed from parent
  selectedFolder?: any; // Currently selected funnel/folder from dashboard
  isSubmitting = false;
  isUploadingAvatar = false;
  loadingFunnels = false;
  selectedLocation?: ISelectedLocation = {
    province: undefined,
    district: undefined,
    ward: undefined,
  };
  
  // Teams-related properties
  autoTaskSetting?: any;
  currentBiz?: any;
  listBizUsers: User[] = [];


  // Expose enum for template
  public EGenderType = EGenderType;

  private destroy$ = new Subject<void>();
  public saveEvent = new Subject<ILeadCreateDto | ILeadUpdateDto>();

  constructor(
    private fb: FormBuilder,
    private modalRef: BsModalRef,
    private storageService: StorageService,
    private toastr: ToastrService,
    private autoTaskService: AutoTaskService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initializeSources();
    this.initializeFunnels();
    this.subscribeToFunnelChanges();
    this.loadBizUsers();
    this.loadAutoTaskSetting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeSources(): void {
    // Use cached sources if available to avoid re-fetching
    if (this.cachedSources && this.cachedSources.length > 0) {
      this.sources = this.cachedSources;
    }
    // Note: No fallback to API for sources as they should always be cached
    // If not available, user can still use the form without source
  }

  initializeFunnels(): void {
    // Use cached funnels if available to avoid re-fetching
    if (this.cachedFunnels && this.cachedFunnels.length > 0) {
      this.funnelFolders = this.transformFunnelsForNgSelect(this.cachedFunnels);
      this.funnels = this.flattenFunnels(this.cachedFunnels);
      this.loadingFunnels = false;
      
      // Set default funnel for new leads after funnels are loaded
      this.setDefaultFunnelForNewLead();
    } else {
      // Fallback to loading from API if no cached data
      this.loadFunnelsFromAPI();
    }
  }

  loadFunnelsFromAPI(): void {
    this.loadingFunnels = true;
    this.autoTaskService.leadFolder
      .getWithFunnels({})
      .pipe(
        finalize(() => {
          this.loadingFunnels = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res?.status === 200 && res.data) {
            this.funnelFolders = this.transformFunnelsForNgSelect(res.data);
            // Flatten all funnels for backward compatibility
            this.funnels = this.flattenFunnels(res.data);
            
            // Set default funnel for new leads after funnels are loaded
            this.setDefaultFunnelForNewLead();
          } else {
            console.error('Error loading funnels:', res);
          }
        },
        error: (err) => {
          console.error('Error loading funnels:', err);
        },
      });
  }

  private transformFunnelsForNgSelect(folders: any[]): any[] {
    const transformed: any[] = [];
    folders.forEach(folder => {
      // Only add funnels with group property - ng-select will auto-create group headers
      if (folder.funnels && folder.funnels.length > 0) {
        folder.funnels.forEach((funnel: any) => {
          transformed.push({
            ...funnel,
            folderId: folder.id,
            folderName: folder.name,
            type: 'funnel',
            group: folder.name, // This tells ng-select to group by this folder name
          });
        });
      }
    });
    return transformed;
  }

  private flattenFunnels(folders: any[]): any[] {
    const funnels: any[] = [];
    folders.forEach(folder => {
      if (folder.funnels && folder.funnels.length > 0) {
        folder.funnels.forEach((funnel: any) => {
          funnels.push({
            ...funnel,
            folderId: folder.id,
            folderName: folder.name,
          });
        });
      }
    });
    return funnels;
  }

  initForm(): void {
    // Support both tagIds (from backend) and tags (populated objects)
    const initialTagIds = this.lead?.tagIds || this.lead?.tags?.map(t => t.id) || [];
    
    this.leadForm = this.fb.group({
      name: [this.lead?.name || '', [Validators.required]],
      phone: [this.lead?.phone || '', [Validators.required]],
      email: [this.lead?.email || '', [Validators.email]],
      gender: [this.lead?.gender || EGenderType.OTHER],
      statusId: [this.lead?.statusId || this.statuses.find(s => s.isDefault)?.id || null, [Validators.required]], // Required field
      tagIds: [initialTagIds], // Support both tagIds and tags.map(t => t.id)
      picture: [this.lead?.picture || ''],
      sourceId: [this.lead?.['sourceId'] || null],
      funnelId: [this.lead?.['funnelId'] || '', [Validators.required]], // Required field
      address: [this.lead?.address || ''],
      street: [this.lead?.street || ''],
      province: [this.lead?.province || ''],
      provinceCode: [this.lead?.provinceCode || ''],
      district: [this.lead?.district || ''],
      districtCode: [this.lead?.districtCode || ''],
      ward: [this.lead?.ward || ''],
      wardCode: [this.lead?.wardCode || ''],
      teams: this.fb.array([]), // Teams form array
    });

    // Initialize location if editing
    if (this.lead) {
      this.selectedLocation = {
        province: this.lead.province && this.lead.provinceCode ? {
          province: this.lead.province,
          provinceCode: this.lead.provinceCode,
        } as any : undefined,
        district: this.lead.district && this.lead.districtCode ? {
          district: this.lead.district,
          districtCode: this.lead.districtCode,
        } as any : undefined,
        ward: this.lead.ward && this.lead.wardCode ? {
          ward: this.lead.ward,
          wardCode: this.lead.wardCode,
        } as any : undefined,
      };
    }
  }

  get formTeams(): FormArray {
    return this.leadForm.get('teams') as FormArray;
  }

  get isEditMode(): boolean {
    return !!this.lead;
  }

  onSubmit(): void {
    if (this.leadForm.invalid) {
      Object.keys(this.leadForm.controls).forEach(key => {
        this.leadForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.leadForm.value };

    // List of fields that should always be included (even if null/empty)
    const allowedFieldNames = ['sourceId'];

    // Process teams separately
    const teams: ITeam[] = [];
    if (formData.teams && Array.isArray(formData.teams)) {
      formData.teams.forEach((team: any) => {
        if (team.userId) { // Only include teams with assigned users
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

    // Remove empty/null values but preserve required fields
    const cleanedData: Partial<ILeadCreateDto> = {};
    Object.entries(formData).forEach(([key, value]) => {
      // Always include allowed fields (even if null/empty)
      if (allowedFieldNames.includes(key)) {
        (cleanedData as any)[key] = value;
      }
      // Skip teams as we handle it separately
      else if (key === 'teams') {
        return;
      }
      // For other fields, only include non-empty values
      else if (value !== null && value !== '' && value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    // Add teams if any
    if (teams.length > 0) {
      (cleanedData as any).teams = teams;
    }

    if (this.isEditMode && this.lead) {
      const updateData: ILeadUpdateDto = {
        id: this.lead.id,
        ...cleanedData,
      };
      this.saveEvent.next(updateData);
    } else {
      // Form validation ensures name, phone, and statusId are present
      const createData: ILeadCreateDto = {
        name: formData.name,
        phone: formData.phone,
        statusId: formData.statusId,
        ...cleanedData,
      };
      this.saveEvent.next(createData);
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
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('email')) {
      return 'Email không hợp lệ';
    }
    // if (control?.hasError('pattern')) {
    //   return 'Số điện thoại không hợp lệ (10-11 chữ số)';
    // }
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
          this.leadForm.patchValue({ picture: avatarUrl });
          // this.toastr.success('Upload ảnh đại diện thành công');
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

  handleEmittedEvent(data: ISelectedLocation): void {
    this.selectedLocation = {...data};
    this.leadForm.patchValue({
      province: data.province?.province || null,
      provinceCode: data.province?.provinceCode || null,
      district: data.district?.district || null,
      districtCode: data.district?.districtCode || null,
      ward: data.ward?.ward || null,
      wardCode: data.ward?.wardCode || null,
    } as any);
    this.handleCombineAddress();
  }

  handleCombineAddress(): void {
    const {street, district, ward, province} = this.leadForm.value;
    const addressParts = [street, ward, district, province].filter(Boolean);
    this.leadForm.patchValue({
      address: addressParts.join(', '),
    });
  }

  onStreetChange(): void {
    this.handleCombineAddress();
  }

  groupByFolder = (item: any) => {
    return item.name; // Group by folder name
  };

  groupValueFn = (key: string, children: any[]) => {
    return children; // Return the children (funnels) for each group
  };

  private subscribeToFunnelChanges(): void {
    // Subscribe to funnel data changes to reload when funnels are created/updated/deleted
    this.autoTaskService.funnelDataChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(changed => {
        if (changed) {
          // Reload funnels from API when data changes (bypass cache)
          this.loadFunnelsFromAPI();
        }
      });
  }

  /**
   * Set default funnel for new leads
   * Priority: selected funnel from dashboard > system funnel
   * Only set if creating new lead and funnelId is not already set
   */
  private setDefaultFunnelForNewLead(): void {
    // Only set default for new leads (not edit mode)
    if (this.isEditMode) {
      return;
    }

    // Only set if funnelId is not already set
    const currentFunnelId = this.leadForm.get('funnelId')?.value;
    if (currentFunnelId) {
      return;
    }

    // Priority 1: Use currently selected funnel from dashboard
    if (this.selectedFolder && this.selectedFolder.type === 'funnel') {
      const selectedFunnelId = this.selectedFolder.funnels?.[0]?.id || this.selectedFolder.id;
      const selectedFunnel = this.funnels.find(f => f.id === selectedFunnelId);
      if (selectedFunnel) {
        this.leadForm.patchValue({ funnelId: selectedFunnel.id });
        console.log('Set selected funnel from dashboard:', selectedFunnel.name, selectedFunnel.id);
        return;
      }
    }

    // Priority 2: Fall back to system funnel if no selected funnel
    const systemFunnel = this.funnelFolders.find(f => f.isSystem === true);
    if (systemFunnel) {
      this.leadForm.patchValue({ funnelId: systemFunnel.id });
      console.log('Set default system funnel:', systemFunnel.name, systemFunnel.id);
    }
  }

  onCustomerSelect(customer?: Customer): void {
    if (!customer) return;
    // Map customer data to lead form
    this.mapCustomerToLead(customer);
  }

  private mapCustomerToLead(customer: Customer): void {
    const mappedData: any = {};

    // Map basic fields
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

    // Update form with mapped data
    this.leadForm.patchValue(mappedData);

    // Update selected location for address components
    if (customer.provinceCode || customer.districtCode || customer.wardCode) {
      this.selectedLocation = {
        province: customer.province && customer.provinceCode ? {
          province: customer.province,
          provinceCode: customer.provinceCode,
        } : undefined,
        district: customer.district && customer.districtCode ? {
          district: customer.district,
          districtCode: customer.districtCode,
        } : undefined,
        ward: customer.ward && customer.wardCode ? {
          ward: customer.ward,
          wardCode: customer.wardCode,
        } : undefined,
      };
    }

    // Combine address if street is set
    if (mappedData.street) {
      this.handleCombineAddress();
    }
  }

  /**
   * Load autoTaskSetting để lấy thông tin roles
   */
  private loadAutoTaskSetting(): void {
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.autoTaskSetting = setting;
        // Map teams sau khi có setting và biz users
        if (this.autoTaskSetting?.roles?.length && this.currentBiz) {
          this.mappingTeams();
        }
      });
  }

  /**
   * Load bizUsers để lấy danh sách user cho teams
   */
  private loadBizUsers(): void {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz;
        this.listBizUsers = biz?.users || [];
        // Map teams sau khi có biz users và setting
        if (this.autoTaskSetting?.roles?.length && this.currentBiz) {
          this.mappingTeams();
        }
      });
  }

  /**
   * Map teams dựa trên roles trong autoTaskSetting
   */
  mappingTeams(): void {
    this.formTeams.clear();
    this.autoTaskSetting?.roles?.forEach((roleId: string) => {
      const findRole = this.currentBiz?.roles?.find((r: any) => r.id === roleId);
      
      // Find existing team for this role from lead data
      const findTeam = this.lead?.teams?.find((team: ITeam) => team.roleId === roleId);

      this.formTeams.push(
        this.fb.group({
          roleId: findRole?.id || roleId,
          roleIcon: findRole?.icon || 'fa-user',
          roleName: findRole?.name || 'Unknown Role',
          userId: findTeam?.userId || null,
          userName: findTeam?.userName || null,
          userPicture: findTeam?.userPicture || null,
          userEmail: findTeam?.userEmail || null,
        })
      );
    });
  }

  /**
   * Chọn user cho team tại index
   */
  onChooseTeam(index: number, user: User): void {
    this.formTeams.at(index).patchValue({
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      userEmail: user.email,
    });
  }

  /**
   * Xóa user khỏi team tại index
   */
  onRemoveTeam(index: number): void {
    this.formTeams.at(index).patchValue({
      userId: null,
      userName: null,
      userPicture: null,
      userEmail: null,
    });
  }

  /**
   * Lấy danh sách users có thể chọn cho role
   */
  getAvailableUsers(roleId?: string): User[] {
    if (!roleId || !this.listBizUsers?.length) {
      return [];
    }

    // Filter users có role này và isActive
    return this.listBizUsers.filter((user: User) => {
      // Check if user is active
      if (!user.isActive) return false;
      
      // Check if user has this role
      const userRoleIds = user.roleIds || [];
      return userRoleIds.includes(roleId);
    });
  }
}
