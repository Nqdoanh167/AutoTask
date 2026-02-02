import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, finalize, takeUntil} from 'rxjs';
import {ILead, EGenderType, IFunnel} from '@app/types/lead';
import {Customer} from '@app/types/customer';
import {
  ERole,
  FlatBranch,
  OrderPlatformSource,
  User,
} from '@app/types/viewmodels';
import {
  EChainNextActionType,
  ETaskChainType,
  ITeam,
  ModifiedUserUnit,
} from '@app/types/flow';
import {ITaskChain} from './lead-form-modal.interface';
import {environment} from 'src/environments/environment';
import {TYPE_LEAD_OPTIONS} from '../../lead.variable';
import {ISetting, ISettingTabItem} from '@app/types/setting';
import {LeadDashboardData} from '../lead-dashboard.definition';
import {DEFAULT_LEAD_TABS} from '@app/main/setting/tab-display/tab-display.variable';
import {isEmpty} from 'lodash';
import {Router} from '@angular/router';
import {TreeNodeSelectEvent, TreeNodeUnSelectEvent} from 'primeng/tree';
import {ActivityLogComponent} from '@app/share/common/activity-log/activity-log.component';
import {ToastrService} from 'ngx-toastr';
import {MainService} from '@app/services/api/main.service';
import {ModalConfirmService} from '@app/share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@app/share/custom/modal-confirm/modal-confirm.component';

