import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/services/api/auth.service';
import { BackendError, ObjectAny } from '../types/viewmodels';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class TokenInterceptor implements HttpInterceptor {
  public static currentTeamId: any;
  constructor(public auth: AuthService, private toastr: ToastrService) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let requestOption: any = {};

    if(!environment.production) {
      requestOption.setHeaders = {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZjEwMjEzMWZhM2Q5MDIyZmQ0ZjFkYSIsImlhdCI6MTY0MzE4NDY1OX0.gFSZ9K64Vr9LxvkhvoJt7mwjheE19lIMFTkbPnoSvk0`
      }
    }
    if (this.auth.isAuthenticated()) {
      const defaultHeader: ObjectAny = {
        Authorization: `Bearer ${this.auth.getToken()}`,
      }
      if(this.auth.refToken) defaultHeader['ref-token'] = `Bearer ${this.auth.refToken}`;
      requestOption.setHeaders = defaultHeader;
    }

    request = request.clone(requestOption);
    return next.handle(request).pipe(
      catchError((response, retry) => {
        if (this.isUnauthorized(response)) {
          return throwError(<BackendError>{
            silent: true,
          });
        } else if (
          response instanceof HttpErrorResponse &&
          response.status === 403
        ) {
          this.toastr.warning(response.error?.message || 'You do not have permission')
          return throwError({
            messages: ['You do not have permission'],
          });
        }
        this.toastr.warning(response.error?.message)
        return throwError(response.error || response);
      })
    );
  }

  private isUnauthorized(err: HttpErrorResponse) {
    return err instanceof HttpErrorResponse && err.status === 401;
  }
}
