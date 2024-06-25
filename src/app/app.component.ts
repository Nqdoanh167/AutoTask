import {Component, OnInit} from '@angular/core';
import {AuthService} from './services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {filter, finalize, switchMap} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public loading = true;
  public title = 'Tác vụ';
  constructor(
    private authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
  ) {}
  ngOnInit(): void {
    this.authService.popular();
    this.authService.currentBiz
      .pipe(
        filter((biz) => !!biz),
        switchMap(() => this.autoTaskService.permission.getUserPermissions()),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.loading = false;
            this.authService.setUserAccessPerSubject(res.data);
          } else {
            window.location.href = '/';
          }
        },
        error: (error) => {
          window.location.href = '/';
        },
      });
  }
}
