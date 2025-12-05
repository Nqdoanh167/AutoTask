import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/app/services/api/auth.service';
import { Biz, EModule, ISidebar, User } from 'src/app/types/viewmodels';
import { filter } from 'rxjs/operators';
import {
  listConfigNavItems,
  listDashboardNavItems,
  listSettingNavItems,
} from '@app/variable';
import { MainService } from '@app/services/api/main.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  public listConfigNavItems: ISidebar[] = listConfigNavItems;
  public listDashboardNavItems: ISidebar[] = listDashboardNavItems;
  public listSettingNavItems: ISidebar[] = listSettingNavItems;
  public sidebars: ISidebar[] = [
    {
      link: `/${EModule.DASHBOARD}`,
      alias: EModule.DASHBOARD,
      name: 'Tác vụ',
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
  public biz!: Biz;
  public user!: User;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly mainService: MainService,
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
    let mainModule;
    if (url.includes(`/${EModule.CONFIG}`)) {
      mainModule = EModule.CONFIG;
      this.mainService.setHeaderTabs(this.listConfigNavItems);
    } else if (url.includes(`/${EModule.SETTING}`)) {
      mainModule = EModule.SETTING;
      this.mainService.setHeaderTabs(this.listSettingNavItems);
    } else if (url.includes(`/${EModule.DASHBOARD}`)) {
      mainModule = EModule.DASHBOARD;
      this.mainService.setHeaderTabs(this.listDashboardNavItems);
    } else {
      this.mainService.setHeaderTabs([]);
    }
    const getAccessibleSite = this.authService.getAccessibleSite();
    console.log('getAccessibleSite', getAccessibleSite);
    const availableTabs = getAccessibleSite[mainModule as EModule];
    if (mainModule !== EModule.DASHBOARD) {
      this.mainService.setHeaderTabs(
        this.mainService.getHeaderTabs()?.filter((side) => {
          return availableTabs.includes(side.alias as any);
        }) || [],
      );
    }
    url = url.replace(/\?.*/, '');
    const urlOne = url.substring(0, this.getPositionString(url, '/', 2));
    // const urlTwo = url.substring(0, this.getPositionString(url, '/', 3));
    this.sidebars = this.sidebars.map((side: any) => {
      side.isActive = side.link === urlOne;
      return side;
    });
  }

  getPositionString(text: string, subString: string, index: number) {
    return text.split(subString, index).join(subString).length;
  }
}
