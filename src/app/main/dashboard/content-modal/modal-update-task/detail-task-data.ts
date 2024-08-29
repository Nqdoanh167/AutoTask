import {BaseComponentsComponent} from '@share/common/base-components/base-components.component';
import {inject} from '@angular/core';
import {BehaviorSubject, finalize, takeUntil} from 'rxjs';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {cloneDeep, uniqBy} from 'lodash';
import {
  EntityPagination,
  FlatBranch,
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
  ITag,
  Order,
} from '@app/types/viewmodels';
import {
  IAction,
  IActResult,
  IChainAct,
  ITask,
  ITaskChain,
} from '@app/types/flow';
import {ISetting, ISource} from '@app/types/setting';
import {IBlockAutomation} from '@app/types/automation';
import {AutomationService} from '@app/services/api/automation.service';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {calculateTime} from '@app/utils/common';
import moment from 'moment/moment';
import {ETabTaskDetail} from '@app/types/task';

export class DetailTaskData extends BaseComponentsComponent {
  protected autoTaskService = inject(AutoTaskService);
  protected commonService = inject(CommonService);
  protected automationService = inject(AutomationService);
  protected fb = inject(FormBuilder);

  protected detailTask?: ITask;
  protected submitted = false;
  protected updateForm = this.fb.group({
    name: [null, [Validators.required]],
    note: null,
    code: null,
    leadDeal: this.fb.group({
      id: null,
      type: 'LEAD',
      name: [null, [Validators.required]],
      picture: null,
      gender: 'other',
      phone: null,
      email: null,
      address: null,
      street: null,
      tags: null,
      ward: null,
      wardCode: null,
      district: null,
      districtCode: null,
      province: null,
      provinceCode: null,
    }),
    tags: null,
    taskChains: this.fb.array([]),
    cart: this.fb.group({
      products: null,
      courseEvents: null,
      beautyServices: null,
      warehouses: null,
      prepaidCards: null,
      combos: null,
    }),
    counselorId: null,
    teams: this.fb.array([]),
    sourceId: null,
    sourceForm: null,
    addChainActIds: null,
    branch: [null],
    chatLink: null,
  });
  protected addTaskChainForm = this.fb.group({
    addChainActIds: [null, [Validators.required]],
  });
  protected loading = {
    submit: false,
    data: false,
    getDetail: false,
    addTaskChain: false,
    createOrder: false,
    deleteTask: false,
    modal: false,
  };
  protected tags: EntityPagination<ITag> = {
    rows: [],
    loading: false,
  };
  protected orders: EntityPagination<Order> = {
    rows: [],
    loading: false,
  };
  protected results: ICommonDataLazy<IActResult, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  protected sources: ICommonDataLazy<ISource, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  protected actions: ICommonDataLazy<IAction, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  protected blocks: ICommonDataLazy<IBlockAutomation, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
    },
    isAllowLoadMore: false,
  };

  protected actionChains: ICommonDataLazy<IChainAct, IQueryBase> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 100,
      sort: '-createdAt',
      filter: JSON.stringify({isActive: true}),
    },
    isAllowLoadMore: false,
  };

  protected dataSource: ICommonDataSource<any, any> = {
    rows: [],
    loading: false,
    paramsQuery: {
      page: 1,
      limit: 20,
      sort: '-createdAt',
    },
    total: 0,
  };
  protected autoTaskSetting!: ISetting;
  protected activeTab = ETabTaskDetail.INFO;
  protected tabs = [
    {
      label: 'Thông tin',
      value: ETabTaskDetail.INFO,
    },
    {
      label: 'Đơn hàng & Sản phẩm',
      value: ETabTaskDetail.ORDER,
    },
  ];

  public infoUnit$ = new BehaviorSubject<FlatBranch | undefined>(undefined);

  constructor() {
    super();
  }

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  get formTaskChains() {
    return <FormArray>this.updateForm.get('taskChains');
  }
  get formTeams() {
    return <FormArray>this.updateForm.get('teams');
  }

  formTaskChainResults(chainIndex: number) {
    return (<FormArray>(
      this.formTaskChains.at(chainIndex).get('taskChainResults')
    )) as FormArray;
  }

  formTaskChainResultItem(chainIndex: number, taskChainResultIndex: number) {
    return (<FormGroup>(
      this.formTaskChainResults(chainIndex).at(taskChainResultIndex)
    )) as FormGroup;
  }

  formNextSteps(chainIndex: number, taskChainResultIndex: number) {
    return (<FormArray>(
      this.formTaskChainResults(chainIndex)
        .at(taskChainResultIndex)
        .get('nextActions')
    )) as FormArray;
  }

  findTag(tagId: string) {
    return this.tags.rows.find((tag) => tag.id === tagId);
  }

  get formLeadDeal() {
    return <FormGroup>this.updateForm.get('leadDeal');
  }

  get fAddChainModal(): {[key: string]: AbstractControl} {
    return this.addTaskChainForm.controls;
  }

  mappingTeams() {
    this.formTeams.clear();
    this.autoTaskSetting?.roles?.forEach((role) => {
      const findRole = this.currentBiz!.roles.find((r) => r.id === role);
      let initTeam = null;
      if (
        !this.detailTask &&
        findRole?.id === this.autoTaskSetting.assignRole
      ) {
        initTeam = {
          userId: this.currentBiz!.user.id,
          userName: this.currentBiz!.user.name,
          userPicture: this.currentBiz!.user.picture,
          userEmail: this.currentBiz!.user.email,
        };
      }

      const findTeam = this.detailTask?.teams?.find(
        (team) => team.roleId === role,
      );

      this.formTeams.push(
        this.fb.group({
          roleId: findRole?.id,
          roleIcon: findRole?.icon,
          roleName: findRole?.name,
          userId: initTeam?.userId || findTeam?.userId || null,
          userName: initTeam?.userName || findTeam?.userName || null,
          userPicture: initTeam?.userPicture || findTeam?.userPicture || null,
          userEmail: initTeam?.userEmail || findTeam?.userEmail || null,
        }),
      );
    });
  }

  getInfoUnit(id?: string | null) {
    this.infoUnit$.next(this.authService.getInfoInUnit(id));
  }

  handleCancelUpdateChain(
    chainIndex: number,
    taskChainResultIndex: number,
    staticDataChainItem: ITaskChain,
  ) {
    try {
      const item = staticDataChainItem.taskChainResults[taskChainResultIndex];
      item['isEdit'] = false;
      this.formTaskChainResultItem(chainIndex, taskChainResultIndex).patchValue(
        {
          ...item,
          note: item.note || null,
        },
      );
    } catch (e) {
      console.log(e);
    }
  }

  patchForm(dataSource?: ITask) {
    try {
      this.detailTask = dataSource && cloneDeep(dataSource);
      this.mappingTeams();
      if (!dataSource) return;
      if (dataSource.branch) {
        const {branch} = dataSource;
        this.getInfoUnit(branch?.team || branch?.department || branch?.id);
      }
      if (dataSource.orderIds?.length > 0) {
        this.getOrderDetail(dataSource.orderIds);
      }
      if (!this.tabs.find((tab) => tab.value === ETabTaskDetail.HISTORY)) {
        this.tabs = [
          ...this.tabs,
          {
            label: 'Lịch sử',
            value: ETabTaskDetail.HISTORY,
          },
        ];
      }

      this.updateForm.patchValue({
        ...dataSource,
        leadDeal: {
          ...dataSource?.leadDeal,
          id: dataSource?.leadDeal?.id,
        },
        counselorId: dataSource?.counselor?.id,
        teams: null,
      } as any);
      if (dataSource.branch) {
        const foundUnit = this.autoTaskService.findUnitFromData(
          dataSource.branch,
        );
        this.updateForm.patchValue({
          branch: foundUnit as any,
        });
      }
      if (dataSource.tags?.length) {
        if (dataSource.tags.every((tag) => typeof tag === 'object')) {
          this.updateForm.patchValue({
            tags: dataSource.tags?.map((tag) => tag.id),
          } as any);
        }
      }
      this.formTaskChains.clear();
      dataSource.taskChains?.forEach((taskChain) => {
        const taskChainForm = this.fb.group({
          id: taskChain.id,
          name: taskChain.name,
          status: taskChain.status,
          chainActId: taskChain.chainActId,
          taskChainResults: this.fb.array([]),
        });
        taskChain.taskChainResults?.forEach((taskChainResult) => {
          let deadlineDay = 0;
          let deadlineHour = 0;
          let deadlineMinute = 0;
          let typeOverDeadline = 'notOver';
          if (taskChainResult.deadlineDate) {
            const executedDate = taskChainResult.executedDate || new Date();
            const subDate = calculateTime(
              taskChainResult.deadlineDate,
              executedDate,
              'metrics',
            ) as {days?: number; hours?: number; minutes?: number};
            if (
              subDate.days === 0 &&
              subDate.hours === 0 &&
              subDate.minutes === 0
            ) {
              typeOverDeadline = 'now';
            } else if (
              moment(executedDate).isAfter(taskChainResult.deadlineDate)
            ) {
              typeOverDeadline = 'over';
            }
            if (typeOverDeadline !== 'over') {
              deadlineDay = subDate.days || 0;
              deadlineHour = subDate.hours || 0;
              deadlineMinute = subDate.minutes || 0;
            }
          }
          const resultIndex = taskChainResult.results?.findIndex(
            (result) => result.result?.id === taskChainResult.result?.id,
          );
          const reasonIndex = taskChainResult.action?.reasons?.findIndex(
            (reason) => reason?.id === taskChainResult?.reason?.id,
          );
          const taskChainResultForm = this.fb.group({
            id: taskChainResult?.id,
            status: taskChainResult?.status,
            deadlineDate: taskChainResult.deadlineDate,
            executedDate: taskChainResult.executedDate,
            deadlineDay: deadlineDay,
            deadlineHour: deadlineHour,
            deadlineMinute: deadlineMinute,
            reasonEditedDate: this.fb.group({
              reason: null,
            }),
            reasonEditedDates: this.fb.array([]),
            typeOverDeadline: typeOverDeadline,
            action: this.fb.group({
              id: taskChainResult?.action?.id,
              name: taskChainResult?.action?.name,
              type: taskChainResult?.action?.type,
              reasons: this.fb.array([]),
              callBlockAutomation: this.fb.group({
                blockId: taskChainResult?.action?.callBlockAutomation?.blockId,
              }),
            }),
            resultIndex: resultIndex >= 0 ? resultIndex : null,
            reasonIndex:
              reasonIndex !== undefined && reasonIndex >= 0
                ? reasonIndex
                : null,
            note: taskChainResult.note,
            result: this.fb.group({
              id: taskChainResult?.result?.id,
              name: taskChainResult?.result?.name,
            }),
            reason: this.fb.group({
              id: taskChainResult?.reason?.id,
              name: taskChainResult?.reason?.name,
            }),
            results: this.fb.array([]),
            nextActions: this.fb.array([]),
            isEdit: false,
          });
          taskChainResult?.reasonEditedDate?.forEach((reasonEditedDate) => {
            const reasonEditedDateForm = this.fb.group({
              editedDate: reasonEditedDate.editedDate,
              deadDate: reasonEditedDate.deadDate,
              newDate: reasonEditedDate.newDate,
              reason: reasonEditedDate.reason,
              editedBy: reasonEditedDate.editedBy,
            });
            (<FormArray>taskChainResultForm.controls.reasonEditedDates).push(
              reasonEditedDateForm,
            );
          });
          taskChainResult?.action?.reasons?.forEach((reason) => {
            const reasonForm = this.fb.group({
              id: reason.id,
              name: reason.name,
            });
            (<FormArray>(
              (<FormGroup>taskChainResultForm.controls.action).controls[
                'reasons'
              ]
            )).push(reasonForm);
          });
          taskChainResult.results?.forEach((result) => {
            const resultForm = this.fb.group({
              result: this.fb.group({
                id: result.result?.id,
                name: result.result?.name,
              }),
              nextActions: this.fb.array([]),
            });
            result.nextActions?.forEach((nextAction) => {
              const nextActionForm = this.fb.group({
                addNewChain: nextAction.addNewChain,
                callBlockAutomation: nextAction.callBlockAutomation,
                closeCloneTask: [nextAction.closeCloneTask],
                delayType: nextAction.delayType,
                delayValue: nextAction.delayValue,
                moveToAction: nextAction.moveToAction,
                nextAction: nextAction.nextAction,
                type: nextAction.type,
                status: nextAction.status,
              });
              (<FormArray>resultForm.controls.nextActions).push(nextActionForm);
            });
            (<FormArray>taskChainResultForm.controls.results).push(resultForm);
          });
          (<FormArray>taskChainForm.controls.taskChainResults).push(
            taskChainResultForm,
          );

          taskChainResult.nextActions?.forEach((nextAction) => {
            const nextActionForm = this.fb.group({
              action: nextAction.action,
              deadlineDate: nextAction.deadlineDate,
              status: nextAction.status,
              executedDate: nextAction.executedDate,
              childNextAction: this.fb.group({
                delayType: nextAction?.childNextAction?.delayType,
                moveToAction: nextAction?.childNextAction?.moveToAction,
                callBlockAutomation:
                  nextAction?.childNextAction?.callBlockAutomation,
                closeCloneTask: [nextAction?.childNextAction?.closeCloneTask],
                addNewChain: nextAction?.childNextAction?.addNewChain,
                nextAction: nextAction?.childNextAction?.nextAction,
                type: nextAction?.childNextAction?.type,
                delayValue: nextAction?.childNextAction?.delayValue,
              }),
            });
            (<FormArray>taskChainResultForm.controls.nextActions).push(
              nextActionForm,
            );
          });
        });
        (<FormArray>this.updateForm.controls.taskChains).push(taskChainForm);
      });
      this.loading.modal = false;
    } catch (e) {
      console.log(e);
    }
  }

  getTag() {
    this.autoTaskService.tag
      .get()
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.tags.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getOrderDetail(orderIds: string[]) {
    this.autoTaskService.task
      .retrieveOrdersByTask({orderIds: orderIds})
      .subscribe({
        next: (res) => {
          if (res && res.status === 200) {
            this.orders.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => {
          this.commonService.handleErr(err);
        },
      });
  }

  getActionChain() {
    this.actionChains.loading = true;
    this.autoTaskService.chainAction
      .get(this.actionChains.paramsQuery)
      .pipe(
        finalize(() => (this.actionChains.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
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

  getSource() {
    this.sources.loading = true;
    this.autoTaskService.source
      .get(this.sources.paramsQuery)
      .pipe(
        finalize(() => (this.sources.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.sources.rows = uniqBy(
              this.sources.rows.concat(res.data),
              'id',
            );
            this.sources.isAllowLoadMore = res.meta
              ? res.meta.currentPage < res.meta.totalPage
              : false;
          } else {
            this.commonService.handleResErr(res);
            this.sources.isAllowLoadMore = false;
          }
        },
        error: (err) => {
          this.sources.isAllowLoadMore = false;
          this.commonService.handleErr(err);
        },
      });
  }

  getResult() {
    this.results.loading = true;
    this.autoTaskService.actionResult
      .get(this.results.paramsQuery)
      .pipe(
        finalize(() => (this.results.loading = false)),
        takeUntil(this.destroy$),
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
        finalize(() => (this.actions.loading = false)),
        takeUntil(this.destroy$),
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

  getAutoTaskSetting() {
    return this.autoTaskService.setting.retrieve({bizId: this.currentBiz?.id});
  }
}
