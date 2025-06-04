import {Component, inject, OnDestroy} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {Biz, Branch, User} from '@app/types/viewmodels';

@Component({
  selector: 'app-base-components',
  standalone: true,
  imports: [],
  template: '',
})
export class BaseComponentsComponent implements OnDestroy {
  protected readonly authService = inject(AuthService);

  protected destroy$ = new Subject<void>();
  protected currentBiz?: Biz;
  protected currentUser?: User;
  protected bizAlias?: string;
  protected bizUsers?: User[];
  protected currentViewer?: User;
  protected bizBranches?: Branch[];

  constructor() {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((biz) => {
        this.currentBiz = biz;
        this.bizAlias = biz.alias;
        this.currentUser = biz?.user;
        this.bizUsers = biz.users;
        this.bizBranches = biz.branches;
      });
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentViewer = user;
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
