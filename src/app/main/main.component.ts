import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map, takeUntil} from 'rxjs';
import {Subject} from 'rxjs';
import {ISidebar, EModule} from '../types/viewmodels';
import {MainService} from '@app/services/api/main.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {ECallType} from '@app/types/call';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {BizRole, User} from '@app/types/viewmodels';
import {ISetting} from '@app/types/setting';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent extends BaseComponentsComponent implements OnInit, OnDestroy {
  public isHiddenSidebar = false;
  public listNavItems: ISidebar[] = [];
  public isLeadModule = false;
  public isLeadDashboard = false;
  
  // Lead filters state
  public leadCheckbox: any = {
    branchIds: [],
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
    branchDisplayInputText: '',
  };
  public leadSetting!: ISetting;
  
  protected override destroy$ = new Subject<void>();
  private leadDashboardComponent: any = null;

  constructor(
    private router: Router,
    private title: Title,
    private readonly mainService: MainService,
    private readonly autoTaskService: AutoTaskService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    super();
    this.title.setTitle(`App.vn | ${this.currentBiz?.name} | Auto Task`);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          this.isHiddenSidebar =
            route.snapshot.data['isHiddenSidebar'] || false;
          return routeTitle;
        }),
      )
      .subscribe((title: string) => {
        if (title) {
          this.title.setTitle(
            `App.vn | ${this.currentBiz?.name || ''} | ${title}`,
          );
        }
      });
  }

  ngOnInit(): void {
    this.mainService.headerTab$.pipe().subscribe((res) => {
      if (res) {
        this.listNavItems = res;
      }
    });

    // Subscribe to lead dashboard component registration
    this.mainService.leadDashboardComponent$
      .pipe(takeUntil(this.destroy$))
      .subscribe((component) => {
        if (component) {
          this.leadDashboardComponent = component;
          // Sync initial state from component
          if (component.checkbox) {
            this.leadCheckbox.branchIds = component.checkbox.branchIds || [];
            this.leadCheckbox.roleIds = component.checkbox.roleIds || [];
            this.leadCheckbox.userIds = component.checkbox.userIds || [];
            this.leadCheckbox.branchDisplayInputText = component.checkbox.branchDisplayInputText || '';
            this.leadCheckbox.listBranches = component.checkbox.listBranches || [];
            this.leadCheckbox.listRoles = component.checkbox.listRoles || [];
            this.leadCheckbox.listUsers = component.checkbox.listUsers || [];
            // Trigger change detection to prevent ExpressionChangedAfterItHasBeenCheckedError
            this.cdr.detectChanges();
          }
        }
      });

    // Detect current module
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.router.url),
        takeUntil(this.destroy$),
      )
      .subscribe((url) => {
        this.isLeadModule = url.includes(`/${EModule.LEAD}`);
        this.isLeadDashboard = url.includes(`/${EModule.LEAD}/dashboard`);
        if (this.isLeadModule) {
          this.setupLeadFilters();
          // Re-register component if needed
          const component = this.mainService.getLeadDashboardComponent();
          if (component) {
            this.leadDashboardComponent = component;
          }
        }
      });

    // Initial check
    this.isLeadModule = this.router.url.includes(`/${EModule.LEAD}`);
    this.isLeadDashboard = this.router.url.includes(`/${EModule.LEAD}/dashboard`);
    if (this.isLeadModule) {
      this.setupLeadFilters();
      const component = this.mainService.getLeadDashboardComponent();
      if (component) {
        this.leadDashboardComponent = component;
      }
    }

    // Subscribe to setting changes
    this.autoTaskService.currentSetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((setting) => {
        this.leadSetting = setting || {};
        if (this.isLeadModule) {
          this.setupLeadFilters();
        }
      });

    // Subscribe to biz changes
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        if (biz && this.isLeadModule) {
          this.setupLeadFilters();
        }
      });
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupLeadFilters() {
    if (this.currentBiz) {
      this.leadCheckbox.listRoles =
        this.currentBiz.user.roles?.filter(
          (r: BizRole) => this.leadSetting?.roles?.includes(r.id) && r.isActive,
        ) || [];
      this.leadCheckbox.listUsers =
        this.currentBiz.users?.filter((u: User) => u.isActive) || [];
      this.leadCheckbox.listBranches = this.authService.getBranchPer();
      
      // Setup branch structure with children
      this.leadCheckbox.listBranches = this.leadCheckbox.listBranches.map((branch: any) => {
        if (branch.departments?.length) {
          branch.children = branch.departments.map((department: any) => {
            if (department.teams?.length) {
              department.children = department.teams;
            }
            return department;
          });
        }
        return branch;
      });
    }
  }

  onLeadBranchChange(branchIds: string[]) {
    this.leadCheckbox.branchIds = branchIds;
    
    if (branchIds.length) {
      const detectFilter = this.authService.detectFilterBranchIds(branchIds);
      this.updateBranchDisplayText(detectFilter);
      this.leadCheckbox.accessibleIds = [
        ...(detectFilter.branchIds || []),
        ...(detectFilter.departmentIds || []),
        ...(detectFilter.teamIds || [])
      ];
    } else {
      this.leadCheckbox.branchDisplayInputText = '';
      this.leadCheckbox.accessibleIds = [];
    }

    // Notify lead dashboard component if available
    if (this.leadDashboardComponent) {
      this.leadDashboardComponent.changeBranch({branchIds});
    }
  }

  onLeadRoleChange(roleIds: string[] | any) {
    // Ensure roleIds is a valid array
    let validRoleIds: string[] = [];
    if (Array.isArray(roleIds)) {
      validRoleIds = roleIds.filter(id => id != null && id !== '');
    } else if (roleIds != null && roleIds !== '') {
      validRoleIds = [roleIds];
    }
    
    this.leadCheckbox.roleIds = validRoleIds;
    
    // Notify lead dashboard component if available
    if (this.leadDashboardComponent) {
      this.leadDashboardComponent.changeRole(validRoleIds);
    }
  }

  onLeadUserChange(userIds: string[] | any) {
    let validUserIds: string[] = [];
    if (Array.isArray(userIds)) {
      validUserIds = userIds.filter((id) => id != null && id !== '');
    } else if (userIds != null && userIds !== '') {
      validUserIds = [userIds];
    }

    this.leadCheckbox.userIds = validUserIds;

    if (this.leadDashboardComponent) {
      this.leadDashboardComponent.changeMembers(validUserIds);
    }
  }

  private updateBranchDisplayText(detectFilter: any) {
    this.leadCheckbox.branchDisplayInputText = 'Lựa chọn';
    const lengthBranch = detectFilter.branchIds?.length;
    const lengthDepartment = detectFilter.departmentIds?.length;
    const lengthTeam = detectFilter.teamIds?.length;
    if (lengthBranch && lengthDepartment && lengthTeam) {
      this.leadCheckbox.branchDisplayInputText = `${lengthBranch} CN, ${lengthDepartment} PB, ${lengthTeam} ĐN`;
    } else if (
      [lengthBranch, lengthDepartment, lengthTeam].filter((t) => t > 0).length >
      1
    ) {
      const strValue = [];
      if (lengthBranch) strValue.push(`${lengthBranch} CN`);
      if (lengthDepartment) strValue.push(`${lengthDepartment} PB`);
      if (lengthTeam) strValue.push(`${lengthTeam} ĐN`);
      this.leadCheckbox.branchDisplayInputText = strValue.join(', ');
    } else {
      this.leadCheckbox.branchDisplayInputText = '';
      if (lengthBranch)
        this.leadCheckbox.branchDisplayInputText += `${lengthBranch} chi nhánh`;
      if (lengthDepartment)
        this.leadCheckbox.branchDisplayInputText += `${lengthDepartment} phòng ban`;
      if (lengthTeam)
        this.leadCheckbox.branchDisplayInputText += `${lengthTeam} đội nhóm`;
    }
  }

  // Method to register lead dashboard component
  registerLeadDashboard(component: any) {
    this.leadDashboardComponent = component;
    // Sync initial state
    if (component && component.checkbox) {
      this.leadCheckbox.branchIds = component.checkbox.branchIds || [];
      this.leadCheckbox.roleIds = component.checkbox.roleIds || [];
      this.leadCheckbox.userIds = component.checkbox.userIds || [];
      this.leadCheckbox.branchDisplayInputText = component.checkbox.branchDisplayInputText || '';
      this.leadCheckbox.listUsers = component.checkbox.listUsers || this.leadCheckbox.listUsers;
      // Trigger change detection to prevent ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
    }
  }

  protected readonly ECallType = ECallType;
}
