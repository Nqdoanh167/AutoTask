import {isEqual} from 'lodash';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute, Router} from '@angular/router';
import {NgSelectComponent} from '@ng-select/ng-select';
import {LeadDashboardData} from './lead-dashboard-data';
import {ILead} from '@app/types/lead';
import {ILeadStatus} from '@app/types/lead-status';
import {ILeadTag} from '@app/types/lead-tag';
import {
  IColumns,
  User,
  BizRole,
  ERole,
  IDateRange,
} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {
  LEAD_COLUMNS_DEFAULT,
  LEAD_MULTIPLE_ACTIONS,
  ELeadBulkAction,
} from './lead-dashboard-variables';
import {takeUntil, finalize, shareReplay, first} from 'rxjs';
import {OrderableTableComponent} from '@share/orderable-table/orderable-table.component';
import {
  ILeadFolder,
  LeadFolderSidebarComponent,
} from './lead-folder-sidebar/lead-folder-sidebar.component';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';
import {LeadFunnelFormModalComponent} from './lead-funnel-form-modal/lead-funnel-form-modal.component';
import {LeadBulkMoveModalComponent} from './lead-bulk-move-modal/lead-bulk-move-modal.component';
import {SortLeadStatusModalComponent} from './sort-lead-status-modal/sort-lead-status-modal.component';
import {ETypeFilter, EBotherAdvanceBasicFilter} from '@app/types/common';
import {AuthService} from '@app/services/api/auth.service';
import {environment} from 'src/environments/environment';
import {MainService} from '@app/services/api/main.service';
import moment from 'moment';

