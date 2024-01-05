import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs';
import {AuthService} from '../services/api/auth.service';
import {Biz} from '../types/viewmodels';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  isHiddenSidebar = false;
  biz!: Biz;
  constructor(
    private router: Router,
    private authService: AuthService,
    private title: Title
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
        })
      )
      .subscribe((title: string) => {
        if (title) {
          this.title.setTitle(`Smax App | ${this.biz?.name || ''} | ${title}`);
        }
      });
  }

  ngOnInit(): void { }
}
