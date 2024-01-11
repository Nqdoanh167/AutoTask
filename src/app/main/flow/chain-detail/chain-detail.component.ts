import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {ETypeButton, IFilterTopButton} from '@app/types/common';
import {ActivatedRoute, Router} from '@angular/router';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {environment} from '../../../../environments/environment';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {
  EChainNextActType,
  EDelayTypeChainNextAct,
  IAction,
  IActResult,
  IBulkUpdateChainActResult,
  IChainAct,
  IChainActResult,
  IChainResult,
} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {uniqBy} from 'lodash';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';

@Component({
  selector: 'app-chain-detail',
  templateUrl: './chain-detail.component.html',
  styleUrls: ['./chain-detail.component.scss'],
})
export class ChainDetailComponent implements OnDestroy, OnInit {
  @ViewChild('template') template!: TemplateRef<any>;
  @ViewChild('templateAddNextAction') templateAddNextAction!: TemplateRef<any>;

  public detailChain?: IChainAct;
  protected readonly EChainNextActType = EChainNextActType;
  protected readonly EDelayTypeChainNextAct = EDelayTypeChainNextAct;
  public configButtons: IFilterTopButton[] = [
    {
      name: 'back',
      type: ETypeButton.DEFAULT,
      label: 'Quay lại',
      icon: './assets/images/icon/back.svg',
    },
    {
      name: 'introduce',
      type: ETypeButton.SUB_PRIMARY,
      label: 'HDSD',
      icon: './assets/images/icon/notebook-primary.svg',
      activeIcon: './assets/images/icon/notebook-white.svg',
    },
    {
      name: 'save',
      type: ETypeButton.PRIMARY,
      label: 'Lưu',
      icon: './assets/images/icon/save.svg',
    },
  ];

  public introductionModalRef?: BsModalRef;
  public addNextActionModalRef?: BsModalRef;
  public loading = {
    detail: false,
    submit: false,
  };

  public results: ICommonDataLazy<IActResult, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  public actions: ICommonDataLazy<IAction, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public submittedModal = false;
  public submitted = false;
  public selectedResulRowId?: string;
  public selectedResulRowIndex?: number;
  public resultsInRow: IActResult[] = [];

  public addNextActionForm = this.fb.group({
    resultId: [null, [Validators.required]],
  });

  private chainId?: string;

