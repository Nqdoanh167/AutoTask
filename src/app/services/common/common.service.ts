import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';
import {EntityResult} from '@app/types/viewmodels';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CommonService implements OnDestroy {
  public destroy = new Subject();
  public listBreadcrumb$ = new BehaviorSubject<string[]>([]);
  public defaultBreadcrumb = '';

  constructor(
    private toastr: ToastrService,
    private router: Router,
  ) {}

  handleResErr<T>(response?: EntityResult<T>, alias?: string) {
    if (!response) {
      this.toastr.error('Đã có lỗi xảy ra!');
      return;
    }
    if ([400, 409, 413, 500].includes(response.status)) {
      let text = response.message;
      this.toastr.error(text);
    } else if ([404].includes(response.status)) {
      this.toastr.error('Không tìm thấy kết quả!');
    } else if ([401].includes(response.status)) {
      this.router.navigate(['/login']);
    } else if ([403].includes(response.status)) {
      this.toastr.error('Bạn không có quyền!');
    } else {
      this.toastr.error('Đã có lỗi xảy ra!');
    }
  }

  handleErr(response: HttpErrorResponse) {
    if ([400, 404, 409, 413, 500].includes(response.status)) {
      let text = response.name;
      if (response.error && typeof response.error === 'object') {
        if (response.error.error)
          text = response.error.error.message || response.error.error;
        if (response.error.message) text = response.error.message;
      } else if (typeof response.error === 'string') {
        text = response.error;
      }
      this.toastr.error(text);
    } else if ([401].includes(response.status)) {
      // this.toastr.error('Unauthorized error')
      this.router.navigate(['/login']);
    } else if ([403].includes(response.status)) {
      let text = 'You do not have permission';
      if (response.error) {
        if (response.error.error && response.error.error.message) {
          text = response.error.error.message;
        }
        if (response.error.message) {
          text = response.error.message;
        }
      } else if (typeof response.error === 'string') {
        text = response.error;
      }
      this.toastr.error(text);
    } else {
      this.toastr.error(response.statusText);
    }
  }

  handleResSuccess(
    action?: 'get' | 'update' | 'delete' | 'create' | 'clone',
    text?: string,
  ) {
    if (text) {
      this.toastr.success(text);
      return;
    }
    switch (action) {
      case 'get':
        this.toastr.success('Lấy dữ liệu thành công!');
        break;
      case 'update':
        this.toastr.success('Cập nhật thành công!');
        break;
      case 'delete':
        this.toastr.success('Xóa thành công!');
        break;
      case 'create':
        this.toastr.success('Tạo mới thành công!');
        break;
      case 'clone':
        this.toastr.success('Clone thành công!');
        break;
      default:
        this.toastr.success('Thành công');
    }
  }

  pushBreadcrumb(breadcrumb?: string) {
    if (!breadcrumb) {
      return this.listBreadcrumb$.next([this.defaultBreadcrumb]);
    }
    this.listBreadcrumb$.next([this.defaultBreadcrumb, breadcrumb]);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
