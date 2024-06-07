import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from 'src/app/services/api/auth.service';
import {BreadcrumbService} from 'src/app/services/common/breadcrumb.service';
import {Biz, EModule, ISidebar, User} from 'src/app/types/viewmodels';
import {filter, switchMap} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  sidebars: ISidebar[] = [
    {
      link: `/${EModule.DASHBOARD}`,
      alias: EModule.DASHBOARD,
      name: 'Dashboard',
      icon: './assets/images/module/table.svg',
      iconActive: './assets/images/module/table-active.svg',
      isActive: true,
    },
    {
      link: `/${EModule.CONFIG}`,
      alias: EModule.CONFIG,
      name: 'Cấu hình Quy tắc và Dữ liệu',
      icon: './assets/images/module/flow.svg',
      iconActive: './assets/images/module/flow-active.svg',
      isActive: false,
    },
    {
      link: `/${EModule.SETTING}`,
      alias: EModule.SETTING,
      name: 'Cài đặt',
      icon: './assets/images/module/setting.svg',
      iconActive: './assets/images/module/setting-active.svg',
      isActive: false,
    },
  ];
  biz!: Biz;
  user!: User;
  constructor(
    private router: Router,
    private authService: AuthService,
    private breadcrumbService: BreadcrumbService,
  ) {
    this.authService.currentBiz.subscribe((res) => {
      if (res) this.biz = res;
    });
    this.authService.currentUser.subscribe((res) => {
      if (res) this.user = res;
    });
    this.authService.userAccessPer$
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        const listModuleCanAccess = this.authService.getAccessibleModules();
        this.sidebars = this.sidebars.filter((side) => {
          return listModuleCanAccess.includes(side.alias as EModule);
        });
      });
  }

  ngOnInit(): void {
    this.changeRoute();
  }
  changeRoute() {
    this.activeSidebar(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeSidebar(event.url);
      }
    });
  }
  activeSidebar(url: string) {
    url = url.replace(/\?.*/, '');
    const urlOne = url.substring(0, this.getPositionString(url, '/', 2));
    // const urlTwo = url.substring(0, this.getPositionString(url, '/', 3));
    this.sidebars = this.sidebars.map((side: any) => {
      side.isActive = side.link === urlOne ? true : false;
      return side;
    });
  }
  getPositionString(text: string, subString: string, index: number) {
    return text.split(subString, index).join(subString).length;
  }
}
