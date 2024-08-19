import {Component, OnDestroy, OnInit} from '@angular/core';
import {ETypeFilter, IFilterTopTable} from '@app/types/common';
import {ICommonDataSource, IQueryBase} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {
  ENextStepType,
  IBodyUpdateOrdering,
  IChainActRule,
  IUpdateChainActDto,
} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {AuthService} from '@app/services/api/auth.service';
import {EPerActFlow, EPerActType} from '@app/types/setting';

@Component({
  selector: 'app-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./rule.component.scss'],
})
export class RuleComponent implements OnDestroy, OnInit {
  private destroy$ = new Subject();
  public configFilters: IFilterTopTable[] = [
    {
      type: ETypeFilter.SEARCH,
      placeholder: 'Tìm kiếm...',
    },
  ];
  public dataSource: ICommonDataSource<IChainActRule, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
    },
    total: 0,
  };
  public permission = {
    edit: false,
  };

  public nextStepTypes = this.configurationService.nextStepTypes;

  constructor(
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    private readonly authService: AuthService,
  ) {
    const permissions = this.authService.getUserPerByType(EPerActType.FLOW);
    this.permission.edit = permissions?.some(
      (per) => per === EPerActFlow.UPDATE_FLOW,
    );
  }

  onSearch(value: any) {}

  ngOnInit() {
    this.getDataSource();
  }

  getDataSource(isReset?: boolean) {
    let params = {...this.dataSource.paramsQuery};
    if (isReset) {
      params.limit = 20;
      params.page = 1;
    }
    this.dataSource.loading = true;
    this.autoTaskService.chainAction
      .get(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.dataSource.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.dataSource.rows = res.data
              ?.map((chain) => {
                return {
                  ...chain,
                  actionResults: chain.actionResults?.sort(
                    (a, b) => a.ordering - b.ordering,
                  ),
                  isExpand: false,
                };
              })
              .sort((a, b) => a.ordering - b.ordering);
            this.dataSource.total = res.total;
          }
        },
      });
  }

  pageChanged(dataPage: {page: number; limit: number}): void {
    const {page, limit} = dataPage;
    if (page) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        page: page,
      };
    }
    if (limit) {
      this.dataSource.paramsQuery = {
        ...this.dataSource.paramsQuery,
        limit: Number(limit),
      };
    }
    this.getDataSource();
  }

  handleExpandRow(value: any) {}
  handleToggleAction(event: any, id?: string) {
    if (!id) return;
    const isActive = event.target.checked;
    const body = {
      isActive: event.target.checked,
    } as unknown as IUpdateChainActDto;
    this.autoTaskService.chainAction
      .update(id, body)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  dropRow(event: CdkDragDrop<any[]>) {
    try {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(
        this.dataSource.rows,
        event.previousIndex,
        event.currentIndex,
      );
    } catch (e) {
      console.log(e);
    }
    this.updateOrdering();
  }

  updateOrdering() {
    const body = this.dataSource?.rows?.map((row, index) => {
      return {
        id: row.id,
        ordering: index + 1,
      };
    }) as unknown as IBodyUpdateOrdering;
    this.autoTaskService.chainAction
      .updateMany(body)
      .pipe()
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleResErr(err),
      });
  }

  renderNameType(value: ENextStepType) {
    return (
      this.nextStepTypes?.find((type: any) => type.value == value)?.label ?? '-'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
