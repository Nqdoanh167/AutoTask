import {Component, OnInit, OnDestroy} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import {Subject} from 'rxjs';
import {ISidebar} from '../types/viewmodels';
import {MainService} from '@app/services/api/main.service';
import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {ISetting} from '@app/types/setting';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent
  extends BaseComponentsComponent
  implements OnInit, OnDestroy
{
  public isHiddenSidebar = false;
  public listNavItems: ISidebar[] = [];
  public isLeadModule = false;
  public isLeadDashboard = false;

  // Lead filters state
  public leadCheckbox: any = {
    branchIds: [],
    roleIds: [],
    userIds: [],
    listBranches: [],
    listRoles: [],
    listUsers: [],
    branchDisplayInputText: '',
  };
  public leadSetting!: ISetting;

  protected override destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private title: Title,
    private readonly mainService: MainService,
  ) {
    super();
    this.title.setTitle(`App.vn | ${this.currentBiz?.name} | Auto Task`);
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
            `App.vn | ${this.currentBiz?.name || ''} | ${title}`,
          );
        }
      });
  }

  ngOnInit(): void {
    this.mainService.headerTab$.pipe().subscribe((res) => {
      if (res) {
        this.listNavItems = res;
        console.log('listNavItems', this.listNavItems);
      }
    });
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
