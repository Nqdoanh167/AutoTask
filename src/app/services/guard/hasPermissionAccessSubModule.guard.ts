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
import {logging} from '@angular-devkit/core';

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
    let mainModule = next.data?.['mainModule'] as EModule;
    const accessTab = next?.routeConfig?.path as EModule;
    return this.authService.userAccessPer$.pipe(
      filter((res) => !!res),
      switchMap((res) => {
        const getAccessibleSite = this.authService.getAccessibleSite();
        const availableTabs = getAccessibleSite[mainModule];
        const result = availableTabs.includes(accessTab);
        if (!result) {
          if (availableTabs?.[0]) {
            this.router.navigate([`/${mainModule}/${availableTabs[0]}`]);
          } else {
            this.router.navigate(['/']);
          }
          return of(false);
        }
        return of(true);
      }),
    );
  }
}
