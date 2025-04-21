import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from './base.service';
import {EntityResult, IQueryBase} from 'src/app/types/viewmodels';
import {BehaviorSubject, of, Subject, takeUntil, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from './auth.service';
import {IBlockAutomation} from '@app/types/automation';

@Injectable({
  providedIn: 'root',
})
export class AutomationService extends BaseApiService implements OnDestroy {
  destroy = new Subject();

  private listBlockSubject = new BehaviorSubject<
    EntityResult<IBlockAutomation[]>
  >(null as unknown as EntityResult<IBlockAutomation[]>);

  api = {
    action: 'action',
    block: 'block',
  };
  constructor(
    httpClient: HttpClient,
    private authService: AuthService,
  ) {
    super(httpClient);
    this.authService.currentBiz.pipe(takeUntil(this.destroy)).subscribe({
      next: (res) => {
        if (res) {
          this.setApiAddress(
            environment.apiAddress,
            `bizs/${res.alias}/automation`,
          );
        }
      },
    });
  }

  block = {
    get: (id: string) =>
      this.httpClient.get<EntityResult<IBlockAutomation>>(
        this.createUrl(['blocks', id]),
      ),
    getMany: (
      params: IQueryBase,
      options?: {
        cache?: boolean;
      },
    ) => {
      const getData = this.httpClient
        .get<EntityResult<IBlockAutomation[]>>(this.createUrl(['blocks']), {
          params: this.createParams(params),
        })
        .pipe(tap((res) => res?.status === 200 && this.setListBlock(res)));

      if (options?.cache) {
        if (!this.listBlockSubject.getValue()) {
          return getData;
        }
        return of(this.listBlockSubject.getValue());
      }
      return getData;
    },
  };

  setListBlock(items: EntityResult<IBlockAutomation[]>) {
    this.listBlockSubject.next(items);
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }
}
