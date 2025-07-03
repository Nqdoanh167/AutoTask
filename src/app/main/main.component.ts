import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import {ISidebar} from '../types/viewmodels';
import {MainService} from '@app/services/api/main.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {ECallType} from '@app/types/call';
import { SocketService } from '@app/services/api/socket.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent extends BaseComponentsComponent implements OnInit {
  public isHiddenSidebar = false;
  public listNavItems: ISidebar[] = [];

  constructor(
    private router: Router,
    private title: Title,
    private readonly mainService: MainService,
    private readonly socketService: SocketService,
  ) {
    super();
    this.title.setTitle(`Smax App | ${this.currentBiz?.name} | Auto Task`);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
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
          this.title.setTitle(
            `Smax App | ${this.currentBiz?.name || ''} | ${title}`,
          );
        }
      });
  }

  ngOnInit(): void {
    this.mainService.headerTab$.pipe().subscribe((res) => {
      if (res) {
        this.listNavItems = res;
      }
    });
  }

  protected readonly ECallType = ECallType;
}
