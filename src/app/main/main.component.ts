import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import {AuthService} from '../services/api/auth.service';
import {Biz, EModule, ISidebar} from '../types/viewmodels';
import {
  listConfigNavItems,
  listDashboardNavItems,
  listSettingNavItems,
} from '@app/variable';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  isHiddenSidebar = false;
  biz!: Biz;

  public listNavItems: ISidebar[] = [];

  public listConfigNavItems: ISidebar[] = listConfigNavItems;
  public listDashboardNavItems: ISidebar[] = listDashboardNavItems;
  public listSettingNavItems: ISidebar[] = listSettingNavItems;
  constructor(
    private router: Router,
    private authService: AuthService,
    private title: Title,
  ) {
    this.authService.currentBiz.subscribe({
      next: (res) => {
        if (res) {
          this.biz = res;
          this.title.setTitle(`Smax App | ${res.name} | Auto Task`);
        }
      },
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          const url = this.router.url;
          let mainModule;
          if (url.includes(`/${EModule.CONFIG}`)) {
            mainModule = EModule.CONFIG;
            this.listNavItems = this.listConfigNavItems;
          } else if (url.includes(`/${EModule.SETTING}`)) {
            mainModule = EModule.SETTING;
            this.listNavItems = this.listSettingNavItems;
          } else if (url.includes(`/${EModule.DASHBOARD}`)) {
            mainModule = EModule.DASHBOARD;
            this.listNavItems = this.listDashboardNavItems;
          } else {
            this.listNavItems = [];
          }
          const getAccessibleSite = this.authService.getAccessibleSite();
          const availableTabs = getAccessibleSite[mainModule as EModule];
          if (mainModule !== EModule.DASHBOARD) {
            this.listNavItems = this.listNavItems.filter((side) => {
              return availableTabs.includes(side.alias as any);
            });
          }
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          this.isHiddenSidebar =
            route.snapshot.data['isHiddenSidebar'] || false;
          return routeTitle;
        }),
      )
      .subscribe((title: string) => {
        if (title) {
          this.title.setTitle(`Smax App | ${this.biz?.name || ''} | ${title}`);
        }
      });
  }

  ngOnInit(): void {}
}
