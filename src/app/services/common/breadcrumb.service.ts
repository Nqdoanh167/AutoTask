import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService implements OnDestroy {
  public destroy = new Subject();
  public listBreadcrumb$ = new BehaviorSubject<any[]>([])
  public defaultBreadcrumb = '';

  constructor(private router: Router) {}

  pushBreadcrumb(item: any) {
    this.listBreadcrumb$.next(item);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
