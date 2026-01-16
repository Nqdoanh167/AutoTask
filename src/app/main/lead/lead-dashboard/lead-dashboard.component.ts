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
import {ILead, ILeadStatus, IFunnel} from '@app/types/lead';
import {User, BizRole, ITag} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {
  takeUntil,
  finalize,
  shareReplay,
  BehaviorSubject,
  distinctUntilChanged,
  forkJoin,
} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';
import {LeadCreateBulkComponent} from './lead-create-bulk/lead-create-bulk.component';

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
  public isGroupFolderExpanded: boolean = false;
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

  public loading = {
    kanban: false,
  };
  public kanbanDatas: {
    statusId: string;
    items: ILead[];
    total: number;
    after?: string;
    loadingMore?: boolean;
  }[] = [];

  public kanbanFilters$ = new BehaviorSubject<
    {
      statusId: string;
      after?: string;
    }[]
  >([]);

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly router: Router,
  ) {
    super();
  }

  override ngOnInit(): void {
    this.setupCheckbox();
    this.getStatuses();
    this.getStatusGroups();
    this.getTags();

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

            this.kanbanFilters$.next(
              statusGroup.leadStatusIds.map((statusId) => ({
                statusId: statusId,
                after: '',
              })),
            );
          }

          this.handleAction('reload');
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
      if (this.viewMode === 'kanban') {
        this.getKanbanData();
      } else {
        this.getDataSource(true);
      }
    }
    if (name === 'add_new') {
      this.openLeadModal();
    }
    if (name === 'create-bulk') {
      this.openLeadCreateBulk();
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

  onFunnelSelected(funnel: IFunnel | null) {
    if (funnel) {
      this.currentFunnel$.next(funnel);
    }
  }

  onFolderReloaded() {
    // Handle folder reloaded event if needed
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
                this.handleAction('reload');
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
      const modalRef = this.modalService.show(LeadFormModalComponent, {
        class: 'modal-dialog-centered modal-medium',
        initialState: {
          currentFunnelId: this.currentFunnel$.value?.id,
        } as any,
      });

      modalRef.content?.saveEvent?.subscribe((lead: ILead) => {
        this.handleAction('reload');
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

  getKanbanDataByStatusId(statusId?: string) {
    return this.kanbanDatas.find((data) => data.statusId === statusId);
  }

  /**
   * Áp dụng các filter chung cho filterObj (funnelId, accessibleIds, roleIds)
   */
  private applyCommonFilters(filterObj: any): void {
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
    this.applyCommonFilters(filterObj);
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

  getKanbanData() {
    this.loading.kanban = true;
    this.kanbanDatas = [];

    let params = {
      ...this.item.paramsQuery,
    };
    delete params.page;
    const filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);

    filterObj.items = [];
    this.kanbanFilters$.value.forEach((filter) => {
      filterObj.items.push({
        statusId: filter.statusId,
        after: filter.after || undefined,
      });
    });
    params.filter = JSON.stringify(filterObj);

    forkJoin({
      resCount: this.leadService.lead.getCount(params),
      resKanban: this.leadService.lead.getKanban(params),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.kanban = false;
        }),
      )
      .subscribe({
        next: ({resCount, resKanban}) => {
          if (resCount.status === 200) {
            (resCount.data || []).forEach((item: any) => {
              this.kanbanDatas.push({
                statusId: item.statusId,
                items: item.items || [],
                after: item.after,
                total: item.total || item.count || 0,
              });
            });
          }

          if (resKanban.status === 200) {
            (resKanban.data || []).forEach((item: any) => {
              const itemData = this.kanbanDatas.find(
                (data) => data.statusId === item.statusId,
              );
              if (itemData) {
                itemData.items = [...item.items];
                itemData.after = item.after;
              } else {
                this.kanbanDatas.push({
                  statusId: item.statusId,
                  items: [...item.items],
                  after: item.after,
                  total: item.items?.length || 0,
                });
              }
            });
          }
        },
        error: (err: any) => {
          console.error('Error in forkJoin:', err);
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
    const previousData = this.kanbanDatas.find(
      (data) => data.statusId === previousStatusId,
    );
    const currentData = this.kanbanDatas.find(
      (data) => data.statusId === currentStatusId,
    );

    if (event.previousContainer === event.container) {
      const leads = currentData?.items || [];
      moveItemInArray(leads, event.previousIndex, event.currentIndex);
      return;
    }

    const previousLeads = previousData?.items || [];
    const currentLeads = currentData?.items || [];

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

  onKanbanColumnScroll(event: Event, statusId: string) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const kanbanData = this.getKanbanDataByStatusId(statusId);
    if (!kanbanData) return;
    if (
      scrollHeight - scrollTop - clientHeight < 100 &&
      !kanbanData?.loadingMore
    ) {
      if (kanbanData?.after && kanbanData.items.length < kanbanData.total) {
        this.loadMoreKanbanData(statusId);
      } else {
        kanbanData.loadingMore = false;
      }
    }
  }

  loadMoreKanbanData(statusId: string) {
    const kanbanData = this.getKanbanDataByStatusId(statusId);
    if (!kanbanData?.after || kanbanData?.loadingMore) {
      return;
    }

    kanbanData.loadingMore = true;

    let params = {
      ...this.item.paramsQuery,
    };
    delete params.page;
    const filterObj = JSON.parse(params.filter || '{}');
    this.applyCommonFilters(filterObj);

    filterObj.items = [
      {
        statusId: statusId,
        after: kanbanData.after,
      },
    ];
    params.filter = JSON.stringify(filterObj);

    this.leadService.lead
      .getKanban(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          kanbanData.loadingMore = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            const responseData = (res.data || []).find(
              (item: any) => item.statusId === statusId,
            );
            if (responseData && kanbanData) {
              kanbanData.items = [...kanbanData.items, ...responseData.items];
              kanbanData.after = responseData.after;

              const filters = this.kanbanFilters$.value.map((filter) =>
                filter.statusId === statusId
                  ? {...filter, after: responseData.after}
                  : filter,
              );
              this.kanbanFilters$.next(filters);
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err: any) => {
          console.error('Error loading more leads:', err);
          this.commonService.handleResErr(err);
        },
      });
  }

  openLeadCreateBulk() {
    const modalRef = this.modalService.show(LeadCreateBulkComponent, {
      class: 'modal-dialog-centered modal-xl',
      initialState: {
        funnelId: this.currentFunnel$.value?.id,
      },
    });

    modalRef.content?.success?.subscribe(() => {
      this.handleAction('reload');
    });
  }

  override pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.item.paramsQuery = {
        ...this.item.paramsQuery,
        page: page,
        limit: Number(limit),
      };
    }
    delete this.item.paramsQuery.after;
    this.getDataSource();
  }
}
