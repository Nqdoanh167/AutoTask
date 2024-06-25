import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {Observable, of} from 'rxjs';
import {filter, switchMap} from 'rxjs/operators';
import {AuthService} from '@app/services/api/auth.service';
import {BizService} from '@app/services/api/biz.service';
import {EModule} from '@app/types/viewmodels';

@Injectable({
  providedIn: 'root',
})
export class HasPermissionAccessModuleGuard implements CanActivate {
  token: string;
  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly bizService: BizService,
  ) {
    this.token = this.authService.getToken();
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | boolean {
    const accessModule = next?.routeConfig?.path as EModule;
    return this.authService.userAccessPer$.pipe(
      filter((res) => !!res),
      switchMap((res) => {
        const listModuleCanAccess = this.authService.getAccessibleModules();
        const result = listModuleCanAccess.includes(accessModule);
        if (!result) {
          if (listModuleCanAccess?.[0]) {
            this.router.navigate(['/' + listModuleCanAccess[0]]);
          } else {
            window.location.href = '/';
          }
          return of(false);
        }
        return of(true);
      }),
    );
  }
}
