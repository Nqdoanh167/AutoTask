import {Injectable, Injector} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {BizService} from './biz.service';
import {
  Biz,
  BizModule,
  EModule,
  ERole,
  IBranch,
  User,
} from 'src/app/types/viewmodels';
import {environment} from 'src/environments/environment';
import {AutoTaskService} from '@app/services/api/autoTask.service';
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
import uniq from 'lodash/uniq';

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
  public branches = new BehaviorSubject<IBranch[]>([]);
  public modules = new BehaviorSubject<BizModule[]>([]);
  public isLoggedIn = this.isLoggedInSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  public refToken: string | null = null;
  public auth = {};

  constructor(
    private bizService: BizService,
    protected httpClient: HttpClient,
    private injector: Injector,
  ) {}

  getCurrentBiz() {
    return this.currentBizSubject.getValue();
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
      this.bizService.biz.get(alias).subscribe({
        next: (res) => {
          if (res.data?.id) {
            this.currentUserSubject.next(res.viewer!);
            this.currentBizSubject.next(res.data);
            this.branches.next(res.data.branches);
            this.modules.next(res.data.modules);
            this.refToken = res.refToken || null;
            this.isLoggedInSubject.next(true);
            this.getUserPerAccess();
          } else {
            window.location.href = parsedURL.origin;
          }
        },
        error: (error) => {
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

  getUserPerAccess() {
    this.userAccessPerSubject.next({
      [EPerActType.TASK]: [
        EPerActTask.VIEW_TASK,
        EPerActTask.VIEW_TASK_BIZ,
        EPerActTask.CREATE_TASK,
        EPerActTask.UPDATE_TASK,
        EPerActTask.DELETE_TASK,
        EPerActTask.VIEW_INFORMATION_TASK,
        EPerActTask.VIEW_HISTORY_TASK,
        EPerActTask.CREATE_ORDER,
        EPerActTask.MANAGE_CHAIN,
        EPerActTask.MANAGE_ACTION,
        EPerActTask.EDIT_TIME_ACTION,
      ],
      [EPerActType.FLOW]: [EPerActFlow.VIEW_FLOW, EPerActFlow.UPDATE_FLOW],
      [EPerActType.SETTING]: [
        EPerActSetting.VIEW_SOURCE_SETTING,
        EPerActSetting.UPDATE_SOURCE_SETTING,
        EPerActSetting.VIEW_TAG_SETTING,
        EPerActSetting.UPDATE_TAG_SETTING,
        EPerActSetting.VIEW_ROLE_SETTING,
        EPerActSetting.UPDATE_ROLE_SETTING,
        EPerActSetting.VIEW_PERMISSION_SETTING_ACCESS,
        EPerActSetting.UPDATE_PERMISSION_SETTING_ACCESS,
        EPerActSetting.VIEW_USER_ACCESS,
        EPerActSetting.VIEW_USER_ACCESS_BIZ,
        EPerActSetting.UPDATE_USER_ACCESS,
      ],
    } as any);
    // const autoTaskService = this.injector.get(AutoTaskService);
    // autoTaskService.permission.getUserPermissions().subscribe({
    //   next: (res) => {
    //     if (res.status === 200) {
    //       this.userAccessPerSubject.next(res.data);
    //     } else {
    //       window.location.href = '/';
    //     }
    //   },
    //   error: (error) => {
    //     window.location.href = '/';
    //   },
    // });
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
        case EModule.DASHBOARD:
          key = EPerActType.TASK;
          listNavItems = listDashboardNavItems;
          break;
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

  checkUserAccessModule(module: EModule): boolean {
    const userPer = this.userAccessPerSubject.getValue();
    if (!userPer) return false;
    switch (module) {
      case EModule.DASHBOARD:
        return !!userPer[EPerActType.TASK].length;
      case EModule.CONFIG:
        return !!userPer[EPerActType.FLOW].length;
      case EModule.SETTING:
        return !!userPer[EPerActType.SETTING].length;
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

  isOwner(): boolean {
    return this.currentBizSubject?.value?.user.role == ERole.OWNER;
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

  logout() {
    localStorage.removeItem('smaxapp_token');
    window.location.href = '/';
    this.isLoggedInSubject.next(false);
  }

  loginInDev() {
    const headers = new HttpHeaders().set(
      'Authorization',
      'Basic ZHVvbmdsb25nLmRldkBnbWFpbC5jb206MTIzMTIz',
    );
    const res = this.httpClient.post(
      'https://dev.smax.app/api/auth',
      {},
      {headers},
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
    // get the token
    const token = this.getToken();
    // return a boolean reflecting
    // whether or not the token is expired
    return !!token;
  }
}
