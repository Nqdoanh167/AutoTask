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
import {ActivatedRoute, Router} from '@angular/router';
import {LeadDashboardData} from './lead-dashboard-data';
import {
  ILead,
  ILeadStatus,
  IFunnel,
  IFolderLead,
  IFunnelGroup,
} from '@app/types/lead';
import {User, BizRole, EntityPagination, ITag} from '@app/types/viewmodels';
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
import {FolderFormModalComponent} from './folder-form-modal/folder-form-modal.component';
import {AuthService} from '@app/services/api/auth.service';
import {EBotherAdvanceBasicFilter} from '@app/types/common';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {LeadCreateModalComponent} from './lead-create-modal/lead-create-modal.component';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';

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
  public isGroupFolderExpanded: boolean = false;
  public expandedFunnelGroups: Map<string, Set<string>> = new Map();
  public folderLeads: EntityPagination<IFolderLead> = {
    rows: [],
    limit: 1000,
    page: 1,
    total: 0,
    loading: false,
  };
  private _folderLeads: IFolderLead[] = [];
  public currentFunnel$ = new BehaviorSubject<IFunnel | null>(null);

  private autoScrollInterval: any;
  private readonly SCROLL_SPEED = 15;
  private readonly EDGE_THRESHOLD = 100;
  public isOpenBackDrop: boolean = false;

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
  public statusesDisplay: ILeadStatus[] = [];

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly modalConfirmService: ModalConfirmService,
    private readonly router: Router,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.setupCheckbox();
    this.getFolderLead();
    this.getStatuses();
    this.getStatusGroups();
    this.getTags();

    // Subscribe vào currentFolderId$ để tự động getDataSource khi thay đổi
    this.currentFunnel$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((funnel) => {
        if (funnel) {
          this.getDataSource(true);
          this.openFunnelGroup(funnel.id!);
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
      if (this.currentFunnel$.value) {
        this.getDataSource(true);
      }
    }
    if (name === 'add_new') {
      this.openLeadModal();
    }
  }

  override getStatusGroups() {
    this.statusGroups.loading = true;
    this.leadService.leadStatusGroup
      .get({
        limit: this.statusGroups.limit,
        page: this.statusGroups.page,
      })
      .pipe(
        finalize(() => (this.statusGroups.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.statusGroups.rows = res.data || [];
        this.leadService.setListLeadStatusGroup(this.statusGroups.rows);
        this.currentFunnel$
          .pipe(takeUntil(this.destroy$), distinctUntilChanged())
          .subscribe((funnel) => {
            if (funnel) {
              const statusGroup = this.statusGroups.rows.find(
                (group) => group.id === funnel?.statusGroupId,
              );

              if (statusGroup) {
                this.statusesDisplay = statusGroup.leadStatusIds
                  .map((statusId) =>
                    this.statuses.rows.find((status) => status.id === statusId),
                  )
                  .filter(Boolean) as ILeadStatus[];
              }
            }
          });
      });
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

  handleEditFolder(
    folder: IFolderLead | IFunnelGroup | IFunnel,
    type: 'folder' | 'group' | 'funnel' = 'folder',
  ) {
    const modalRef = this.modalService.show(FolderFormModalComponent, {
      class: 'modal-dialog-centered modal-md',
      initialState: {
        type,
        dataSource: folder,
      },
    });

    modalRef.content?.saveEvent?.subscribe(() => {
      this.getFolderLead();
    });
  }

  handleClearQueryParams() {
    this.router.navigate([], {
      queryParams: {
        id: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  openLeadModal(leadId?: string) {
    this.isOpenBackDrop = true;
    if (leadId) {
      this.leadService.lead
        .getById(leadId, {populate: ['taskIds']})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200) {
              const modalRef = this.modalService.show(LeadFormModalComponent, {
                class: 'modal-dialog-centered modal-medium',
                initialState: {
                  lead: res.data,
                } as any,
              });

              modalRef.content?.saveEvent?.subscribe((lead: ILead) => {
                this.getDataSource(true);
              });

              modalRef?.onHidden?.subscribe(() => {
                this.handleClearQueryParams();
                this.isOpenBackDrop = false;
              });
            } else {
              this.toastrService.error('Không thể lấy thông tin lead');
            }
          },
          error: (err: any) => {
            this.toastrService.error('Không thể lấy thông tin lead');
          },
        });
    } else {
      const modalRef = this.modalService.show(LeadCreateModalComponent, {
        class: 'modal-dialog-centered',
        initialState: {
          currentFunnelId: this.currentFunnel$.value?.id,
        } as any,
      });

      modalRef.content?.saveEvent?.subscribe((lead: ILead) => {
        this.getDataSource(true);
      });

      modalRef?.onHidden?.subscribe(() => {
        this.handleClearQueryParams();
        this.isOpenBackDrop = false;
      });
    }
  }

  handleDeleteMultiple(leads: ILead[]) {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${leads.length} lead đã chọn?`)) {
      return;
    }

    const ids = leads.map((l) => l.id);
    this.leadService.lead.bulkDelete(ids).subscribe({
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

  getTagById(tagId?: string): ITag | undefined {
    return this.tags.rows.find((tag) => tag.id === tagId);
  }

  getStatusById(statusId?: string): ILeadStatus | undefined {
    return this.statuses.rows.find((status) => status.id === statusId);
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

    const currentFunnelId = this.currentFunnel$.value?.id;
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

    this.leadService.lead
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

    this.configFilters.forEach((item) => {
      if (!Object.keys(filter).includes(item.name!)) {
        delete objFilterQuery[item.name!];
        if (item.name === 'createdAt') {
          delete objFilterQuery.createdAt_gte;
          delete objFilterQuery.createdAt_lte;
        }
      } else if (item.name === 'createdAt') {
        objFilterQuery.createdAt_gte = filter.createdAt[0];
        objFilterQuery.createdAt_lte = filter.createdAt[1];
        delete objFilterQuery.createdAt;
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
    this.folderLeads.loading = true;
    this.leadService.leadFolder
      .getWithFunnels({
        page: 1,
        limit: 1000,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.folderLeads.loading = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.folderLeads.rows = res.data;
            this._folderLeads = res.data;
            this.leadService.setListLeadFolder(res.data);

            // Nếu chưa có currentFolderId, lấy funnel đầu tiên
            if (
              !this.currentFunnel$.value &&
              this.folderLeads.rows.length > 0
            ) {
              const firstFunnel = this.folderLeads.rows
                .flatMap((folder) => folder.funnelGroups || [])
                .flatMap((group) => group.funnels || [])
                .find((funnel) => funnel.id);

              if (firstFunnel) {
                this.currentFunnel$.next(firstFunnel);
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
    for (const folder of this.folderLeads.rows) {
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

  selectFunnel(funnel: IFunnel): void {
    this.currentFunnel$.next(funnel);
  }

  handleDeleteFolder(folderId: string): void {
    const title = 'Xóa Folder';
    const description = `Bạn có chắc chắn muốn xóa Folder này không? Hành động này không thể hoàn tác. 
Tất cả các Nhóm Phễu, Phễu và dữ liệu liên quan trong Folder này sẽ bị xóa vĩnh viễn.`;
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

  handleDeleteGroup(groupId: string): void {
    const title = 'Xóa Nhóm Phễu';
    const description = `Bạn có chắc chắn muốn xóa Nhóm Phễu này không? Hành động này không thể hoàn tác. 
Tất cả các Phễu và dữ liệu liên quan trong Nhóm Phễu này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteGroup(groupId);
    });
  }

  handleDeleteFunnel(funnelId: string): void {
    const title = 'Xóa Phễu';
    const description = `Bạn có chắc chắn muốn xóa Phễu này không? Hành động này không thể hoàn tác. 
Tất cả dữ liệu liên quan đến Phễu này sẽ bị xóa vĩnh viễn.`;
    const okText = 'Xóa';

    const modalContent: IModalConfirmContent = {
      title,
      description,
      okText,
      type: 'danger',
      modalType: 'advance',
    };

    this.modalConfirmService.openModal(modalContent, undefined, () => {
      this.deleteFunnel(funnelId);
    });
  }

  private deleteFolder(folderId: string): void {
    this.leadService.leadFolder.delete(folderId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Folder thành công');
          this.getFolderLead();

          if (this.currentFunnel$.value?.id) {
            const folder = this.folderLeads.rows.find((f) => f.id === folderId);
            if (folder) {
              const hasCurrentFunnel = folder.funnelGroups?.some(
                (group) =>
                  group.funnels?.some(
                    (f) => f.id === this.currentFunnel$.value?.id,
                  ),
              );
              if (hasCurrentFunnel) {
                this.currentFunnel$.next(null);
              }
            }
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

  private deleteGroup(groupId: string): void {
    this.leadService.leadGroupFunnel.delete(groupId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Nhóm Phễu thành công');
          this.getFolderLead();

          if (this.currentFunnel$.value?.id) {
            for (const folder of this.folderLeads.rows) {
              const group = folder.funnelGroups?.find((g) => g.id === groupId);
              if (group) {
                const hasCurrentFunnel = group.funnels?.some(
                  (f) => f.id === this.currentFunnel$.value?.id,
                );
                if (hasCurrentFunnel) {
                  this.currentFunnel$.next(null);
                }
                break;
              }
            }
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Nhóm Phễu thất bại');
      },
    });
  }

  private deleteFunnel(funnelId: string): void {
    this.leadService.leadFunnel.delete(funnelId).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.toastrService.success('Xóa Phễu thành công');
          this.getFolderLead();

          if (this.currentFunnel$.value?.id === funnelId) {
            this.currentFunnel$.next(null);
          }
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err: any) => {
        this.toastrService.error('Xóa Phễu thất bại');
      },
    });
  }

  onSearchFolder(term: string) {
    const searchTerm = term?.trim() || '';

    if (!searchTerm) {
      this.folderLeads.rows = [...this._folderLeads];
      return;
    }

    this.folderLeads.rows = this._folderLeads.filter((folder) =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  //kanban board
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

    if (event.previousContainer === event.container) {
      const leads = this.leadsByStatus.get(currentStatusId) || [];
      moveItemInArray(leads, event.previousIndex, event.currentIndex);
      return;
    }

    const previousLeads = this.leadsByStatus.get(previousStatusId) || [];
    const currentLeads = this.leadsByStatus.get(currentStatusId) || [];

    transferArrayItem(
      previousLeads,
      currentLeads,
      event.previousIndex,
      event.currentIndex,
    );

    const newStatusId = currentStatusId;
    this.leadService.lead
      .update(lead.id, {id: lead.id, statusId: newStatusId})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            lead.statusId = newStatusId;
          } else {
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