@Component({
  selector: 'app-lead-form-modal',
  templateUrl: './lead-form-modal.component.html',
  styleUrls: ['./lead-form-modal.component.scss'],
})
export class LeadFormModalComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild(ActivityLogComponent)
  activityLogComponent!: ActivityLogComponent;
  @ViewChild('nameInput') nameInput!: ElementRef;
  @Input() lead?: ILead;
  @Input() currentFunnelId?: string;
  @Output() saveEvent = new EventEmitter<ILead>();

  public currentSetting!: ISetting;
  public readonly environment = environment;
  protected readonly ERole = ERole;
  public isOpenBackDrop: boolean = false;
  public leadForm!: FormGroup;
  public fieldStates: {
    [key: string]: {editing: boolean; hover: boolean};
  } = {};
  public units = this.autoTaskService.getUserUnits(false);
  public EGenderType = EGenderType;
  public loading = {
    isSubmitting: false,
  };
  public funnelOptions: Array<
    IFunnel & {folderName: string; funnelGroupName: string}
  > = [];
  public tabsMenu = {
    left: [] as ISettingTabItem[],
    right: [] as ISettingTabItem[],
  };
  public activeLeftTabMenu!: ISettingTabItem;
  public activeRightTabMenu!: ISettingTabItem;
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
  public isShowLeftTab: boolean = true;
  public infoUnit$ = new BehaviorSubject<FlatBranch | undefined>(undefined);

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly router: Router,
    private readonly mainService: MainService,
    private readonly toastrService: ToastrService,
    private readonly modalConfirmService: ModalConfirmService,
  ) {
    super();

    const isShowLeftTab = localStorage.getItem('isShowLeftTab');
    if (isShowLeftTab) {
      this.isShowLeftTab = isShowLeftTab === 'true';
    }
  }

  override ngOnInit(): void {
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.tabsMenu.left = (res.leadTabs || []).filter(
            (tab) => tab.positions.includes('left') && tab.active,
          );
          this.tabsMenu.right = (res.leadTabs || []).filter(
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

          this.activeLeftTabMenu = this.tabsMenu.left[0];
          this.activeRightTabMenu = this.tabsMenu.right[0];
          this.currentSetting = res;
        }
      });
    this.transformFunnelOptions();

    this.initForm();
    this.patchForm(this.lead);
  }

  getTaskDetailUrl(taskId: string) {
    return `${environment.urlDomain}/${this.currentBiz?.alias || ''}/${
      environment.module
    }/dashboard?id=${taskId}`;
  }

  initForm(): void {
    this.leadForm = this.fb.group({
      id: null,
      name: [null, [Validators.required]],
      funnelId: [null, [Validators.required]],
      statusId: null,
      branch: null,
      platformSourceIds: [[]],
      platformSources: [[]],
      customer: this.fb.group({
        id: null,
        name: null,
        picture: null,
        gender: 'other',
        phone: null,
        email: null,
        address: null,
        street: null,
        ward: null,
        wardCode: null,
        district: null,
        districtCode: null,
        province: null,
        provinceCode: null,
      }),
      tagIds: [[]],
      teams: this.fb.array([]),
      type: ['LEAD'],
    });
  }

  getInfoUnit(id?: string | null) {
    this.infoUnit$.next(this.authService.getInfoInUnit(id));
  }

  patchForm(dataSource?: ILead): void {
    try {
      this.mappingTeams();
      if (this.currentFunnelId) {
        this.leadForm.patchValue({
          funnelId: this.currentFunnelId,
        });
      }
      if (!dataSource) {
        let branch = this.leadService.getFirstUnit();
        this.getInfoUnit(branch?.team || branch?.department || branch?.id);
        this.leadForm.patchValue({
          branch: branch as any,
          funnelId: this.currentFunnelId,
        });
        return;
      }

      this.leadForm.patchValue({
        ...this.lead,
        tagIds: this.lead?.tagIds || this.lead?.tags?.map((t) => t.id) || [],
      });

      if (dataSource.branch) {
        const {branch} = dataSource;
        this.getInfoUnit(branch?.team || branch?.department || branch?.id);
        const foundUnit = this.leadService.findUnitFromData(branch);
        this.leadForm.patchValue({
          branch: foundUnit as any,
        });
      }
    } catch (error) {
      console.error('error', error);
    }
  }

  ngAfterViewInit(): void {
    if (!this.lead && this.nameInput?.nativeElement) {
      setTimeout(() => {
        this.nameInput.nativeElement.focus();
      }, 0);
    }
  }

  get formCustomer() {
    return <FormGroup>this.leadForm.get('customer');
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

  get funnelControl(): FormControl {
    return this.leadForm?.get('funnelId') as FormControl;
  }

  get f(): {[key: string]: any} {
    return this.leadForm.controls;
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

  handleChangePlatFormSource(data: OrderPlatformSource[]) {
    this.leadForm.patchValue({
      platformSourceIds: data.map((item) => item.id),
      platformSources: data,
    } as any);
  }

  handleChangeUnit(value: TreeNodeSelectEvent | TreeNodeUnSelectEvent) {
    const node = value.node as ModifiedUserUnit;
    this.getInfoUnit(node?.team || node?.department || node?.id);
    // this.formTeams.controls?.forEach((form) => {
    //   form.patchValue({
    //     userId: null,
    //   });
    // });
  }

  preventUnselect(value: TreeNodeUnSelectEvent) {
    const currentBranchValue = this.leadForm.get('branch')?.value;
    if (currentBranchValue) {
      setTimeout(() => {
        this.leadForm.patchValue({
          branch: currentBranchValue,
        });
      }, 0);
    }
  }

  getAvailableUsers(roleId?: string): User[] {
    if (!roleId || !this.bizUsers?.length) {
      return [];
    }

    return this.bizUsers.filter((user: User) => {
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
        // input.select();
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
    const branchForm = this.f['branch'].value;

    const body = {
      ...formValue,
      branch: branchForm
        ? {
            unit: branchForm.level,
            id: branchForm.id,
            name: branchForm.name,
            department: branchForm.department,
            departmentName: branchForm.departmentName,
            team: branchForm.team,
            teamName: branchForm.teamName,
          }
        : null,
    };

    const action$ = this.lead?.id
      ? this.leadService.lead.update(this.lead.id, body)
      : this.leadService.lead.create(body);

    action$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading.isSubmitting = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess(
              this.lead?.id ? 'update' : 'create',
            );
            this.activityLogComponent.loadActivities();
            this.saveEvent.emit(res.data);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  navigateToTabSettings() {
    this.hideModal();

    this.router.navigate([`/setting/tab-display`], {
      fragment: 'LEAD',
    });
  }

  handleToggleLeftTab() {
    this.isShowLeftTab = !this.isShowLeftTab;
    localStorage.setItem('isShowLeftTab', this.isShowLeftTab.toString());
  }

  copyText(text: string) {
    this.mainService.copyText(text);
    this.toastrService.success('Sao chép thành công');
  }

  handleDeleteLead() {
    if (!this.lead) return;
    const title = 'Xóa Lead';
    const description = `Bạn có chắc muốn xóa Lead <b>${
      this.lead?.name || ''
    }</b> không?`;
    const okText = 'Đồng ý';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'warning',
      modalType: 'advance',
    };
    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.onDeleteLead(this.lead!);
    });
  }

  onDeleteLead(lead: ILead) {
    this.leadService.lead.delete(lead.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa lead thành công');
          this.saveEvent.emit();
          this.hideModal();
        }
      },
    });
  }
}
