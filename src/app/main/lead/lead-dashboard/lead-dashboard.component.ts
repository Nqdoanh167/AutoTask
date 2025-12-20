import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute} from '@angular/router';
import {LeadDashboardData} from './lead-dashboard-data';
import {ILead, IFolderLead, ILeadStatus, ILeadTag} from '@app/types/lead';
import {User, BizRole} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {ModalConfirmService} from '@share/custom/modal-confirm/modal-confirm.service';
import {IModalConfirmContent} from '@share/custom/modal-confirm/modal-confirm.component';
import {
  takeUntil,
  finalize,
  shareReplay,
  BehaviorSubject,
  distinctUntilChanged,
} from 'rxjs';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';
import {FolderFormModalComponent} from './folder-form-modal/folder-form-modal.component';
import {AuthService} from '@app/services/api/auth.service';
import {EBotherAdvanceBasicFilter} from '@app/types/common';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-lead-dashboard',
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.scss'],
})
export class LeadDashboardComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild('kanbanBoard', {read: ElementRef})
  kanbanBoard?: ElementRef<HTMLElement>;

  public viewMode: 'kanban' | 'list' = 'kanban';
  public leadsByStatus: Map<string, ILead[]> = new Map();
  public statusMap: Map<string, ILeadStatus> = new Map();
  public tagMap: Map<string, ILeadTag> = new Map();
  public isGroupFolderExpanded: boolean = false;
  public folderLeads: IFolderLead[] = [];
  public expandedFunnelGroups: Map<string, Set<string>> = new Map();
  public currentFunnelId$ = new BehaviorSubject<string | null>(null);

  private autoScrollInterval: any;
  private readonly SCROLL_SPEED = 15;
  private readonly EDGE_THRESHOLD = 100;

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
    private readonly modalConfirmService: ModalConfirmService,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.buildStatusMap();
    this.buildTagMap();
    this.setupCheckbox();
    this.getFolderLead();

    // Subscribe vào currentFolderId$ để tự động getDataSource khi thay đổi
    this.currentFunnelId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((funnelId) => {
        if (funnelId) {
          this.getDataSource(true);
          this.openFunnelGroup(funnelId);
        }
      });

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
    this.stopAutoScroll();
    this.destroy$.next();
    this.destroy$.complete();
  }

  override handleAction(name: string) {
    if (name === 'reload' && !this.item.loading) {
      this.getFolderLead();
    }
    if (name === 'add_new') {
      this.openLeadModal();
    }
  }

  handleAddFolder(type: 'folder' | 'group' | 'funnel' = 'folder') {
    const modalRef = this.modalService.show(FolderFormModalComponent, {
      class: 'modal-dialog-centered modal-md',
      initialState: {
        type: type,
      },
    });

    modalRef.content?.saveEvent?.subscribe(() => {
      this.getFolderLead();
    });
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
                this.handleAction('reload');
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
              (modalRef.content as any).isSubmitting = false;
            },
          });
        } else {
          this.autoTaskService.lead.create(data).subscribe({
            next: (res: any) => {
              if (res.status === 200 || res.status === 201) {
                this.handleAction('reload');
              } else {
                this.commonService.handleResErr(res);
              }
              (modalRef.content as any).isSubmitting = false;
            },
            error: (err: any) => {
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
          this.handleAction('reload');
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

  protected override onStatusesSuccess(): void {
    this.buildStatusMap();
  }

  protected override onTagsSuccess(): void {
    this.buildTagMap();
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

    const currentFunnelId = this.currentFunnelId$.value;
    if (currentFunnelId) {
      filterObj['funnelId_in'] = currentFunnelId;
    } else {
      delete filterObj['funnelId_in'];
    }

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
      this.handleAction('reload');
    } else {
      this.handleAction('reload');
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
    this.handleAction('reload');
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
    this.handleAction('reload');
  }

  // Sidebar
  toggleGroupFolder() {
    this.isGroupFolderExpanded = !this.isGroupFolderExpanded;
  }

  getFolderLead(): void {
    this.autoTaskService.leadFolder
      .getWithFunnels()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.folderLeads = res.data;

            // Nếu chưa có currentFolderId, lấy funnel đầu tiên
            if (!this.currentFunnelId$.value && this.folderLeads.length > 0) {
              for (const folder of this.folderLeads) {
                for (const group of folder.funnelGroups || []) {
                  for (const funnel of group.funnels || []) {
                    if (funnel.id) {
                      this.currentFunnelId$.next(funnel.id);
                      return;
                    }
                  }
                }
              }
            }
          }
        },
        error: (err: any) => {
          console.error('Error loading folder leads:', err);
        },
      });
  }

  toggleFunnelGroup(folderId: string, groupId: string): void {
    if (!this.expandedFunnelGroups.has(folderId)) {
      this.expandedFunnelGroups.set(folderId, new Set());
    }
    const groups = this.expandedFunnelGroups.get(folderId)!;
    if (groups.has(groupId)) {
      groups.delete(groupId);
    } else {
      groups.add(groupId);
    }
  }

  isFunnelGroupExpanded(folderId: string, groupId: string): boolean {
    return this.expandedFunnelGroups.get(folderId)?.has(groupId) || false;
  }

  private openFunnelGroup(funnelId: string): void {
    for (const folder of this.folderLeads) {
      if (!folder.id) continue;

      for (const group of folder.funnelGroups || []) {
        if (!group.id) continue;

        const hasFunnel = group.funnels?.some((f: any) => f.id === funnelId);
        if (hasFunnel) {
          if (!this.expandedFunnelGroups.has(folder.id)) {
            this.expandedFunnelGroups.set(folder.id, new Set());
          }
          this.expandedFunnelGroups.get(folder.id)!.add(group.id);
          return;
        }
      }
    }
  }

  selectFunnel(funnelId: string): void {
    this.currentFunnelId$.next(funnelId);
  }

  handleDeleteFolder(folderId: string): void {
    const title = 'Xóa Folder';
    const description = `Bạn có chắc chắn muốn xóa Folder này không? Hành động này không thể hoàn tác. 
Tất cả các Phễu và dữ liệu liên quan trong Folder này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteFolder(folderId);
    });
  }

  private deleteFolder(folderId: string): void {
    this.autoTaskService.leadFolder.delete(folderId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Folder thành công');
          this.getFolderLead();

          if (this.currentFunnelId$.value) {
            this.currentFunnelId$.next(null);
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Folder thất bại');
      },
    });
  }

  onLeadDragMoved(event: CdkDragMove) {
    if (!this.kanbanBoard) return;

    const container = this.kanbanBoard.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const pointerX = event.pointerPosition.x;

    // Dừng scroll trước khi kiểm tra
    this.stopAutoScroll();

    // Scroll sang trái khi kéo gần biên trái
    if (pointerX - containerRect.left < this.EDGE_THRESHOLD) {
      this.startAutoScroll('left');
    }
    // Scroll sang phải khi kéo gần biên phải
    else if (containerRect.right - pointerX < this.EDGE_THRESHOLD) {
      this.startAutoScroll('right');
    }
  }

  private startAutoScroll(direction: 'left' | 'right') {
    if (!this.kanbanBoard || this.autoScrollInterval) return;

    this.autoScrollInterval = setInterval(() => {
      const container = this.kanbanBoard!.nativeElement;
      const scrollAmount =
        direction === 'left' ? -this.SCROLL_SPEED : this.SCROLL_SPEED;
      container.scrollLeft += scrollAmount;

      // Dừng khi đã đến cuối
      if (
        (direction === 'left' && container.scrollLeft <= 0) ||
        (direction === 'right' &&
          container.scrollLeft >= container.scrollWidth - container.clientWidth)
      ) {
        this.stopAutoScroll();
      }
    }, 16); // ~60fps
  }

  private stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  onLeadDrop(event: CdkDragDrop<ILead[]>) {
    this.stopAutoScroll();

    const previousStatusId = event.previousContainer.id;
    const currentStatusId = event.container.id;
    const lead = event.item.data;

    // Nếu drop vào cùng một cột, chỉ sắp xếp lại thứ tự
    if (event.previousContainer === event.container) {
      const leads = this.leadsByStatus.get(currentStatusId) || [];
      moveItemInArray(leads, event.previousIndex, event.currentIndex);
      return;
    }

    // Nếu drop vào cột khác, chuyển lead sang status mới
    const previousLeads = this.leadsByStatus.get(previousStatusId) || [];
    const currentLeads = this.leadsByStatus.get(currentStatusId) || [];

    transferArrayItem(
      previousLeads,
      currentLeads,
      event.previousIndex,
      event.currentIndex,
    );

    // Cập nhật statusId của lead và gọi API
    const newStatusId = currentStatusId;
    this.autoTaskService.lead
      .update(lead.id, {id: lead.id, statusId: newStatusId})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            // Cập nhật statusId trong lead object
            lead.statusId = newStatusId;
          } else {
            // Rollback nếu API thất bại
            transferArrayItem(
              currentLeads,
              previousLeads,
              event.currentIndex,
              event.previousIndex,
            );
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          // Rollback nếu API thất bại
          transferArrayItem(
            currentLeads,
            previousLeads,
            event.currentIndex,
            event.previousIndex,
          );
          console.error('Update lead status error:', err);
        },
      });
  }
}
