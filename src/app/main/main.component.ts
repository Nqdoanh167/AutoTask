import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import {AuthService} from '../services/api/auth.service';
import {Biz, EModule, ISidebar} from '../types/viewmodels';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  isHiddenSidebar = false;
  biz!: Biz;

  public listNavItems: ISidebar[] = [];

  public listConfigNavItems: ISidebar[] = [
    {
      link: '/config/rule',
      name: 'Cấu hình quy tắc',
      isActive: true,
    },
    {
      link: '/config/data',
      name: 'Cấu hình dữ liệu',
      isActive: true,
    },
  ];
  public listDashboardNavItems: ISidebar[] = [
    {
      link: '/dashboard',
      name: 'Quản lý Task',
      isActive: true,
    },
  ];
  public listSettingNavItems: ISidebar[] = [
    {
      link: '/setting/source',
      name: 'Nguồn dữ liệu',
      isActive: true,
    },
    {
      link: '/setting/tag',
      name: 'Tag',
      isActive: true,
    },
    {
      link: '/setting/decentralization',
      name: 'Phân quyền',
      isActive: true,
    },
    {
      link: '/setting/role',
      name: 'Vai trò',
      isActive: true,
    },
  ];
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
          if (url.includes(`/${EModule.CONFIG}`)) {
            this.listNavItems = this.listConfigNavItems;
          } else if (url.includes(`/${EModule.SETTING}`)) {
            this.listNavItems = this.listSettingNavItems;
          } else if (url.includes(`/${EModule.DASHBOARD}`)) {
            this.listNavItems = this.listDashboardNavItems;
          } else {
            this.listNavItems = [];
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

  ngOnInit(): void {
    this.authService.getUserPerAccess();
  }
}
