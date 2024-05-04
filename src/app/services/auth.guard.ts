import {Injectable} from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AuthService} from 'src/app/services/api/auth.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  token: string;
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.token = this.authService.getToken();
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.token) {
      this.authService.logout();
      if (environment.production) {
        // this.router.navigate(['/login'], { queryParams: { redirect: state.url } })
        setTimeout(() => {
          window.open(`https://smax.app/login`, '_self');
        }, 1000);
      }
      return false;
    }
    return true;
  }
}
