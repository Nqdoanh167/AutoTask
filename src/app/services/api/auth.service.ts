import {Injectable, Injector} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {BizService} from './biz.service';
import {
  Biz,
  BizModule,
  EFlowTab,
  EModule,
  ERole,
  ESettingTab,
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
    const autoTaskService = this.injector.get(AutoTaskService);
    autoTaskService.permission.getUserPermissions().subscribe({
      next: (res) => {
        if (res.status === 200) {
          console.log('res', res);
          this.userAccessPerSubject.next(res.data);
        } else {
          window.location.href = '/';
        }
      },
      error: (error) => {
        window.location.href = '/';
      },
    });
  }

  getAccessibleSite() {
    let accessibleSites: Record<EModule, string[]> = {
      [EModule.DASHBOARD]: [],
      [EModule.CONFIG]: [],
      [EModule.SETTING]: [],
    };
    const accessibleModules = this.getAccessibleModules();
    accessibleModules.forEach((module) => {
      switch (module) {
        case EModule.DASHBOARD:
          if (
            this.checkUserPer(EPerActType.TASK, [
              EPerActTask.VIEW_TASK,
              EPerActTask.VIEW_TASK_BIZ,
            ])
          ) {
            accessibleSites[module] = [EModule.DASHBOARD];
          }
          break;
        case EModule.CONFIG:
          if (
            this.checkUserPer(EPerActType.FLOW, [
              EPerActFlow.VIEW_FLOW,
              EPerActFlow.UPDATE_FLOW,
            ])
          ) {
            accessibleSites[module] = [EFlowTab.DATA, EFlowTab.RULE];
          }
          break;
        case EModule.SETTING:
          if (
            this.checkUserPer(EPerActType.SETTING, [
              EPerActSetting.VIEW_SOURCE_SETTING,
              EPerActSetting.UPDATE_SOURCE_SETTING,
            ])
          ) {
            accessibleSites[module].push(ESettingTab.SOURCE);
          }
          if (
            this.checkUserPer(EPerActType.SETTING, [
              EPerActSetting.VIEW_TAG_SETTING,
              EPerActSetting.UPDATE_TAG_SETTING,
            ])
          ) {
            accessibleSites[module].push(ESettingTab.TAG);
          }
          if (
            this.checkUserPer(EPerActType.SETTING, [
              EPerActSetting.VIEW_ROLE_SETTING,
              EPerActSetting.UPDATE_ROLE_SETTING,
            ])
          ) {
            accessibleSites[module].push(ESettingTab.ROLE);
          }
          if (
            this.checkUserPer(EPerActType.SETTING, [
              EPerActSetting.VIEW_USER_ACCESS_BIZ,
              EPerActSetting.UPDATE_USER_ACCESS,
              EPerActSetting.PERMISSION_SETTING_ACCESS,
            ])
          ) {
            accessibleSites[module].push(ESettingTab.DECENTRALIZATION);
          }
          break;
      }
    });
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
