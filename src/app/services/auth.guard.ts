import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/services/api/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  token: string;
  constructor(private authService: AuthService, private router: Router) {
    this.token = this.authService.getToken();
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (this.token) {
      return of(true);
    } else {
      window.location.href = 'https://smax.app'
      // this.router.navigate(['/']);
      // this.router.navigate(['/login']);
      return of(false);
    }
  }
}
