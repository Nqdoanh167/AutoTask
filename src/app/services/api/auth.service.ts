import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base.service';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BizService } from './biz.service';
import { Biz, BizModule, Branch, ERole, User } from 'src/app/types/viewmodels';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User>(null as unknown as User);
  public currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());
  private currentBizSubject = new BehaviorSubject<Biz>(null as unknown as Biz);
  public currentBiz = this.currentBizSubject.asObservable().pipe(distinctUntilChanged());

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public branches = new BehaviorSubject<Branch[]>([]);
  public modules = new BehaviorSubject<BizModule[]>([]);
  public isLoggedIn = this.isLoggedInSubject.asObservable().pipe(distinctUntilChanged());

  public refToken: string | null = null;

  constructor(private bizService: BizService) { }

  auth = {
  };

  popular() {
    let alias = 'test';

    const parsedURL = new URL(location.href)
    if (environment.production) {
      alias = parsedURL.pathname.substring(1).replace(/\/.*/, "")
    }

    if (this.getToken() && alias) {
      this.bizService.biz.get(alias).subscribe({
        next: (res) => {
          if (res.data?.id) {
            // localStorage.setItem('user', JSON.stringify(res.data));
            this.currentUserSubject.next(res.viewer!);
            this.currentBizSubject.next(res.data);
            this.branches.next(res.data.branches);
            this.modules.next(res.data.modules);
            this.refToken = res.refToken || null;
            this.isLoggedInSubject.next(true);
          } else {
            window.location.href = parsedURL.origin
          }
        },
        error: (error) => {
          // console.log('error');
          // this.logout()
          window.location.href = '/';
        }
      }
      );
    }else {
      window.location.href = '/'
    }
  }
  isOwner(): boolean {
    return this.currentBizSubject?.value?.user.role == ERole.OWNER
  }
  getToken(name = 'smaxapp_token'): string {
    const token = localStorage.getItem(name);
    return token || '';
  }
  setToken(token: string, name = 'smaxapp_token') {
    localStorage.setItem(name, token);
  }
  setUser(user: User) {
    // localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout() {
    localStorage.removeItem('smaxapp_token');
    window.location.href = '/';
    // localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
  }

  isAuthenticated(): boolean {
    // get the token
    const token = this.getToken();
    // return a boolean reflecting
    // whether or not the token is expired
    // return this.tokenNotExpired(token);
    // console.log('token', token);
    return token ? true : false;
  }
  // tokenNotExpired(token) {
  //   if (token) {
  //     var jwtHelper = new JwtHelperService();
  //     return token != null && !jwtHelper.isTokenExpired(token);
  //   } else {
  //     return false;
  //   }
  // }
}
