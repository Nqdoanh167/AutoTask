import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute, Router} from '@angular/router';
import {LeadDashboardData} from './lead-dashboard.definition';
import {ILead, IFunnel} from '@app/types/lead';
import {takeUntil, BehaviorSubject} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {LeadFormModalComponent} from './lead-form-modal/lead-form-modal.component';
import {LeadCreateBulkComponent} from './lead-create-bulk/lead-create-bulk.component';
import {BizRole, User} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';
import {LeadKanbanViewComponent} from './lead-kanban-view/lead-kanban-view.component';
import {LeadListViewComponent} from './lead-list-view/lead-list-view.component';

@Component({
  selector: 'app-lead-dashboard',
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.scss'],
})
export class LeadDashboardComponent
  extends LeadDashboardData
  implements OnInit, OnDestroy
{
  @ViewChild(LeadKanbanViewComponent) kanbanView!: LeadKanbanViewComponent;
  @ViewChild(LeadListViewComponent) listView!: LeadListViewComponent;

  public viewMode: 'kanban' | 'list' = 'kanban';
  public isOpenBackDrop: boolean = false;
  public currentFunnel$ = new BehaviorSubject<IFunnel | null>(null);
  public setting!: ISetting;
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

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    override readonly cdr: ChangeDetectorRef,
    override readonly authService: AuthService,
    private readonly router: Router,
  ) {
    super();
    this.getStatuses();
    this.getTags();
    this.getStatusGroups();
    this.getSource();
    this.getFolders();
    this.setupCheckbox();
  }

  override ngOnInit(): void {
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

  override handleAction(name: string) {
    if (name === 'reload') {
      if (this.viewMode === 'kanban') {
        this.kanbanView.getCountData();
      } else {
        this.listView.getDataSource(true);
      }
    }
    if (name === 'add_new') {
      this.openLeadModal();
    }
    if (name === 'create-bulk') {
      this.openLeadCreateBulk();
    }
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

  public updateBranchDisplayText(detectFilter: any) {
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

  changeSort(field: string) {
    if (this.sort[field] === 0) {
      this.sort[field] = -1;
    } else if (this.sort[field] === -1) {
      this.sort[field] = 1;
    } else {
      this.sort[field] = 0;
    }
    this.handleAction('reload');
  }

  override onSearch(value: {term: string; name: string}) {
    const {term} = value;
    this.item.paramsQuery.q = term;
    this.handleAction('reload');
  }

  handleFilterChange(filters: any) {
    const filterObj = JSON.parse(this.item.paramsQuery.filter || '{}');
    Object.assign(filterObj, filters);
    this.item.paramsQuery.filter = JSON.stringify(filterObj);
    this.handleAction('reload');
  }
}
