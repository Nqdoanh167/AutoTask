import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BizService } from './biz.service';
import {
  Biz,
  BizModule,
  Branch,
  EModule,
  ERole,
  User,
} from 'src/app/types/viewmodels';
import { environment } from 'src/environments/environment';
import {
  EPerActFlow,
  EPerActSetting,
  EPerActTask,
  EPerActType,
  UserPerAccess,
} from '@app/types/setting';
import {
  listConfigNavItems,
  listDashboardNavItems,
  listSettingNavItems,
} from '@app/variable';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User>(
    null as unknown as User,
  );
  public currentUser = this.currentUserSubject
    .asObservable()
    .pipe(distinctUntilChanged());
  private currentBizSubject = new BehaviorSubject<Biz>(null as unknown as Biz);
  public currentBiz = this.currentBizSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private userAccessPerSubject = new BehaviorSubject<UserPerAccess | null>(
    null,
  );
  public userAccessPer$ = this.userAccessPerSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public user!: User;
  public biz!: Biz;
  public branches = new BehaviorSubject<Branch[]>([]);
  public modules = new BehaviorSubject<BizModule[]>([]);
  public isLoggedIn = this.isLoggedInSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  public refToken: string | null = null;
  public auth = {};

  constructor(
    private bizService: BizService,
    protected httpClient: HttpClient,
  ) { }

  getCurrentBiz() {
    return this.currentBizSubject.getValue();
  }

  getCurrentUser() {
    return this.currentUserSubject.getValue();
  }

  popular() {
    let alias = 'test';

    const parsedURL = new URL(location.href);
    if (!environment.production && !this.isAuthenticated) {
      this.loginInDev();
    }
    if (environment.production) {
      alias = parsedURL.pathname.substring(1).replace(/\/.*/, '');
    }

    if (this.getToken() && alias) {
      console.log('get auto task');
      this.bizService.biz.get(alias).subscribe({
        next: (res) => {
          if (res.data?.id) {
            this.currentUserSubject.next(res.viewer!);
            this.currentBizSubject.next(res.data);
            this.branches.next(res.data.branches);
            this.modules.next(res.data.modules);
            this.user = res.viewer!;
            this.biz = res.data;
            this.refToken = res.refToken || null;
            this.isLoggedInSubject.next(true);
          } else {
            window.location.href = parsedURL.origin;
          }
        },
        error: () => {
          if (environment.production) {
            window.location.href = '/';
          } else {
            this.loginInDev();
          }
        },
      });
    } else {
      if (environment.production) {
        window.location.href = '/';
      } else {
        this.loginInDev();
      }
    }
  }

  checkPermittedModule(moduleAlias: string) {
    return this.getPermittedModules().includes(moduleAlias);
  }

  getPermittedModules() {
    return this.currentBizSubject.getValue()?.user?.moduleAliases || [];
  }

  getAccessibleSite() {
    let accessibleSites: Record<EModule, string[]> = {
      [EModule.DASHBOARD]: [],
      [EModule.CONFIG]: [],
      [EModule.SETTING]: [],
    };
    const accessibleModules = this.getAccessibleModules();
    const userPer = this.userAccessPerSubject.getValue();
    accessibleModules.forEach((module) => {
      let key: EPerActType;
      let listNavItems: any[] = [];
      switch (module) {
        // case EModule.DASHBOARD:
        //   key = EPerActType.TASK;
        //   listNavItems = listDashboardNavItems;
        //   break;
        case EModule.CONFIG:
          key = EPerActType.FLOW;
          listNavItems = listConfigNavItems;
          break;
        case EModule.SETTING:
          key = EPerActType.SETTING;
          listNavItems = listSettingNavItems;
          break;
      }
      const sites = listNavItems
        ?.filter((item) => {
          return !!item?.permissions?.some((per: any) => {
            return (userPer?.[key] as any)?.includes(per);
          });
        })
        ?.map((item) => item.alias!);
      accessibleSites[module] = [...sites];
    });
    // if all key of accessibleSites is empty, return empty object
    if (!Object.values(accessibleSites).some((sites) => sites.length > 0)) {
      window.location.href = '/';
    }
    return accessibleSites;
  }

  getAccessibleModules() {
    let accessibleModules: EModule[] = [];
    const modules = [EModule.SETTING, EModule.CONFIG, EModule.DASHBOARD];
    modules.forEach((module) => {
      if (this.checkUserAccessModule(module)) {
        accessibleModules.push(module);
      }
    });
    if (accessibleModules.length === 0) {
      window.location.href = '/';
    }
    return accessibleModules;
  }

  isPerBranch(id: string | null, per?: string) {
    const hasItem = this.biz.user.flatBranches?.find(b => b.id === id);
    if (hasItem && ['LEADER', 'OWNER'].includes(hasItem.role!)) return true;
    const userAccessPer = this.userAccessPerSubject.getValue();
    return per && userAccessPer?.roleBranch && userAccessPer?.roleBranch[id!] && userAccessPer?.roleBranch[id!].includes(per);
  }

  hasPerRole(branch: string | null, per?: string) {
    if (this.isOwner()) return true;
    return this.isPerBranch(branch, per);
  }
  getBranchPer(pers: string[] = [], option = { isFullBranch: false }) {
    console.log('biz', this.biz);
    console.log('value', this.userAccessPerSubject.getValue());
    let branches: Branch[] = [];

    if (this.isOwner() || option.isFullBranch) {
      branches = this.biz.branches.filter(b => b.isActive && (this.biz.user.branchIds?.includes(b.id) || option.isFullBranch));
      branches = branches.map(branch => {
        branch.role = ERole.OWNER;
        branch.children = branch.departments.map(department => {
          if (department.teams?.length) {
            department.children = department.teams;
            department.role = ERole.OWNER
          }
          return department;
        })
        return branch;
      })
    } else {
      const userAccessPer = this.userAccessPerSubject.getValue();
      if (userAccessPer) {
        this.biz.user.roleBranches?.forEach(branch => {
          const obj: Branch = {
            ...branch,
            departments: [],
            children: []
          }

          let hasPer = !!userAccessPer.roleBranch?.[branch.id!];
          // OWNER và có quyền biz thì toàn bộ các quyền nhỏ hơn sẽ đc gán là OWNER
          if (branch.role === ERole.OWNER && hasPer) {
            obj.departments = branch.departments?.map(de => ({
              ...de,
              role: branch.role,
              teams: de.teams?.map(t => ({
                ...t,
                role: branch.role,
              })),
              children: de.teams?.map(t => ({
                ...t,
                role: branch.role,
              }))
            }));
            obj.children = obj.departments;
          }
          else if (branch.departments?.length) {
            obj.departments = branch.departments?.filter(department => {
              hasPer = !!userAccessPer.roleBranch?.[department.id!];
              if (department.role === 'OWNER' && hasPer) {
                department.teams = department.teams.map(t => ({
                  ...t,
                  role: department.role,
                }))
                department.children = department.teams;
                return true;

              } else if (department.teams?.length) {
                department.teams = department.teams.filter(team => {
                  hasPer = !!userAccessPer.roleBranch?.[team.id!]
                  return hasPer;
                })
                department.children = department.teams;
                if (department.teams.length) return true;

              } else if (hasPer) return true;
              return false
            })
            obj.children = obj.departments;
          }

          if (hasPer) {
            branches.push(obj);
          }
        })
      }
    }
    return branches;
  }

  /**
   * Từ danh sách id (branchId,departmentId,teamId) => Bóc tách ra vị trí cuối cùng có quyền của user
   * @param bids 
   * @returns {
   *    ids: [...branchIds, ...departmentIds, ...teamIds]
   *    nestedIds: ID vị trí kèm các vị trí cấp trên, format: [[1,2,3], [1,2],[1]]
   *    rows: Danh sách object vị trí cuối cùng có quyền theo bids
   * }
   */
  detectFilterBranchIds(bids: string[]) {
    const branchIds: string[] = [];
    const departmentIds: string[] = [];
    const teamIds: string[] = [];
    const nestedIds: any = [];       // [[1,2,3], [1,2],[1]]
    const nestedNames: any = [];       // [[1,2,3], [1,2],[1]]
    const rows: any[] = [];          // d/sách object vị trí cuối cùng có quyền theo bids
    // loop all bộ phận trong biz => Chọn lọc id ở vị trí cuối cùng hoặc cuối cùng theo OWNER thì push vào vị trí tương ướng để search.
    this.biz.user.roleBranches?.forEach(roleB => {
      let isMatchPosition = false;
      roleB.departments.forEach(department => {
        const teams = department.teams.filter(t => bids.includes(t.id!));
        if (teams.length) {
          teams.forEach(team => {
            teamIds.push(team.id!);
            nestedIds.push([roleB.id, department.id, team.id]);
            nestedNames.push([roleB.name, department.name, team.name]);
            rows.push({ ...team, level: 'team', branchId: roleB.id, departmentId: department.id });
          });

          isMatchPosition = true;
        } else if ((!department.teams.length || department.role === 'OWNER') && bids.includes(department.id!)) {

          departmentIds.push(department.id!);
          nestedIds.push([roleB.id, department.id])
          nestedNames.push([roleB.name, department.name]);
          department.level = 'department';
          department.branchId = roleB.id;
          rows.push(department);
          isMatchPosition = true;
        }
      })
      if (!isMatchPosition && (!roleB.departments.length || roleB.role === 'OWNER') && bids.includes(roleB.id)) {
        branchIds.push(roleB.id);
        nestedIds.push([roleB.id])
        nestedNames.push([roleB.name])
        roleB.level = 'branch';
        rows.push(roleB);
      }
    })
    // console.log('bids', bids);
    // console.log({
    //   ids: [
    //     ...branchIds,
    //     ...departmentIds,
    //     ...teamIds,
    //   ],
    //   nestedIds,
    //   rows
    // });
    return {
      branchIds,
      departmentIds,
      teamIds,
      ids: [
        ...branchIds,
        ...departmentIds,
        ...teamIds,
      ],
      nestedIds,
      nestedNames,
      rows
    }
  }
  checkUserAccessModule(module: EModule): boolean {
    const userPer = this.userAccessPerSubject.getValue();
    // console.log('userPer', userPer);
    if (!userPer) return false;
    switch (module) {
      case EModule.DASHBOARD:
        return userPer[EPerActType.TASK].includes(EPerActTask.VIEW_TASK);
      case EModule.CONFIG:
        return userPer[EPerActType.FLOW].includes(EPerActFlow.VIEW_FLOW);
      case EModule.SETTING:
        return userPer[EPerActType.SETTING].includes(
          EPerActSetting.VIEW_MASTER_DATA,
        );
      default:
        return false;
    }
  }

  checkUserPer(
    type: EPerActType,
    roles: (EPerActTask | EPerActFlow | EPerActSetting)[],
  ): boolean {
    const userPer = this.userAccessPerSubject.getValue();
    if (!userPer) return false;
    return userPer[type]?.some((per) => roles.includes(per));
  }

  getUserPerByType(type: EPerActType) {
    const userPer = this.userAccessPerSubject.getValue();
    return userPer?.[type] || [];
  }

  // Get all user in the same branch with current user
  getColleague() {
    const users = this.currentBizSubject.getValue()?.users;
    const currentUser = this.currentBizSubject.getValue()?.user;
    const postLastBranches = currentUser?.posLastBranches;
    if (currentUser?.role == ERole.OWNER) {
      return users;
    }
    const colleagueIds = postLastBranches?.reduce((acc: string[], branch) => {
      return [...acc, ...(branch.userIds || [])];
    }, []);
    return users?.filter((user) => colleagueIds.includes(user.id));
  }

  // get user's permission in branch/department/team
  getInfoInUnit(id?: string | null) {
    if (!id) return;
    const currentBiz = this.currentBizSubject.getValue();
    const flatBranches = currentBiz.user?.flatBranches;
    return flatBranches?.find((unit) => unit.id === id);
  }

  isOwner(): boolean {
    return this.currentBizSubject?.value?.user.role == ERole.OWNER || this.user?.role === ERole.ADMIN;
  }

  getToken(name = 'smaxapp_token'): string {
    const token = localStorage.getItem(name);
    return token || '';
  }

  setToken(token: string, name = 'smaxapp_token') {
    localStorage.setItem(name, token);
  }

  setUser(user: User) {
    this.currentUserSubject.next(user);
  }

  getUserAccessPerSubject() {
    return this.userAccessPerSubject.getValue();
  }

  setUserAccessPerSubject(userPer: UserPerAccess) {
    this.userAccessPerSubject.next(userPer);
  }

  logout() {
    localStorage.removeItem('smaxapp_token');
    window.location.href = '/';
    this.isLoggedInSubject.next(false);
  }

  loginInDev() {
    const token = localStorage.getItem('smaxapp_token');
    if (token) {
      this.setToken(token);
      this.isLoggedInSubject.next(true);
      window.location.reload();
      return;
    }
    const headers = new HttpHeaders().set(
      'Authorization',
      'Basic ZHVvbmdsb25nLmRldkBnbWFpbC5jb206MTIzMTIz',
    );
    const res = this.httpClient.post(
      'https://dev.smax.app/api/auth',
      {},
      { headers },
    );
    res.pipe().subscribe({
      next: (res: any) => {
        if (res.data['access_token']) {
          this.setToken(res.data['access_token']);
          this.isLoggedInSubject.next(true);
          window.location.reload();
        }
      },
    });
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }
}