@Component({
  selector: 'app-lead-dashboard',
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.scss'],
})
export class LeadDashboardComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild('virtualScroll') virtualScroll?: CdkVirtualScrollViewport;
  @ViewChild(LeadFolderSidebarComponent)
  folderSidebar?: LeadFolderSidebarComponent;
  @ViewChild('selectBatchActions') selectBatchActions?: NgSelectComponent;

  public dataColumnsShow: IColumns[] = [];
  public selectedLeads: ILead[] = [];
  public multipleAction = LEAD_MULTIPLE_ACTIONS;
  public viewMode: 'kanban' | 'list' = 'list';
  public selectedFolder?: ILeadFolder;
  public Math = Math; // Expose Math for template
  public leadsByStatus: Map<string, ILead[]> = new Map();
  public statusMap: Map<string, ILeadStatus> = new Map(); // Cache for O(1) status lookup
  public tagMap: Map<string, ILeadTag> = new Map(); // Cache for O(1) tag lookup
  public sidebarCollapsed = false; // Controls sidebar collapse/expand state

  // Checkbox filter for branch and role
  public checkbox: any = {
    branchIds: [],
    accessibleIds: [],
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
    branchDisplayInputText: '',
    branchIcon: './assets/icons/location.svg',
    roleIcon: './assets/icons/role.svg',
    userIcon: './assets/icons/member.svg',
  };
  public setting!: ISetting;

  // Computed property for filtered config buttons
  get filteredConfigButtons() {
    return this.configButtons.filter((btn) => {
      // Hide table customization button in kanban mode
      if (btn.name === 'orderableTable' && this.viewMode === 'kanban') {
        return false;
      }
      return true;
    });
  }

  get activeStatuses(): ILeadStatus[] {
    if (this.viewMode === 'kanban') {
      return this.statuses.rows.filter((status) => status.isActive);
    }

    return [];
  }

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly mainService: MainService,
  ) {
    super();

    // Load column configuration
    const typeColumn = 'columnLeadDashboard';
    const defaultColumn = LEAD_COLUMNS_DEFAULT;
    const dataColumns = JSON.parse(localStorage.getItem(typeColumn) as string);

    if (
      !dataColumns ||
      !dataColumns.length ||
      typeof dataColumns[0] !== 'object'
    ) {
      localStorage.setItem(typeColumn, JSON.stringify(defaultColumn));
    }
    this.dataColumnsShow = dataColumns || defaultColumn;
  }

  override ngOnInit(): void {
    // Build status and tag maps after data is loaded (from cache or API)
    this.buildStatusMap();
    this.buildTagMap();

    // Setup checkbox filters
    this.setupCheckbox();

    // Register with main component for header filters via service
    this.mainService.setLeadDashboardComponent(this);

    // Don't call getDataSource() here - wait for sidebar to auto-select first funnel
    // which will trigger onFolderSelected() and then getDataSource() with proper filter

    this.socketService.connect();
    this.setupSocketListeners();

    // Load users for advanced filter
    this.loadUsersForFilter();

    // Subscribe to setting changes
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.setting = setting || {};
        this.setupCheckbox();
      });

    // Subscribe to biz changes
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          this.setupCheckbox();
        }
      });

    // Listen to query params for opening lead detail
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((q) => {
      if (q['id']) {
        this.openLeadDetail(q['id']);
      }
    });
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async setupSocketListeners(): Promise<void> {
    try {
      // Chờ socket sẵn sàng trước khi listen
      await this.socketService.waitForSocket();

      // Listen to socket events khi socket đã sẵn sàng
      this.socketService
        .listen('lead/FOLDER_WITH_FUNNEL_SYNCHRONIZED')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.handleFolderWithFunnelSynchronized(data);
        });
    } catch (error) {
      console.error('Failed to setup socket listeners:', error);
    }
  }

  override handleAction(name: string) {
    if (name === 'reload' && !this.item.loading) {
      this.getDataSource(true);
    }
    if (name === 'add_new') {
      this.openLeadModal();
    }
    if (name === 'orderableTable') {
      this.showModalOrderableTable();
    }
    if (name === 'sortLeadStatus') {
      this.showModalSortLeadStatus();
    }
  }

  openLeadModal(leadId?: string) {
    // If editing, fetch lead detail first
    if (leadId) {
      this.autoTaskService.lead
        .getById(leadId, {populate: ['taskIds']})
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 && res.data) {
              this.showLeadModal(res.data);
            } else {
              this.toastrService.error('Không thể lấy thông tin lead');
            }
          },
          error: (err: any) => {
            this.toastrService.error('Không thể lấy thông tin lead');
          },
        });
    } else {
      // Creating new lead
      this.showLeadModal();
    }
  }

  private showLeadModal(lead?: ILead) {
    // Get cached sources data to avoid re-fetching in modal
    const cachedSources = this.getCachedPublicSources();

    const modalRef = this.modalService.show(LeadFormModalComponent, {
      class: 'modal-dialog-centered modal-medium',
      initialState: {
        lead: lead,
        statuses: this.statuses.rows,
        tags: this.tags.rows,
        cachedSources: cachedSources, // Pass cached sources to avoid re-fetching
        selectedFolder: this.selectedFolder, // Pass currently selected funnel/folder
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).saveEvent?.subscribe((data: any) => {
        if (lead) {
          // Update lead
          this.autoTaskService.lead.update(lead.id, data).subscribe({
            next: (res: any) => {
              if (res.status === 200) {
                this.toastrService.success('Cập nhật lead thành công');
                this.getDataSource(true);
                // modalRef.hide();
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              this.toastrService.error('Cập nhật lead thất bại');
              (modalRef.content as any).isSubmitting = false;
            },
          });
        } else {
          // Create lead
          this.autoTaskService.lead.create(data).subscribe({
            next: (res: any) => {
              if (res.status === 200 || res.status === 201) {
                this.toastrService.success('Tạo lead thành công');
                this.getDataSource(true);
                // modalRef.hide();
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              this.toastrService.error('Tạo lead thất bại');
              (modalRef.content as any).isSubmitting = false;
            },
          });
        }
      });
    }
  }

  openLeadDetail(id: string) {
    this.openLeadModal(id);
  }

  showModalOrderableTable() {
    const modalRef = this.modalService.show(OrderableTableComponent, {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        typeColumn: 'columnLeadDashboard',
        dataColumns: this.dataColumnsShow,
      } as any,
    });

    if (modalRef.content) {
      modalRef.content.triggerColumnChange
        .pipe()
        .subscribe((sequenceColumns: IColumns[]) => {
          this.dataColumnsShow = [...sequenceColumns];
        });
    }
  }

  showModalSortLeadStatus() {
    const modalRef = this.modalService.show(SortLeadStatusModalComponent, {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        statuses: this.statuses.rows,
      } as any,
    });

    if (modalRef.content) {
      modalRef.content.onStatusUpdated.subscribe(
        (updatedStatuses: ILeadStatus[]) => {
          // Update trực tiếp danh sách statuses mà không cần gọi API
          this.statuses.rows = updatedStatuses;
          // Rebuild status map và tag map để đảm bảo consistency
          this.buildStatusMap();
          // Cập nhật lại kanban view nếu đang ở chế độ kanban
          if (this.viewMode === 'kanban') {
            this.groupLeadsByStatus();
          }
        },
      );
    }
  }

  showModalMultipleAction(action: any) {
    const selectedLeads = this.getCheckRows();
    if (!selectedLeads.length) {
      // this.toastrService.warning('Vui lòng chọn ít nhất 1 lead');
      this.selectBatchActions?.handleClearClick();
      return;
    }

    switch (action.value) {
      case ELeadBulkAction.MOVE_TO_FUNNEL:
        this.handleMoveToFunnel(selectedLeads);
        break;
      case ELeadBulkAction.DELETE_MULTI:
        this.handleDeleteMultiple(selectedLeads);
        break;
      case ELeadBulkAction.UPDATE_STATUS:
        this.toastrService.info('Chức năng đang phát triển');
        this.selectBatchActions?.handleClearClick();
        break;
      case ELeadBulkAction.ADD_TAGS:
      case ELeadBulkAction.REMOVE_TAGS:
        this.toastrService.info('Chức năng đang phát triển');
        this.selectBatchActions?.handleClearClick();
        break;
      default:
        this.selectBatchActions?.handleClearClick();
        break;
    }
  }

  handleMoveToFunnel(leads: ILead[]) {
    // Get current funnel ID from selected leads (assuming all selected leads are in the same funnel)
    const currentFunnelId =
      this.selectedFolder?.type === 'funnel'
        ? this.selectedFolder.funnels?.[0]?.id || this.selectedFolder.id
        : undefined;

    const modalRef = this.modalService.show(LeadBulkMoveModalComponent, {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        leadIds: leads.map((l) => l.id),
        currentFunnelId: currentFunnelId,
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).moveEvent?.subscribe((funnelId: string) => {
        (modalRef.content as any).isSubmitting = true;

        this.autoTaskService.lead
          .bulkUpdate({
            ids: leads.map((l) => l.id),
            payload: {
              funnelId: funnelId,
            },
          })
          .subscribe({
            next: (res: any) => {
              if (res.status === 200) {
                this.toastrService.success('Di chuyển lead thành công');
                this.getDataSource(true);
                this.handleRefreshRow();
                modalRef.hide();
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              this.toastrService.error('Di chuyển lead thất bại');
              (modalRef.content as any).isSubmitting = false;
            },
          });
      });
    }

    // Reset selection when modal is closed (either by cancel or successful submit)
    modalRef.onHidden?.subscribe(() => {
      this.selectBatchActions?.handleClearClick();
    });
  }

  handleDeleteMultiple(leads: ILead[]) {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${leads.length} lead đã chọn?`)) {
      this.selectBatchActions?.handleClearClick();
      return;
    }

    const ids = leads.map((l) => l.id);
    this.autoTaskService.lead.bulkDelete(ids).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa lead thành công');
          this.getDataSource(true);
          this.handleRefreshRow();
          this.selectBatchActions?.handleClearClick();
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa lead thất bại');
        this.selectBatchActions?.handleClearClick();
      },
    });
  }

  onSearchEvent(event: {term: string; name: string}): void {
    if (event.name === 'search') {
      this.handleSearch(event.term);
    }
  }

  onSelectEvent(event: {value?: string | string[]; name: string}): void {
    const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');

    // Nếu value là undefined hoặc mảng rỗng, xóa key khỏi filter object
    if (
      event.value === undefined ||
      (Array.isArray(event.value) && event.value.length === 0)
    ) {
      delete filterObj[event.name];
    } else {
      filterObj[event.name] = event.value;
    }

    this.item.paramsQuery.filter = JSON.stringify(filterObj);

    // Chỉ gọi API cho filter cơ bản (không phải advance filter)
    const filter = this.configFilters.find((f) => f.name === event.name);
    if (!filter || filter.botherType !== EBotherAdvanceBasicFilter.ADVANCE) {
      this.getDataSource(true);
    }
  }

  onPickerDateEvent(event: {value: any; name: string}): void {
    const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');

    if (event.name === 'createdAt') {
      const hValue = event.value as IDateRange;
      if (hValue?.fromDate && hValue?.toDate) {
        filterObj.createdAt = {
          fromDate: moment(hValue.fromDate).startOf('day'),
          toDate: moment(hValue.toDate).endOf('day'),
        };
      } else {
        delete filterObj.createdAt;
      }
    } else {
      // Handle other date filters if any
      if (
        event.value === undefined ||
        event.value === null ||
        (event.value.fromDate === undefined && event.value.toDate === undefined)
      ) {
        delete filterObj[event.name];
      } else {
        filterObj[event.name] = event.value;
      }
    }

    this.item.paramsQuery.filter = JSON.stringify(filterObj);
  }

  onPopoverEvent(event: {value: string; name: string}): void {
    if (event.name === 'sort') {
      this.item.paramsQuery.sort = event.value;
      this.getDataSource(true);
    }
  }

  getTagById(tagId?: string): ILeadTag | undefined {
    if (!tagId) return undefined;
    return this.tagMap.get(tagId); // O(1) lookup instead of O(n) find
  }

  hasTagById(tagId?: string): boolean {
    if (!tagId) return false;
    return this.tagMap.has(tagId);
  }

  /**
   * Build status lookup Map for O(1) access
   */
  private buildStatusMap(): void {
    if (!this.statusMap) {
      return; // Map not initialized yet, skip
    }
    this.statusMap.clear();
    this.statuses.rows.forEach((status) => {
      this.statusMap.set(status.id, status);
    });
  }

  /**
   * Build tag lookup Map for O(1) access
   */
  private buildTagMap(): void {
    if (!this.tagMap) {
      return; // Map not initialized yet, skip
    }
    this.tagMap.clear();
    this.tags.rows.forEach((tag) => {
      this.tagMap.set(tag.id, tag);
    });
  }

  /**
   * Hook methods to build status map
   */
  protected override onStatusesSuccess(statuses: ILeadStatus[]): void {
    this.buildStatusMap();
  }

  /**
   * Hook methods to build tag map
   */
  protected override onTagsSuccess(tags: ILeadTag[]): void {
    this.buildTagMap();
  }

  hasStatusById(statusId?: string): boolean {
    if (!statusId) return false;
    return this.statusMap.has(statusId);
  }

  getStatusById(statusId?: string): ILeadStatus | undefined {
    if (!statusId) return undefined;
    return this.statusMap.get(statusId); // O(1) lookup instead of O(n) find
  }

  formatCurrency(value?: number): string {
    if (!value) return '0 VND';
    return value.toLocaleString('vi-VN') + ' VND';
  }

  formatDate(date?: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.cdr.detectChanges(); // Force change detection
  }

  onChangePage(event: {page: number; limit: number}) {
    if (event?.page !== undefined) {
      this.item.paramsQuery.page = event.page;
    }
    if (event?.limit !== undefined) {
      this.item.paramsQuery.limit = event.limit;
    }
    this.getDataSource();
  }

  onFolderSelected(folder: ILeadFolder) {
    this.selectedFolder = folder;

    // Apply funnel filter to API query
    if (folder.type === 'funnel') {
      // Get the actual funnel ID (from funnels array or folder id itself)
      const funnelId = folder.funnels?.[0]?.id || folder.id;

      // Add funnelId_in to filter object
      const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');
      filterObj.funnelId_in = funnelId;
      this.item.paramsQuery.filter = JSON.stringify(filterObj);

      // Reload leads with new filter
      this.getDataSource(true);
    } else {
      // If folder is selected (not funnel), remove funnel filter
      const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');
      delete filterObj.funnelId_in;
      this.item.paramsQuery.filter = JSON.stringify(filterObj);

      // Reload leads without funnel filter
      this.getDataSource(true);
    }
  }

  onFoldersLoaded() {
    // Called when folders are loaded (with or without funnels)
    // If no funnel was auto-selected, we still need to load leads (without funnel filter)
    if (!this.selectedFolder) {
      // Ensure funnelId_in is not in filter object
      const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');
      delete filterObj.funnelId_in;
      this.item.paramsQuery.filter = JSON.stringify(filterObj);
      // Load leads without funnel filter
      this.getDataSource(true);
    }
    // If a funnel was auto-selected, onFolderSelected() would have already been called
  }

  onHardRefreshCompleted() {
    // Called when hard refresh in sidebar is completed
    // Refresh leads data to ensure consistency
    this.getDataSource(true);
  }

  onFolderAction(event: {action: string; folder: ILeadFolder}) {
    if (event.action === 'edit-funnel') {
      // Open funnel edit modal
      const funnelId = event.folder.funnels?.[0]?.id || event.folder.id;
      this.openFunnelModal(funnelId);
    }
  }

  openFunnelModal(funnelId?: string) {
    // If editing, fetch funnel detail first
    if (funnelId) {
      this.autoTaskService.leadFunnel.getById(funnelId).subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.showFunnelModal(res.data);
          } else {
            this.toastrService.error('Không thể lấy thông tin phễu');
          }
        },
        error: (err: any) => {
          this.toastrService.error('Không thể lấy thông tin phễu');
        },
      });
    } else {
      // Creating new funnel
      this.showFunnelModal();
    }
  }

  private showFunnelModal(funnel?: any) {
    // Get folders for dropdown (filter only type 'folder')
    const folders = this.getFoldersForDropdown();

    const modalRef = this.modalService.show(LeadFunnelFormModalComponent, {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        funnel: funnel,
        folders: folders,
        leadStatuses: this.statuses.rows.filter((s) => s.isActive),
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).saveEvent?.subscribe((data: any) => {
        if (funnel) {
          // Update funnel
          this.autoTaskService.leadFunnel.update(funnel.id, data).subscribe({
            next: (res: any) => {
              if (res.status === 200) {
                this.toastrService.success('Cập nhật phễu thành công');
                // Notify other components
                this.autoTaskService.notifyFunnelDataChanged();
                // Reload sidebar and mark as local action to prevent duplicate socket reload
                this.folderSidebar?.loadFoldersWithFunnels(true, true);
                modalRef.hide();
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              this.toastrService.error('Cập nhật phễu thất bại');
              (modalRef.content as any).isSubmitting = false;
            },
          });
        } else {
          // Create funnel
          this.autoTaskService.leadFunnel.create(data).subscribe({
            next: (res: any) => {
              if (res.status === 200 || res.status === 201) {
                this.toastrService.success('Tạo phễu thành công');
                // Notify other components
                this.autoTaskService.notifyFunnelDataChanged();
                // Reload sidebar and mark as local action to prevent duplicate socket reload
                this.folderSidebar?.loadFoldersWithFunnels(true, true);
                modalRef.hide();
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              this.toastrService.error('Tạo phễu thất bại');
              (modalRef.content as any).isSubmitting = false;
            },
          });
        }
      });
    }
  }

  private getFoldersForDropdown(): any[] {
    // Load folders from localStorage (same as sidebar component)
    const savedFolders = localStorage.getItem('leadFolders');
    if (savedFolders) {
      try {
        const folders = JSON.parse(savedFolders);
        // Filter only items with type 'folder' (not 'funnel')
        return this.extractFolders(folders);
      } catch (e) {
        console.error('Error parsing leadFolders from localStorage:', e);
        return [];
      }
    }
    return [];
  }

  private extractFolders(items: ILeadFolder[]): any[] {
    const folders: any[] = [];
    items.forEach((item) => {
      // Exclude 'pinned' folder from dropdown as it's UI only
      if (item.type === 'folder' && item.id !== 'pinned') {
        folders.push({id: item.id, name: item.name});
        // Add nested folders if any
        if (item.children) {
          folders.push(...this.extractFolders(item.children));
        }
      }
    });
    return folders;
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};

    // Apply sort
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];

    // Lấy các selected Branch và Role Ids từ checkbox filter và gán vào params
    // Parse filter object từ params
    const filterObj = JSON.parse(params.filter || '{}');

    // Áp dụng accessibleIds từ checkbox filter
    if (this.checkbox.accessibleIds?.length) {
      filterObj['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      // Nếu không có accessibleIds trong checkbox, xóa khỏi filter
      delete filterObj['accessibleIds'];
    }

    // Xóa branchIds khỏi filter (không sử dụng nữa)
    delete filterObj['branchIds'];

    // Áp dụng roleIds từ checkbox filter -> teams.roleId_in
    // Đảm bảo roleIds là mảng hợp lệ
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];

    if (validRoleIds.length > 0) {
      filterObj['teams.roleId_in'] = validRoleIds;
    } else {
      // Nếu không có roleIds trong checkbox, xóa khỏi filter
      delete filterObj['teams.roleId_in'];
    }

    // Cập nhật params.filter với filter object đã được cập nhật
    params.filter = JSON.stringify(filterObj);

    this.autoTaskService.lead
      .get(params)
      .pipe(
        finalize(() => {
          this.item = {...this.item, loading: false};
        }),
        shareReplay(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.item.rows = res.data;
            this.item.total = res.meta?.total || 0;
            if (res.meta?.after) this.item.after = res.meta.after;
            this.groupLeadsByStatus();
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          console.error('Error fetching leads:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  groupLeadsByStatus() {
    this.leadsByStatus.clear();

    // Initialize all active statuses with empty arrays
    this.statuses.rows
      .filter((status) => status.isActive)
      .forEach((status) => {
        this.leadsByStatus.set(status.id, []);
      });

    // Group leads by status
    this.item.rows.forEach((lead) => {
      const statusId = lead.statusId || lead.status?.id;
      if (statusId && this.leadsByStatus.has(statusId)) {
        this.leadsByStatus.get(statusId)!.push(lead);
      }
    });
  }

  getStatusBgColorWithOpacity(bgColor?: string): string {
    if (!bgColor) return 'rgba(200, 200, 200, 0.2)';

    // Convert hex to rgba with 20% opacity
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }

  trackByStatusId(index: number, status: ILeadStatus): string {
    return status.id;
  }

  trackByLeadId(index: number, lead: ILead): string {
    return lead.id;
  }

  getConnectedDropLists(): string[] {
    return this.activeStatuses.map((status) => status.id);
  }

  onDrop(event: CdkDragDrop<ILead[]>, targetStatusId: string) {
    if (event.previousContainer === event.container) {
      // Same column - reorder within the same status
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // Different column - transfer to new status
      const lead = event.previousContainer.data[event.previousIndex];

      // Update lead status locally first for immediate UI feedback
      lead.statusId = targetStatusId;

      // Transfer the item to the new container
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Update lead status on server
      this.updateLeadStatus(lead.id, targetStatusId);
    }
  }

  private updateLeadStatus(leadId: string, statusId: string) {
    this.autoTaskService.lead.update(leadId, {statusId} as any).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          // API thành công - không cần làm gì thêm, UI đã được cập nhật optimistically
          // Không reload data để tránh làm chậm UX
        } else {
          this.commonService.handleResErr(res);
          // Revert the change on error
          this.getDataSource(false);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Cập nhật trạng thái lead thất bại');
        // Revert the change on error
        this.getDataSource(false);
      },
    });
  }

  getLinkCreateTaskByLead(leadId: string) {
    return `${environment.urlDomain}/${this.currentBiz!.alias}/${
      environment.module
    }/?leadId=${leadId}`;
  }

  /**
   * Open task detail in new tab
   * @param taskCode - Task code to find corresponding taskId
   * @param lead - Lead object containing taskCodes and taskIds arrays
   */
  openTaskDetail(taskIdx: number, lead: ILead): void {
    if (!lead.taskCodes || !lead.taskIds) {
      return;
    }

    // Find index of taskCode in taskCodes array
    const taskId = lead.taskIds[taskIdx];
    if (!taskId) {
      console.warn(`No taskId found at index ${taskIdx}`, lead.taskIds);
      return;
    }

    // Build URL and open in new tab
    this.authService.currentBiz.pipe(first()).subscribe((biz) => {
      if (biz?.alias) {
        const url = `${environment.urlDomain}/${biz.alias}/${environment.module}/dashboard?id=${taskId}`;
        window.open(url, '_blank');
      }
    });
  }

  onApplyEvent(event: any) {
    // Apply advanced filters and refresh lead list
    // Sync filter values from paramsQuery back to configFilters for UI persistence
    this.syncFilterValuesFromQuery();
    this.getDataSource(true);
  }

  onResetEvent(event: any) {
    // Reset filters to default state
    this.item.paramsQuery.filter = '{}';
    this.item.paramsQuery.sort = '-createdAt';
    this.item.paramsQuery.q = '';
    this.item.paramsQuery.page = 1;

    // Reset all filter values in config (including advanced filters)
    this.configFilters.forEach((filter) => {
      if (filter.type === ETypeFilter.SEARCH) {
        filter.value = '';
      } else if (filter.type === ETypeFilter.SELECT) {
        filter.value = undefined;
      } else if (filter.type === ETypeFilter.DATE) {
        filter.value = undefined;
      } else if (
        filter.type === ETypeFilter.POPOVER &&
        filter.name === 'sort'
      ) {
        filter.value = '-createdAt';
      }
    });

    // Refresh lead list
    this.getDataSource(true);
  }

  private loadUsersForFilter(): void {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz?.users) {
          const withSystemUser = (list: User[]) =>
            [{name: 'Hệ thống', id: 'system'}].concat(list);
          // Filter active users only
          const activeUsers = withSystemUser(
            biz.users.filter((user) => user.isActive),
          );

          // Update options for createdBy filter
          const createdByFilter = this.configFilters.find(
            (filter) => filter.name === 'createdBy.id_in',
          );
          if (createdByFilter) {
            createdByFilter.options = activeUsers;
          }

          const memberFilter = this.configFilters.find(
            (filter) => filter.name === 'teams.userId_in',
          );
          if (memberFilter) {
            memberFilter.options = activeUsers;
          }
        }
      });
  }

  private handleFolderWithFunnelSynchronized(data: any) {
    // Note: Sidebar component has its own socket listener and will reload automatically
    // We only need to:
    // 1. Notify other components (e.g. modals) about funnel data changes
    this.autoTaskService.notifyFunnelDataChanged();

    // No need to call folderSidebar.loadFoldersWithFunnels() here
    // as sidebar component listens to the same socket event and handles reload itself
  }

  /**
   * Setup checkbox data for branch and role filters
   */
  setupCheckbox() {
    if (this.currentBiz) {
      // Fallback: nếu chưa có setting.roles thì cho phép tất cả role đang active của user
      const allowedRoleIds =
        (this.setting?.roles?.length
          ? this.setting.roles
          : this.currentBiz.user.roles?.map((r: BizRole) => r.id)) || [];

      this.checkbox.listRoles =
        this.currentBiz.user.roles?.filter(
          (r: BizRole) => allowedRoleIds.includes(r.id) && r.isActive,
        ) || [];
      this.checkbox.listUsers =
        this.currentBiz.users?.filter((u: User) => u.isActive) || [];
      this.checkbox.listBranches = this.authService.getBranchPer();

      // Setup branch structure with children
      this.checkbox.listBranches = this.checkbox.listBranches.map(
        (branch: any) => {
          if (branch.departments?.length) {
            branch.children = branch.departments.map((department: any) => {
              if (department.teams?.length) {
                department.children = department.teams;
              }
              return department;
            });
          }
          return branch;
        },
      );

      // Initialize accessibleIds from filter if exists (migrate from branchIds if needed)
      const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');

      // Nếu có accessibleIds trong filter, sử dụng trực tiếp
      if (objFilterQuery.accessibleIds && objFilterQuery.accessibleIds.length) {
        this.checkbox.accessibleIds = objFilterQuery.accessibleIds;
        // Cần tính lại branchIds từ accessibleIds để hiển thị UI
        // Tạm thời để trống, sẽ được tính khi user thay đổi filter
        this.checkbox.branchIds = [];
      }
      // Migration: Nếu vẫn còn branchIds trong filter (backward compatibility)
      else if (objFilterQuery.branchIds && objFilterQuery.branchIds.length) {
        const detectBranchFilter = this.authService.detectFilterBranchIds(
          objFilterQuery.branchIds,
        );
        if (detectBranchFilter.nestedIds?.length) {
          this.checkbox.branchIds = detectBranchFilter.nestedIds.flat();
        }
        this.updateBranchDisplayText(detectBranchFilter);
        this.checkbox.accessibleIds = [
          ...(detectBranchFilter.branchIds || []),
          ...(detectBranchFilter.departmentIds || []),
          ...(detectBranchFilter.teamIds || []),
        ];
      }
      // Default: không có filter
      else {
        // Default: select all branches user has access to
        this.checkbox.branchIds = [];
        this.checkbox.listBranches.forEach((branch: any) => {
          this.checkbox.branchIds.push(branch.id);
          if (branch.departments?.length) {
            branch.departments.forEach((department: any) => {
              if (branch.role !== 'OWNER') {
                this.checkbox.branchIds.push(department.id);
              }
              if (department.teams?.length && department.role !== 'OWNER') {
                this.checkbox.branchIds.push(
                  ...department.teams.map((t: any) => t.id),
                );
              }
            });
          }
        });
        if (this.checkbox.branchIds.length) {
          const detectFilter = this.authService.detectFilterBranchIds(
            this.checkbox.branchIds,
          );
          this.updateBranchDisplayText(detectFilter);
          this.checkbox.accessibleIds = [
            ...(detectFilter.branchIds || []),
            ...(detectFilter.departmentIds || []),
            ...(detectFilter.teamIds || []),
          ];
        }
      }

      // Initialize roleIds from filter if exists
      if (
        objFilterQuery['teams.roleId_in'] &&
        Array.isArray(objFilterQuery['teams.roleId_in']) &&
        objFilterQuery['teams.roleId_in'].length
      ) {
        // Fallback: check for teams.roleId_in format
        this.checkbox.roleIds = objFilterQuery['teams.roleId_in'].filter(
          (id) => id != null && id !== '',
        );
      } else {
        // Default: no pre-selected roles
        this.checkbox.roleIds = Array.isArray(this.checkbox.roleIds)
          ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
          : [];
      }

      // Initialize userIds from filter if exists
      if (
        objFilterQuery['teams.userId_in'] &&
        Array.isArray(objFilterQuery['teams.userId_in']) &&
        objFilterQuery['teams.userId_in'].length
      ) {
        this.checkbox.userIds = objFilterQuery['teams.userId_in'].filter(
          (id: any) => id != null && id !== '',
        );
      } else {
        this.checkbox.userIds = this.checkbox.userIds || [];
      }
    }
  }

  /**
   * Update branch display text
   */
  private updateBranchDisplayText(detectFilter: any) {
    this.checkbox.branchDisplayInputText = 'Lựa chọn';
    const lengthBranch = detectFilter.branchIds?.length;
    const lengthDepartment = detectFilter.departmentIds?.length;
    const lengthTeam = detectFilter.teamIds?.length;
    if (lengthBranch && lengthDepartment && lengthTeam) {
      this.checkbox.branchDisplayInputText = `${lengthBranch} CN, ${lengthDepartment} PB, ${lengthTeam} ĐN`;
    } else if (
      [lengthBranch, lengthDepartment, lengthTeam].filter((t) => t > 0).length >
      1
    ) {
      const strValue = [];
      if (lengthBranch) strValue.push(`${lengthBranch} CN`);
      if (lengthDepartment) strValue.push(`${lengthDepartment} PB`);
      if (lengthTeam) strValue.push(`${lengthTeam} ĐN`);
      this.checkbox.branchDisplayInputText = strValue.join(', ');
    } else {
      this.checkbox.branchDisplayInputText = '';
      if (lengthBranch)
        this.checkbox.branchDisplayInputText += `${lengthBranch} chi nhánh`;
      if (lengthDepartment)
        this.checkbox.branchDisplayInputText += `${lengthDepartment} phòng ban`;
      if (lengthTeam)
        this.checkbox.branchDisplayInputText += `${lengthTeam} đội nhóm`;
    }
  }

  /**
   * Handle branch filter change
   */
  changeBranch({branchIds = []}: {branchIds: string[]}) {
    this.checkbox.branchIds = branchIds;

    if (branchIds.length) {
      const detectFilter = this.authService.detectFilterBranchIds(branchIds);
      this.updateBranchDisplayText(detectFilter);
      this.checkbox.accessibleIds = [
        ...(detectFilter.branchIds || []),
        ...(detectFilter.departmentIds || []),
        ...(detectFilter.teamIds || []),
      ];
    } else {
      this.checkbox.branchDisplayInputText = '';
      this.checkbox.accessibleIds = [];
    }

    this.handleChangeCheckbox();
  }

  /**
   * Handle role filter change
   */
  changeRole(roleIds: string[] | any) {
    // Ensure roleIds is a valid array
    let validRoleIds: string[] = [];
    if (Array.isArray(roleIds)) {
      validRoleIds = roleIds.filter((id) => id != null && id !== '');
    } else if (roleIds != null && roleIds !== '') {
      validRoleIds = [roleIds];
    }

    this.checkbox.roleIds = validRoleIds;
    this.handleChangeCheckbox();
  }

  /**
   * Handle checkbox filter changes and update query params
   */
  handleChangeCheckbox(isReload: boolean = false) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');

    // Update accessibleIds (thay thế branchIds)
    if (this.checkbox.accessibleIds?.length) {
      objFilterQuery['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      delete objFilterQuery['accessibleIds'];
    }

    // Xóa branchIds khỏi filter (không sử dụng nữa)
    delete objFilterQuery['branchIds'];

    // Update teams.roleId_in (roleIds) - deprecated teamRoles removed
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];

    if (validRoleIds.length > 0) {
      objFilterQuery['teams.roleId_in'] = validRoleIds; // API format
      delete objFilterQuery.teamRoles; // drop deprecated field
    } else {
      delete objFilterQuery['teams.roleId_in'];
      delete objFilterQuery.teamRoles;
    }

    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);

    if (isReload) {
      this.getDataSource(true);
    } else {
      // Only reload if filter actually changed
      this.getDataSource(true);
    }
  }

  /**
   * Update filter by team members (teams.userId_in) from header filter
   */
  changeMembers(userIds: string[] | any) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    const validUserIds = Array.isArray(userIds)
      ? userIds.filter((id: any) => id != null && id !== '')
      : [];

    this.checkbox.userIds = validUserIds;

    if (validUserIds.length) {
      objFilterQuery['teams.userId_in'] = validUserIds;
    } else {
      delete objFilterQuery['teams.userId_in'];
    }

    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
    this.getDataSource(true);
  }

  /**
   * Sync filter values from paramsQuery back to configFilters
   * This ensures the UI shows the correct applied filters when reopening the advanced filter
   */
  private syncFilterValuesFromQuery() {
    try {
      const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');

      this.configFilters.forEach((filter) => {
        if (filter.botherType === EBotherAdvanceBasicFilter.ADVANCE) {
          // Sync value from filter object to config
          if (filterObj.hasOwnProperty(filter.name!)) {
            filter.value = filterObj[filter.name!];
          } else {
            // Clear value if not in filter object
            filter.value = undefined;
          }
        }
      });
    } catch (e) {
      console.error('Error syncing filter values:', e);
    }
  }
}
