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
import {finalize, forkJoin, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {
  EChainNextActType,
  EDelayType,
  ENextStepType,
  IAction,
  IActResult,
  IChainAct,
  IChainActResult,
  IChainNextAction,
  IChainResult,
  IFistActionDelayDto,
  IManyUpsertChainActResultDto,
  IUpdateChainActDto,
} from '@app/types/flow';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {cloneDeep, uniqBy} from 'lodash';
import {ICommonDataLazy, IQueryBase} from '@app/types/viewmodels';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {AutomationService} from '@app/services/api/automation.service';
import {IBlockAutomation} from '@app/types/automation';

@Component({
  selector: 'app-chain-detail',
  templateUrl: './chain-detail.component.html',
  styleUrls: ['./chain-detail.component.scss'],
})
export class ChainDetailComponent implements OnDestroy, OnInit {
  @ViewChild('template') template!: TemplateRef<any>;
  @ViewChild('templateAddNextAction') templateAddNextAction!: TemplateRef<any>;

  public loading = {
    detail: false,
    submit: false,
  };
  public detailChain?: IChainAct;
  protected readonly EChainNextActType = EChainNextActType;
  protected readonly EDelayType = EDelayType;
  protected readonly ENextStepType = ENextStepType;
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
  public blocks: ICommonDataLazy<IBlockAutomation, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };
  public actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
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
  public selectedResulRowIndex?: number;
  public resultsInRow: IActResult[] = [];

  public addNextActionForm = this.fb.group({
    resultId: [null, [Validators.required]],
  });
  public nextStepTypes = this.configurationService.nextStepTypes;
  public fistActionDelay: IFistActionDelayDto = {
    delayType: undefined,
    delayValue: undefined,
  };

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
    private readonly configurationService: ConfigurationService,
    private readonly automationService: AutomationService,
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

  filterActionResults(id?: string) {
    return (
      this.detailChain?.actionResults?.filter(
        (actResult) => actResult.id !== id,
      ) || []
    );
  }

  ngOnInit() {
    this.getResult();
    this.getAction();
    this.getBlock();
    this.getActionChain();
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
            this.fistActionDelay = {
              delayType: res?.data?.fistActionDelay?.delayType,
              delayValue: res?.data?.fistActionDelay?.delayValue,
            } as IFistActionDelayDto;
            this.detailChain = {
              ...res.data,
              actionResults: res.data?.actionResults
                ?.map((actResult) => {
                  return {
                    ...actResult,
                    actionId: actResult?.action?.id,
                    chainActId: res.data.id,
                    results: actResult?.results?.map((result) => {
                      return {
                        ...result,
                        resultId: result?.result?.id,
                        nextActions: result?.nextActions?.map((nextAction) => {
                          return {
                            moveToActionId:
                              nextAction?.moveToAction?.chainActResultId,
                            addNewChainId: nextAction?.addNewChain?.chainId,
                            addNewChainActId:
                              nextAction?.addNewChain?.chainActResultId,
                            callToBlockId:
                              nextAction?.callBlockAutomation?.blockId,
                            ...nextAction,
                          };
                        }),
                      };
                    }),
                  };
                })
                .sort((a, b) => a.ordering - b.ordering),
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
      const {delayType, delayValue} = this.fistActionDelay;
      if (
        delayType !== EDelayType.NOW &&
        (delayType === undefined ||
          delayValue === undefined ||
          delayValue === null)
      ) {
        return false;
      }
      if (!actionResults?.length) return true;
      for (const actionResult of actionResults) {
        if (actionResult?.results?.length) {
          for (const result of actionResult.results) {
            const {resultId, nextActions} = result;
            if (!resultId) {
              return false;
            } else if (nextActions?.length) {
              for (const nextAction of nextActions) {
                switch (nextAction.nextAction) {
                  case ENextStepType.CONTINUE_TO_NEXT_ACTION:
                    if (!nextAction.moveToActionId) return false;
                    break;
                  case ENextStepType.ADD_CHAIN:
                    if (!nextAction.addNewChainActId) return false;
                    break;
                  case ENextStepType.CALL_BLOCK_AUTOMATION:
                    if (!nextAction.callToBlockId) return false;
                    break;
                  default:
                    break;
                }
                if (nextAction.delayType === EDelayType.NOW) {
                  if (!nextAction.nextAction || nextAction.type === undefined) {
                    return false;
                  }
                } else if (
                  !nextAction.nextAction ||
                  nextAction.type === undefined ||
                  nextAction.delayType === undefined ||
                  nextAction.delayValue === undefined
                ) {
                  return false;
                }
              }
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  onSaveChainAct() {
    if (!this.validateBeforeSubmit() || !this.detailChain?.id) return;
    const bodyUpdateResults = this.detailChain?.actionResults?.map(
      (actResult, index) => {
        return {
          results: actResult.results?.map((result) => {
            return {
              ...result,
              nextActions: result?.nextActions?.map((nextAction) => {
                const modify = {
                  callBlockAutomation: nextAction.callToBlockId
                    ? {
                        blockId: nextAction.callToBlockId,
                      }
                    : null,
                  moveToAction: nextAction.moveToActionId
                    ? {
                        chainActResultId: nextAction.moveToActionId,
                      }
                    : null,
                };
                return {
                  ...nextAction,
                  ...modify,
                };
              }),
            };
          }),
          id: actResult.id,
          ordering: index + 1,
          chainActId: this.detailChain?.id,
          actionId: actResult.actionId,
        };
      },
    ) as unknown as IManyUpsertChainActResultDto;
    const bodyDetailChain = {
      fistActionDelay: this.fistActionDelay,
    } as unknown as IUpdateChainActDto;
    this.loading.submit = true;
    this.configButtons[this.configButtons.length - 1].loading = true;
    forkJoin([
      this.autoTaskService.chainActResult.upsertMany(bodyUpdateResults),
      // this.autoTaskService.chainAction.update(
      //   this.detailChain.id!,
      //   bodyDetailChain,
      // ),
    ])
      .pipe(
        finalize(() => {
          this.loading.submit = false;
          this.configButtons[this.configButtons.length - 1].loading = false;
          this.submitted = false;
        }),
      )
      .subscribe({
        next: (res) => {
          // const responseResult = res[0];
          const responseDetail = res[0];

          // if (responseResult.status === 200 && responseDetail.status === 200) {
          //   this.commonService.handleResSuccess('update');
          // } else if (responseResult.status !== 200) {
          //   this.commonService.handleResErr(responseResult);
          // } else
          //   if (responseDetail.status !== 200) {
          //   this.commonService.handleResErr(responseDetail);
          // }

          if (responseDetail.status === 200) {
            this.commonService.handleResSuccess('update');
          } else {
            this.commonService.handleResErr(responseDetail);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleNavigate(path?: string) {
    let url = `${environment.urlDomain}/${this.currentBiz}/config/data`;
    if (path) {
      url += path;
    }
    window.open(url, '_blank');
  }

  dropRow(event: CdkDragDrop<any[]>) {
    try {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(
        this.detailChain!.actionResults,
        event.previousIndex,
        event.currentIndex,
      );
    } catch (e) {
      console.log(e);
    }
  }

  dropResultRow(event: CdkDragDrop<any[]>, array: any[]) {
    try {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(array, event.previousIndex, event.currentIndex);
    } catch (e) {
      console.log(e);
    }
  }

  handleChangeAction(selectedAction: IAction, index: number) {
    if (this.detailChain) {
      const actionIds: any[] = this.detailChain.actionResults
        .map((act) => {
          return act.action?.id;
        })
        .filter((id) => !!id);
      actionIds.push(selectedAction.id);
      const body = {
        actionIds,
      } as unknown as IUpdateChainActDto;
      this.autoTaskService.chainAction
        .update(this.detailChain.id, body)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.detailChain!.actionResults[index] = {
                ...this.detailChain!.actionResults[index],
                id: res.data.actionResults[index].id,
                action: cloneDeep(selectedAction),
              };
            } else {
              this.commonService.handleResErr(res);
            }
          },
        });
    }
  }

  newNextAction() {
    return {
      type: undefined,
      delayType: undefined,
      delayValue: undefined,
      moveToAction: {
        chainActResultId: undefined,
      },
      addNewChain: {
        chainId: undefined,
      },
      callBlockAutomation: {
        blockId: undefined,
      },
      callToBlockId: undefined,
      moveToActionId: undefined,
      addNewChainId: undefined,
    };
  }

  handleAddAction(currentIndex?: number) {
    if (currentIndex === undefined) {
      this.detailChain?.actionResults.push({
        id: undefined,
        results: [
          {
            resultId: undefined,
            nextActions: [this.newNextAction()],
          },
        ],
        ordering: this.detailChain?.actionResults.length + 1,
      });
    } else {
      if (currentIndex === -1) {
        this.detailChain?.actionResults.unshift({
          id: undefined,
          results: [
            {
              resultId: undefined,
              nextActions: [this.newNextAction()],
            },
          ],
          ordering: 1,
        });
      } else {
        this.detailChain?.actionResults.splice(currentIndex!, 0, {
          id: undefined,
          results: [
            {
              resultId: undefined,
              nextActions: [this.newNextAction()],
            },
          ],
          ordering: currentIndex! + 1,
        });
      }
    }
  }

  clearRemovedActionInChainResult(removeChainActionId: string | undefined) {
    this.detailChain?.actionResults?.map((actResult) => {
      actResult.results?.map((result) => {
        result.nextActions?.map((nextAction) => {
          if (
            nextAction.moveToActionId === removeChainActionId ||
            nextAction.addNewChainId === removeChainActionId
          ) {
            nextAction.moveToActionId = undefined;
            nextAction.addNewChainId = undefined;
          }
        });
      });
    });
  }

  handleRemoveAction(currentIndex: number, chainActResult: IChainActResult) {
    if (!this.detailChain?.id || !chainActResult.id) return;
    this.autoTaskService.chainAction
      .deleteChainAct(this.detailChain?.id, chainActResult.id!)
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.clearRemovedActionInChainResult(
              this.detailChain?.actionResults[currentIndex]?.id,
            );
            this.detailChain?.actionResults.splice(currentIndex, 1);
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  handleRemoveResult(indexAction: number, currentResultIndex: number) {
    this.detailChain?.actionResults[indexAction]?.results.splice(
      currentResultIndex,
      1,
    );
  }
  handleAddResult(
    actResult: IChainActResult,
    index: number,
    currentResultIndex?: number,
  ) {
    if (currentResultIndex === undefined) {
      this.detailChain?.actionResults[index]?.results.push({
        resultId: undefined,
        nextActions: [this.newNextAction()],
      });
    } else {
      if (currentResultIndex === -1) {
        this.detailChain?.actionResults[index]?.results.unshift({
          resultId: undefined,
          nextActions: [this.newNextAction()],
        });
      } else {
        this.detailChain?.actionResults[index]?.results?.splice(
          currentResultIndex!,
          0,
          {
            resultId: undefined,
            nextActions: [this.newNextAction()],
          },
        );
      }
    }
  }

  handleAddNextAction(
    actResult: IChainActResult,
    actionIndex: number,
    resultIndex: number,
    currentNextActionIndex?: number,
  ) {
    if (currentNextActionIndex === undefined) {
      this.detailChain?.actionResults[actionIndex]?.results?.[
        resultIndex
      ]?.nextActions.push(this.newNextAction());
    } else {
      if (currentNextActionIndex === -1) {
        this.detailChain?.actionResults[actionIndex]?.results?.[
          resultIndex
        ]?.nextActions?.unshift(this.newNextAction());
      } else {
        this.detailChain?.actionResults[actionIndex]?.results?.[
          resultIndex
        ]?.nextActions?.splice(
          currentNextActionIndex!,
          0,
          this.newNextAction(),
        );
      }
    }
  }

  removeNextAction(chainResult: IChainResult, index: number) {
    if (chainResult?.nextActions?.length <= 1) {
      chainResult.nextActions = [];
    } else {
      chainResult?.nextActions?.splice(index, 1);
    }
  }

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.actionChains.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            res.data = res.data.map((chain) => {
              return {
                ...chain,
                actionResults: chain.actionResults?.map((actResult) => {
                  return {
                    ...actResult,
                    chainAct: {
                      id: chain.id,
                      name: chain.name,
                    },
                    action: {
                      ...actResult.action,
                    },
                  };
                }),
              };
            }) as unknown as IChainAct[];
            this.actionChains.rows = uniqBy(
              this.actionChains.rows.concat(res.data),
              'id',
            );
            this.actionChains.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.actionChains.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.actionChains.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
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

  getBlock() {
    this.blocks.loading = true;
    this.automationService.block
      .getMany({})
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.blocks.loading = false)),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.blocks.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  handleLoadMore(key: 'action' | 'result' | 'actionChain') {
    if (key === 'action') {
      if (this.actions.isAllowLoadMore) {
        this.actions.paramsQuery!.page! += 1;
        this.getAction();
      }
    }
    if (key === 'actionChain') {
      if (this.actionChains.isAllowLoadMore) {
        this.actionChains.paramsQuery!.page! += 1;
        this.getActionChain();
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
    try {
      if (this.addNextActionForm.invalid) return;
      this.submittedModal = true;
      const {resultId} = this.addNextActionForm.value;
      const findResult = this.detailChain?.actionResults[
        this.selectedResulRowIndex!
      ]?.results?.find((result) => result?.resultId === resultId);
      findResult?.nextActions.push(this.newNextAction());
      this.addNextActionModalRef?.hide();
    } catch (e) {
      console.log(e);
    }
  }

  handleUpdateChain(event: any) {
    if (!this.detailChain?.id) return;
    const body = {
      isActive: event.target.checked,
    } as unknown as IUpdateChainActDto;
    this.autoTaskService.chainAction
      .update(this.detailChain?.id, body)
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

  handleChangeNextAction(nextAction: IChainNextAction) {
    nextAction.addNewChain = undefined;
    nextAction.callBlockAutomation = {
      blockId: undefined,
    };
    nextAction.moveToAction = {
      chainActResultId: undefined,
    };
    nextAction.addNewChainId = undefined;
    nextAction.addNewChainActId = undefined;
    nextAction.moveToActionId = undefined;
    nextAction.callToBlockId = undefined;
  }

  handleChangeActionFromNewChain(
    value: IChainActResult,
    nextAction: IChainNextAction,
  ) {
    nextAction.addNewChain = {
      chainId: value.chainAct?.id,
      chainActResultId: value.id,
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