  private currentBiz = '';
  private destroy$ = new Subject();
  constructor(
    private readonly router: Router,
    private readonly modalService: BsModalService,
    private authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly fb: FormBuilder,
  ) {
    this.authService.currentBiz
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.currentBiz = res.alias || '';
        }
      });
    this.route.params.subscribe((params) => {
      this.chainId = params['id'];
      if (this.chainId) this.getDetailChain();
    });
  }

  get f(): {[key: string]: AbstractControl} {
    return this.addNextActionForm.controls;
  }

  ngOnInit() {
    this.getResult();
    this.getAction();
  }

  getDetailChain() {
    this.loading.detail = true;
    this.autoTaskService.chainAction
      .getOne(this.chainId!)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading.detail = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.detailChain = {
              ...res.data,
              actionResults: res.data?.actionResults?.map((actResult) => {
                return {
                  ...actResult,
                  results: actResult?.results?.map((result) => {
                    return {
                      ...result,
                      resultId: result?.result?.id,
                      nextActions: result?.nextActions?.map((nextAction) => {
                        return {
                          ...nextAction,
                          actionId: nextAction?.action?.id,
                        };
                      }),
                    };
                  }),
                };
              }),
            };
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleAction(name: string) {
    if (name === 'back') {
      this.router.navigate(['/config/rule']);
    }
    if (name === 'introduce') {
      this.introductionModalRef = this.modalService.show(this.template, {
        class: 'modal-lg',
      });
    }
    if (name === 'save') {
      this.onSaveChainAct();
    }
  }

  validateBeforeSubmit(): boolean {
    try {
      this.submitted = true;
      const actionResults = this.detailChain?.actionResults;
      if (!actionResults?.length) return true;
      for (const actionResult of actionResults) {
        if (actionResult?.results?.length) {
          for (const result of actionResult.results) {
            const {resultId, nextActions} = result;
            if (!resultId) {
              return false;
            } else if (nextActions?.length) {
              for (const nextAction of nextActions) {
                if (
                  !nextAction.actionId ||
                  nextAction.type === undefined ||
                  nextAction.delayType === undefined ||
                  !nextAction.delayValue === undefined
                ) {
                  return false;
                }
              }
            }
          }
        } else {
          return true;
        }
      }
      return true;
    } catch (e) {
      console.log(e);
      return true;
    }
  }

  onSaveChainAct() {
    console.log(this.validateBeforeSubmit());
    // if (!this.validateBeforeSubmit()) return;
    const body = this.detailChain?.actionResults?.map((actResult) => {
      return {
        results: actResult.results,
        id: actResult.id,
      };
    }) as unknown as IBulkUpdateChainActResult;
    this.loading.submit = true;
    // this.autoTaskService.chainActResult
    //   .updateMany(body)
    //   .pipe()
    //   .subscribe({
    //     next: (res) => {
    //       if (res.status === 200) {
    //         this.commonService.handleResSuccess('update');
    //       } else {
    //         this.commonService.handleResErr(res);
    //       }
    //     },
    //     error: (err) => {
    //       this.commonService.handleErr(err);
    //     },
    //   });
  }

  handleNavigate() {
    const url = `${environment.urlDomain}/${this.currentBiz}/config/data`;
    window.open(url, '_blank');
  }

  dropRow(value: any) {}

  handleAddResult(actResult: IChainActResult, index: number) {
    this.detailChain?.actionResults[index].results.push({
      resultId: undefined,
      nextActions: [
        {
          type: undefined,
          delayType: undefined,
          delayValue: undefined,
          actionId: undefined,
        },
      ],
    });
  }

  handleAddNextAction(actResult: IChainActResult, index: number) {
    this.selectedResulRowId = actResult.id;
    this.selectedResulRowIndex = index;
    this.resultsInRow =
      this.detailChain?.actionResults[index].results
        ?.map((result) => {
          return {
            id: result.resultId || '',
            name:
              this.results.rows.find(
                (element) => element.id === result.resultId,
              )?.name || '',
          };
        })
        .filter((el) => !!el.id) || [];
    this.addNextActionModalRef = this.modalService.show(
      this.templateAddNextAction,
      {
        class: '',
      },
    );
    this.addNextActionModalRef?.onHide?.pipe().subscribe(() => {
      this.selectedResulRowId = undefined;
      this.selectedResulRowIndex = undefined;
      this.resultsInRow = [];
      this.addNextActionForm.patchValue({
        resultId: null,
      });
    });
  }

  removeNextAction(chainResult: IChainResult, index: number) {
    chainResult?.nextActions?.splice(index, 1);
  }

  getResult() {
    this.results.loading = true;
    this.autoTaskService.actionResult
      .get(this.results.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.results.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.results.rows = uniqBy(
              this.results.rows.concat(res.data),
              'id',
            );
            this.results.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.results.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.results.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getAction() {
    this.actions.loading = true;
    this.autoTaskService.action
      .get(this.actions.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.actions.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.actions.rows = uniqBy(
              this.actions.rows.concat(res.data),
              'id',
            );
            this.actions.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.actions.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actions.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  handleLoadMore(key: 'action' | 'result') {
    if (key === 'action') {
      if (this.actions.isAllowLoadMore) {
        this.actions.paramsQuery!.page! += 1;
        this.getAction();
      }
    }
    if (key === 'result') {
      if (this.results.isAllowLoadMore) {
        this.results.paramsQuery!.page! += 1;
        this.getResult();
      }
    }
  }

  onSubmitModal() {
    if (this.addNextActionForm.invalid) return;
    this.submittedModal = true;
    const {resultId} = this.addNextActionForm.value;
    console.log(resultId);
    this.addNextActionModalRef?.hide();
    // this.detailChain?.actionResults[this.selectedResulRowIndex!].results
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
