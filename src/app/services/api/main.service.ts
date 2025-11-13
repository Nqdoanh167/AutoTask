import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {
  AppointmentBooking,
  AppointmentRoom,
  AppointmentStatus,
  Biz,
  Config,
  EntityResult,
  IRoleAct,
  ISidebar,
  SaleHistory,
  SaleReason,
  Staff,
  Tag,
  User,
} from 'src/app/types/viewmodels';
import {BehaviorSubject, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {ITask} from '@app/types/flow';

declare const FB: any;

@Injectable({
  providedIn: 'root',
})
export class MainService extends BaseApiService implements OnDestroy {
  private isHiddenSidebarSubject = new BehaviorSubject<boolean>(false);
  public isHiddenSidebar = this.isHiddenSidebarSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private headerTabsSubject = new BehaviorSubject<ISidebar[]>([]);
  public headerTab$ = this.headerTabsSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private currentConfigSubject = new BehaviorSubject<Config>(
    null as unknown as Config,
  );

  public currentConfig = this.currentConfigSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  // AppointmentStatus
  private listAppointmentStatusSubject = new BehaviorSubject<
    AppointmentStatus[]
  >(null as unknown as AppointmentStatus[]);
  public listAppointmentStatus = this.listAppointmentStatusSubject
    .asObservable()
    .pipe(distinctUntilChanged());
  private listAppointmentRoomSubject = new BehaviorSubject<AppointmentRoom[]>(
    null as unknown as AppointmentRoom[],
  );
  public listAppointmentRoom = this.listAppointmentRoomSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private destroy = new Subject();
  public biz!: Biz;
  public user!: User;
  public bizConfig!: Config;
  public api = {
    tag: 'tags',
    shipper: 'shippers',
    config: 'config',
    saleReason: 'sale-reasons',
    saleHistory: 'sale-histories',
    staff: 'staffs',
    appointmentRoom: 'appointment-rooms',
    appointmentBooking: 'appointment-bookings',
    appointmentStatus: 'appointment-statuses',
  };

  private defaultParams: any = {};

  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.biz = res;
          this.setApiAddress(
            environment.apiModule,
            `bizs/${res.alias}/auto-task`,
          );
        }
      },
    });
    this.authService.currentUser.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.user = res;
        }
      },
    });
    this.currentConfig.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.bizConfig = res;
        }
      },
    });
  }

  tag = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Tag[]>>(this.createUrl([this.api.tag]), {
        params: this.createParams(Object.assign(params, this.defaultParams)),
      }),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Tag>>(
        this.createUrl([this.api.tag]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Tag>>(
        this.createUrl([this.api.tag, id]),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Tag>>(
        this.createUrl([this.api.tag, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Tag>>(
        this.createUrl([this.api.tag, id]),
      ),
  };

  config = {
    show: (params = {}) =>
      this.httpClient.get<EntityResult<Config>>(
        this.createUrl([this.api.config]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    update: (body = {}) =>
      this.httpClient.put<EntityResult<Config>>(
        this.createUrl([this.api.config]),
        body,
      ),
  };

  saleReason = {
    create: (body = {}) =>
      this.httpClient.post<EntityResult<SaleReason>>(
        this.createUrl([this.api.saleReason]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<SaleReason>>(
        this.createUrl([this.api.saleReason, id]),
        body,
      ),
    get: (params = {}) =>
      this.httpClient.get<EntityResult<SaleReason[]>>(
        this.createUrl([this.api.saleReason]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    delete: (id: string, body = {}) =>
      this.httpClient.delete<EntityResult<SaleReason>>(
        this.createUrl([this.api.saleReason, id]),
      ),
  };

  saleHistory = {
    create: (body = {}) =>
      this.httpClient.post<EntityResult<SaleHistory>>(
        this.createUrl([this.api.saleHistory]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<SaleHistory>>(
        this.createUrl([this.api.saleHistory, id]),
        body,
      ),
    updateResult: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<SaleHistory>>(
        this.createUrl([this.api.saleHistory, id, 'result']),
        body,
      ),
    get: (params = {}) =>
      this.httpClient.get<EntityResult<SaleHistory[]>>(
        this.createUrl([this.api.saleHistory]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
  };

  appointmentStatus = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<AppointmentStatus[]>>(
        this.createUrl([this.api.appointmentStatus]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<AppointmentStatus>>(
        this.createUrl([this.api.appointmentStatus]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<AppointmentStatus>>(
        this.createUrl([this.api.appointmentStatus, id]),
        body,
      ),
    updatePos: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<AppointmentStatus>>(
        this.createUrl([this.api.appointmentStatus, id, 'pos']),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<AppointmentStatus>>(
        this.createUrl([this.api.appointmentStatus, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<AppointmentStatus>>(
        this.createUrl([this.api.appointmentStatus, id]),
      ),
  };

  appointmentRoom = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<AppointmentRoom[]>>(
        this.createUrl([this.api.appointmentRoom]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<AppointmentRoom>>(
        this.createUrl([this.api.appointmentRoom]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<AppointmentRoom>>(
        this.createUrl([this.api.appointmentRoom, id]),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<AppointmentRoom>>(
        this.createUrl([this.api.appointmentRoom, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<AppointmentRoom>>(
        this.createUrl([this.api.appointmentRoom, id]),
      ),
  };

  appointmentBooking = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<AppointmentBooking[]>>(
        this.createUrl([this.api.appointmentBooking]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    getList: (params = {}) =>
      this.httpClient.get<EntityResult<AppointmentBooking[]>>(
        this.createUrl([this.api.appointmentBooking, 'list']),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<AppointmentBooking>>(
        this.createUrl([this.api.appointmentBooking]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<AppointmentBooking>>(
        this.createUrl([this.api.appointmentBooking, id]),
        body,
      ),
    pushOrder: (id: string, body = {}) =>
      this.httpClient.post<EntityResult<AppointmentBooking>>(
        this.createUrl([this.api.appointmentBooking, id, 'order']),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<AppointmentBooking>>(
        this.createUrl([this.api.appointmentBooking, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<AppointmentBooking>>(
        this.createUrl([this.api.appointmentBooking, id]),
      ),
  };

  staff = {
    get: (params = {}) =>
      this.httpClient.get<EntityResult<Staff[]>>(
        this.createUrl([this.api.staff]),
        {
          params: this.createParams(Object.assign(params, this.defaultParams)),
        },
      ),
    create: (body = {}) =>
      this.httpClient.post<EntityResult<Staff>>(
        this.createUrl([this.api.staff]),
        body,
      ),
    update: (id: string, body = {}) =>
      this.httpClient.put<EntityResult<Staff>>(
        this.createUrl([this.api.staff, id]),
        body,
      ),
    updateOrderViewColumn: (body = {}) =>
      this.httpClient.put<EntityResult<Config>>(
        this.createUrl([this.api.staff, 'order-view-columns']),
        body,
      ),
    show: (id: string) =>
      this.httpClient.get<EntityResult<Staff>>(
        this.createUrl([this.api.staff, id]),
      ),
    delete: (id: string) =>
      this.httpClient.delete<EntityResult<Staff>>(
        this.createUrl([this.api.staff, id]),
      ),
  };

  copyText(text: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    console.log('Copy text to Clipboard success!');
  }

  hasPermissionRole({
    type,
    role,
    task,
  }: {
    type: string;
    role: string;
    task?: ITask | null;
  }) {
    if (
      this.biz?.user?.role === 'OWNER' ||
      ['ADMIN', 'DEV'].includes(this.user?.role)
    ) {
      return true;
    }
    if (type === 'order' && task?.['branch']) {
      const branch = this.bizConfig?.staff?.branches.find(
        (b: any) => b.id === task?.['branch'],
      );
      if (branch?.role === 'LEADER') return true;
      return (
        role &&
        this.bizConfig?.staff?.roleAct &&
        this.bizConfig.staff.roleAct[role] &&
        this.bizConfig.staff.roleAct[role]
      );
    }
    return !!(
      this.bizConfig.staff?.roleAct && this.bizConfig.staff.roleAct[role]
    );
  }

  isOwner() {
    return (
      this.biz?.user?.role === 'OWNER' || ['ADMIN'].includes(this.user?.role)
    );
  }

  isPerBranch(id: string | null, per?: string) {
    if (!id) {
      if (!per) return true;
      return per && this.bizConfig?.staff?.roleAct[per];
    }
    // Check leader Branch
    const branch = this.bizConfig?.staff?.branches.find(
      (b: any) => b.id === id,
    );
    if (branch?.role === 'LEADER') return true;
    return (
      per &&
      this.bizConfig?.staff?.roleAct &&
      this.bizConfig.staff.roleAct[id] &&
      this.bizConfig.staff.roleAct[id][per as keyof IRoleAct]
    );
  }

  hasPerRole(branch: string | null, per?: string) {
    if (this.isOwner()) return true;
    return this.isPerBranch(branch, per);
  }

  /**
   * Trả về toàn bộ chi nhánh theo User
   * @param pers : Danh sách quyền, Nếu có quyền cấp cao này sẽ trả về toàn bộ chi nhánh của Biz
   * @returns User[]
   */
  // getBranchPer(pers: string[] = []) {
  //   if (this.isOwner() || pers.some((per) => this.hasPerRole(null, per))) {
  //     return this.biz.branches;
  //   }
  //   const branches = this.bizConfig.staff.branches
  //     .filter((b: any) => b.permission)
  //     .map((b: any) => b.id);
  //   return this.biz.branches.filter((b) => branches.includes(b.id));
  // }

  /**
   * Trả về toàn bộ user của chi nhánh
   * @param branchId : Id Chi nhánh
   * @returns User[]
   */
  getUserByBranch(branchId: string) {
    return this.biz.users.filter((u: any) => u.branchIds?.includes(branchId));
  }
  /**
   * Trả về toàn bộ user của chi nhánh nếu đủ quyền
   * @param branchId : Id Chi nhánh
   * @param pers : Danh sách quyền
   * @returns User[]
   */
  getUserBranchPer(branchId: string, pers: string[] = []) {
    let checkboxUserIds = [this.user.id];
    if (this.isOwner() || pers.some((per) => this.isPerBranch(branchId, per))) {
      this.biz.users.filter((u: any) => {
        if (u.branchIds?.includes(branchId)) checkboxUserIds.push(u.id);
      });
    }
    return this.biz.users.filter((u: User) => checkboxUserIds.includes(u.id));
  }

  setCurrentConfig(config: Config) {
    this.currentConfigSubject.next(config);
  }

  setHiddenSidebar(item: boolean) {
    this.isHiddenSidebarSubject.next(item);
  }

  setHeaderTabs(items: ISidebar[]) {
    this.headerTabsSubject.next(items);
  }

  getHeaderTabs() {
    return this.headerTabsSubject.value;
  }

  clearHeaderTabs() {
    this.headerTabsSubject.next([]);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
