import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from 'src/app/services/api/auth.service';
import {BreadcrumbService} from 'src/app/services/common/breadcrumb.service';
import {MainService} from 'src/app/services/api/main.service';
import {Biz, User} from 'src/app/types/viewmodels';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  user!: User;
  biz!: Biz;
  breadcrumbList: any = [];
  isSidebarExpanded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private breadcrumbService: BreadcrumbService,
    private mainService: MainService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe({
      next: (res) => {
        if (res) {
          this.user = res;
        }
      },
    });
    this.authService.currentBiz.subscribe({
      next: (res) => {
        if (res) {
          this.biz = res;
        }
      },
    });
    this.breadcrumbService.listBreadcrumb$.subscribe((data) => {
      this.breadcrumbList = data;
    });
    this.mainService.sidebarExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isExpanded) => {
        this.isSidebarExpanded = isExpanded;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authService.logout();
    window.location.href = '/';
  }
}
