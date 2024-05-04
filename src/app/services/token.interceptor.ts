import {Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';
import {AuthService} from '@app/services/api/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    public auth: AuthService,
    private toastr: ToastrService,
  ) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const requestOption: any = {};
    if (
      !/auth(\/facebook)?$/.test(request.url) &&
      !/auth(\/google)?$/.test(request.url) &&
      this.auth.isAuthenticated()
    ) {
      requestOption.setHeaders = {
        Authorization: `Bearer ${this.auth.getToken()}`,
      };
      if (this.auth.refToken) {
        requestOption.setHeaders['Ref-Token'] = `Bearer ${this.auth.refToken}`;
      }
    }
    request = request.clone(requestOption);
    return next.handle(request).pipe(
      catchError((response, retry) => {
        if (response instanceof HttpErrorResponse) {
          if (response.status === 401) {
            this.toastr.error(
              'Bạn không có quyền truy cập vào trang này',
              'Lỗi',
            );
            this.auth.logout();
          }
        }
        return throwError(response);
      }),
    );
  }
}
