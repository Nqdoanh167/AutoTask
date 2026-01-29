import {inject} from '@angular/core';
import {BehaviorSubject, finalize, takeUntil} from 'rxjs';
import {cloneDeep, template, uniqBy} from 'lodash';
import {
  EntityPagination,
  FlatBranch,
  ICommonDataLazy,
  ICommonDataSource,
  IQueryBase,
  Order,
} from '@app/types/viewmodels';
import {EChainNextActionType, ITask, ITaskChain} from '@app/types/flow';
import {IBlockAutomation} from '@app/types/automation';
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
import {DashboardData} from '../../dashboard-data';

export class DetailTaskData extends DashboardData {
  protected fb = inject(FormBuilder);

  protected detailTask?: ITask;
  protected submitted = false;
  protected updateForm = this.fb.group({
    id: null,
    name: [null, [Validators.required]],
    note: null,
    code: null,
    leadDeal: this.fb.group({
      id: null,
      type: 'LEAD',
      name: [null],
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
      leadStatusId: null,
      leadTags: null,
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
    platformSourceIds: [null],
    platformSources: [null],
    isTaskClosed: false,
    closeTaskResult: null,
    closeTaskReason: null,
    leadId: null,
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
    deleteChainTask: false,
    closeChainTask: false,
    getOrderDetail: false,
  };

  protected orders: EntityPagination<Order> = {
    rows: [],
    loading: false,
  };

  protected bookings: EntityPagination<any> = {
    rows: [],
    loading: false,
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
    // {
    //   label: 'Đơn booking',
    //   value: ETabTaskDetail.BOOKING,
    // },
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
      if (!dataSource) {
        let branch = this.autoTaskService.getFirstUnit();
        if (this.currentActiveViewMode?.options?.branchIds) {
          const branchUnit = this.autoTaskService.getFirstUnitByIds(
            this.currentActiveViewMode.options.branchIds,
          );
          if (branchUnit) {
            branch = branchUnit;
          }
        }
        this.getInfoUnit(branch?.team || branch?.department || branch?.id);
        this.updateForm.patchValue({
          branch,
        } as any);
        return;
      }
      if (dataSource.branch) {
        const {branch} = dataSource;
        this.getInfoUnit(branch?.team || branch?.department || branch?.id);
      }
      // if (dataSource.orderIds?.length > 0) {
      //   this.getOrderDetail(dataSource.orderIds);
      // }
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
        this.clickLoadData('tags');
        if (dataSource.tags.every((tag) => typeof tag === 'object')) {
          this.updateForm.patchValue({
            tags: this.tags.rows.filter(
              (tag) => dataSource.tags?.some((t) => t === tag.id),
            ),
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
            orders: this.fb.array([]),
            feedbacks: this.fb.array([]),
            bookings: this.fb.array([]),
            subActions: this.fb.array([]),
            type: taskChainResult?.type,
          });

          taskChainResult?.orders?.forEach((order) => {
            const orderForm = this.fb.group({
              id: order.id,
              code: order.code,
              subActionId: order.subActionId,
            });
            (<FormArray>taskChainResultForm.controls.orders).push(orderForm);
          });
          taskChainResult?.feedbacks?.forEach((feedback) => {
            const feedbackForm = this.fb.group({
              id: feedback.id,
              rate: feedback.rate,
              comment: feedback.comment,
              subActionId: feedback.subActionId,
            });
            (<FormArray>taskChainResultForm.controls.feedbacks).push(
              feedbackForm,
            );
          });

          taskChainResult?.bookings?.forEach((booking) => {
            const bookingForm = this.fb.group({
              id: booking.id,
              title: booking.title,
              subActionId: booking.subActionId,
            });
            (<FormArray>taskChainResultForm.controls.bookings).push(
              bookingForm,
            );
          });

          taskChainResult?.subActions?.forEach((subAction) => {
            const subActionForm = this.fb.group({
              id: subAction.id,
              name: subAction.name,
              type: subAction.type,
              callBlockAutomation: subAction.callBlockAutomation,
              templateId: subAction.templateId,
            });
            (<FormArray>taskChainResultForm.controls.subActions).push(
              subActionForm,
            );
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
                closeTaskResult: nextAction.closeTaskResult,
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
                closeTaskResult: [nextAction?.childNextAction?.closeTaskResult],
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

  getOrderDetail(orderIds: string[]) {
    if (this.loading.getOrderDetail || !orderIds || orderIds.length === 0) {
      return;
    }
    this.loading.getOrderDetail = true;
    this.autoTaskService.task
      .retrieveOrdersByTask({orderIds: orderIds})
      .pipe(finalize(() => (this.loading.getOrderDetail = false)))
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

  getBookingDetail(bookingIds: string[]) {
    this.autoTaskService.task.retrieveBookingsByTask({bookingIds}).subscribe({
      next: (res) => {
        if (res && res.status === 200) {
          this.bookings.rows = res.data;
        } else {
          this.commonService.handleResErr(res);
        }
      },
      error: (err) => {
        this.commonService.handleErr(err);
      },
    });
  }

  getBlock() {
    this.automationService.block
      .getMany({}, {cache: true})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.blocks.rows = res.data;
          } else {
            this.commonService.handleResErr(res);
          }
        },
      });
  }
}
