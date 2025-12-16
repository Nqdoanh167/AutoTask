import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute} from '@angular/router';
import {LeadDashboardData} from './lead-dashboard-data';
import {ILead} from '@app/types/lead';
import {ILeadStatus} from '@app/types/lead-status';
import {ILeadTag} from '@app/types/lead-tag';
import {User, BizRole} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {takeUntil, finalize, shareReplay} from 'rxjs';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {EBotherAdvanceBasicFilter} from '@app/types/common';

@Component({
  selector: 'app-lead-dashboard',
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.scss'],
})
export class LeadDashboardComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  public viewMode: 'kanban' | 'list' = 'list';
  public leadsByStatus: Map<string, ILead[]> = new Map();
  public statusMap: Map<string, ILeadStatus> = new Map();
  public tagMap: Map<string, ILeadTag> = new Map();
  public isGroupFolderExpanded: boolean = false;

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
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly mainService: MainService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.buildStatusMap();
    this.buildTagMap();
    this.setupCheckbox();
    this.socketService.connect();
    this.setupSocketListeners();
    this.getDataSource(true);
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.setting = setting || {};
        this.setupCheckbox();
      });
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz) {
          this.setupCheckbox();
        }
      });
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((q) => {
      if (q['id']) {
        this.openLeadModal(q['id']);
      }
    });
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async setupSocketListeners(): Promise<void> {
    try {
      await this.socketService.waitForSocket();
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
  }

  handleAddFolder() {
    // TODO: Implement add folder functionality
    this.toastrService.info('Chức năng thêm folder đang được phát triển');
  }

  openLeadModal(leadId?: string) {
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
      this.showLeadModal();
    }
  }

  private showLeadModal(lead?: ILead) {
    const cachedSources = this.getCachedPublicSources();
    const modalRef = this.modalService.show(LeadFormModalComponent, {
      class: 'modal-dialog-centered modal-medium',
      initialState: {
        lead: lead,
        statuses: this.statuses.rows,
        tags: this.tags.rows,
        cachedSources: cachedSources,
      } as any,
    });

    if (modalRef.content) {
      (modalRef.content as any).saveEvent?.subscribe((data: any) => {
        if (lead) {
          this.autoTaskService.lead.update(lead.id, data).subscribe({
            next: (res: any) => {
              if (res.status === 200) {
                this.toastrService.success('Cập nhật lead thành công');
                this.getDataSource(true);
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
          this.autoTaskService.lead.create(data).subscribe({
            next: (res: any) => {
              if (res.status === 200 || res.status === 201) {
                this.toastrService.success('Tạo lead thành công');
                this.getDataSource(true);
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

  handleDeleteMultiple(leads: ILead[]) {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${leads.length} lead đã chọn?`)) {
      return;
    }

    const ids = leads.map((l) => l.id);
    this.autoTaskService.lead.bulkDelete(ids).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa lead thành công');
          this.getDataSource(true);
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa lead thất bại');
      },
    });
  }

  getTagById(tagId?: string): ILeadTag | undefined {
    if (!tagId) return undefined;
    return this.tagMap.get(tagId);
  }

  private buildStatusMap(): void {
    if (!this.statusMap) {
      return;
    }
    this.statusMap.clear();
    this.statuses.rows.forEach((status) => {
      this.statusMap.set(status.id, status);
    });
  }

  private buildTagMap(): void {
    if (!this.tagMap) {
      return;
    }
    this.tagMap.clear();
    this.tags.rows.forEach((tag) => {
      this.tagMap.set(tag.id, tag);
    });
  }

  protected override onStatusesSuccess(statuses: ILeadStatus[]): void {
    this.buildStatusMap();
  }

  protected override onTagsSuccess(tags: ILeadTag[]): void {
    this.buildTagMap();
  }

  formatCurrency(value?: number): string {
    if (!value) return '0 VND';
    return value.toLocaleString('vi-VN') + ' VND';
  }

  formatDate(date?: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  onHardRefreshCompleted() {
    this.getDataSource(true);
  }

  override getDataSource(isReset?: boolean) {
    this.item.loading = true;
    if (isReset) {
      this.item.paramsQuery.page = 1;
    }
    let params = {...this.item.paramsQuery};
    Object.keys(this.sort).forEach((key) => {
      if (this.sort[key] !== 0) {
        let sortAll = params.sort?.split(',') || [];
        sortAll.push(this.sort[key] === 1 ? `${key}` : `-${key}`);
        params.sort = sortAll.join(',');
      }
    });

    this.item.rows = [];
    const filterObj = JSON.parse(params.filter || '{}');
    if (this.checkbox.accessibleIds?.length) {
      filterObj['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      delete filterObj['accessibleIds'];
    }
    delete filterObj['branchIds'];
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];
    if (validRoleIds.length > 0) {
      filterObj['teams.roleId_in'] = validRoleIds;
    } else {
      delete filterObj['teams.roleId_in'];
    }
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
    this.statuses.rows
      .filter((status) => status.isActive)
      .forEach((status) => {
        this.leadsByStatus.set(status.id, []);
      });
    this.item.rows.forEach((lead) => {
      const statusId = lead.statusId || lead.status?.id;
      if (statusId && this.leadsByStatus.has(statusId)) {
        this.leadsByStatus.get(statusId)!.push(lead);
      }
    });
  }

  getStatusBgColorWithOpacity(bgColor?: string): string {
    if (!bgColor) return 'rgba(200, 200, 200, 0.2)';
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
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      const lead = event.previousContainer.data[event.previousIndex];
      lead.statusId = targetStatusId;
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.updateLeadStatus(lead.id, targetStatusId);
    }
  }

  private updateLeadStatus(leadId: string, statusId: string) {
    this.autoTaskService.lead.update(leadId, {statusId} as any).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
        } else {
          this.commonService.handleResErr(res);
          this.getDataSource(false);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Cập nhật trạng thái lead thất bại');
        this.getDataSource(false);
      },
    });
  }

  private handleFolderWithFunnelSynchronized(data: any) {
    this.autoTaskService.notifyFunnelDataChanged();
  }

  // Bộ lọc
  setupCheckbox() {
    if (this.currentBiz) {
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
      const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
      if (objFilterQuery.accessibleIds && objFilterQuery.accessibleIds.length) {
        this.checkbox.accessibleIds = objFilterQuery.accessibleIds;
        this.checkbox.branchIds = [];
      } else if (objFilterQuery.branchIds && objFilterQuery.branchIds.length) {
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
      } else {
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
      if (
        objFilterQuery['teams.roleId_in'] &&
        Array.isArray(objFilterQuery['teams.roleId_in']) &&
        objFilterQuery['teams.roleId_in'].length
      ) {
        this.checkbox.roleIds = objFilterQuery['teams.roleId_in'].filter(
          (id) => id != null && id !== '',
        );
      } else {
        this.checkbox.roleIds = Array.isArray(this.checkbox.roleIds)
          ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
          : [];
      }
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

  changeRole(roleIds: string[] | any) {
    let validRoleIds: string[] = [];
    if (Array.isArray(roleIds)) {
      validRoleIds = roleIds.filter((id) => id != null && id !== '');
    } else if (roleIds != null && roleIds !== '') {
      validRoleIds = [roleIds];
    }

    this.checkbox.roleIds = validRoleIds;
    this.handleChangeCheckbox();
  }

  handleChangeCheckbox(isReload: boolean = false) {
    const objFilterQuery = JSON.parse(this.item.paramsQuery.filter || '{}');
    if (this.checkbox.accessibleIds?.length) {
      objFilterQuery['accessibleIds'] = this.checkbox.accessibleIds;
    } else {
      delete objFilterQuery['accessibleIds'];
    }
    delete objFilterQuery['branchIds'];
    const validRoleIds = Array.isArray(this.checkbox.roleIds)
      ? this.checkbox.roleIds.filter((id: any) => id != null && id !== '')
      : [];
    if (validRoleIds.length > 0) {
      objFilterQuery['teams.roleId_in'] = validRoleIds;
      delete objFilterQuery.teamRoles;
    } else {
      delete objFilterQuery['teams.roleId_in'];
      delete objFilterQuery.teamRoles;
    }
    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
    if (isReload) {
      this.getDataSource(true);
    } else {
      this.getDataSource(true);
    }
  }

  changeUser(userIds: string[] | any) {
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

  handleFilterAdvance(filter: any) {
    const objFilterQuery = {
      ...JSON.parse(this.item.paramsQuery.filter || '{}'),
      ...filter,
    };
    const configFilterAdvance = this.configFilters.filter(
      (item) => item.botherType === EBotherAdvanceBasicFilter.ADVANCE,
    );

    // Xóa những field có trong configFilterAdvance mà không có trong filter
    configFilterAdvance.forEach((item) => {
      if (!Object.keys(filter).includes(item.name!)) {
        delete objFilterQuery[item.name!];
      }
    });

    this.item.paramsQuery.filter = JSON.stringify(objFilterQuery);
    this.getDataSource(true);
  }

  // Sidebar
  toggleGroupFolder() {
    this.isGroupFolderExpanded = !this.isGroupFolderExpanded;
  }
}
