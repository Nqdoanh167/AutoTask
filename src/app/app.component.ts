import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/api/auth.service';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { filter, switchMap } from 'rxjs';
import { ISetting, UserAcl, UserPerAccess } from './types/setting';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public loading = true;
  public title = 'Tác vụ';
  userAccessPer!: UserPerAccess;
  setting!: ISetting;
  constructor(
    private authService: AuthService,
    private readonly autoTaskService: AutoTaskService,
  ) { }
  ngOnInit(): void {
    this.authService.popular();
    this.authService.currentBiz.subscribe({
      next: (res) => {
        if (res) {
          this.getAutoTaskPermission();
          this.getAutoTaskSetting();
        }
      },
      error: (error) => {
        window.location.href = '/';
      },
    });
  }
  getAutoTaskPermission() {
    return this.autoTaskService.permission.getUserPermissions().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.authService.setUserAccessPerSubject(res.data);
          this.userAccessPer = res.data;
          this.toggleLoading();
        } else {
          window.location.href = '/';
        }
      },
      error: (error) => {
        window.location.href = '/';
      },
    });
  }
  getAutoTaskSetting() {
    return this.autoTaskService.setting.retrieve().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.autoTaskService.setCurrentSetting(res.data);
          this.setting = res.data;
          this.toggleLoading();
        }
      },
    });
  }
  toggleLoading() {
    this.loading = !!(this.setting && this.userAccessPer);
  }

}
