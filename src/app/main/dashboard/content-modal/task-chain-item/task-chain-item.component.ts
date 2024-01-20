import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';
import {finalize, Subject} from 'rxjs';
import {
  EActionType,
  EDelayType,
  ENextStepType,
  EStatusTaskChainResult,
  ETaskChainType,
  IActResult,
  IChainAct,
  IChainResult,
  ITaskChainResult,
} from '@app/types/flow';
import {calculateTime} from '@app/utils/common';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IBlockAutomation} from '@app/types/automation';
import {BsModalService} from 'ngx-bootstrap/modal';
import moment from 'moment/moment';

@Component({
  selector: 'app-task-chain-item',
  templateUrl: './task-chain-item.component.html',
  styleUrls: ['./task-chain-item.component.scss'],
})
export class TaskChainItemComponent implements OnDestroy, OnInit {
  @Input() formItem!: FormGroup | any;
  @Input() submitted: boolean = false;
  @Input() results: IActResult[] = [];
  @Input() blocks: IBlockAutomation[] = [];
  @Input() actionChains: IChainAct[] = [];
  @Input() loadingData = {
    results: false,
    blocks: false,
    actionChains: false,
  };

  @Output() updateNextStepEvent = new EventEmitter<{
    taskChainResultIndex: number;
    value?: any;
  }>();

  public loading = {
    submit: false,
  };
  protected readonly ETaskChainType = ETaskChainType;

  private destroy$ = new Subject();
  protected readonly EActionType = EActionType;
  protected readonly ENextStepType = ENextStepType;
  protected readonly today = new Date();

  constructor(
    private rootFormGroup: FormGroupDirective,
    private readonly fb: FormBuilder,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly modalService: BsModalService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.formItem.controls;
  }

  formTaskChainResults() {
    return (<FormArray>this.formItem.get('taskChainResults')) as FormArray;
  }

  formNextSteps(taskChainResultIndex: number) {
    return (<FormArray>(
      this.formItem
        .get('taskChainResults')
        .at(taskChainResultIndex)
        .get('nextActions')
    )) as FormArray;
  }

  ngOnInit(): void {}

  handleChangeTaskChainResult(
    taskChainResultIndex: number,
    value: IChainResult,
  ) {
    if (value) {
      try {
        const results = this.formTaskChainResults()
          .at(taskChainResultIndex)
          .get('results')?.value;

        const resultIndex = results.findIndex((result: IChainResult) => {
          return result.result?.id === value.result?.id;
        });

        this.formTaskChainResults()
          .at(taskChainResultIndex)
          .get('result')
          ?.patchValue({
            name: value.result?.name,
          });

        this.formTaskChainResults().at(taskChainResultIndex).patchValue({
          resultIndex,
        });
        (<FormArray>(
          this.formTaskChainResults()
            .at(taskChainResultIndex)
            .get('nextActions')
        )).clear();
        value.nextActions?.forEach((nextAction) => {
          const delayDate = new Date();
          const executedDate = new Date();
          const action = {};
          const nextActionForm = this.fb.group({
            action: action,
            deadlineDate: delayDate,
            status: EStatusTaskChainResult.UNDONE,
            executedDate: executedDate,
            childNextAction: nextAction,
          });
          (<FormArray>(
            this.formTaskChainResults()
              .at(taskChainResultIndex)
              .get('nextActions')
          )).push(nextActionForm);
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      this.formTaskChainResults().at(taskChainResultIndex).patchValue({
        resultIndex: undefined,
      });
      (<FormArray>(
        this.formTaskChainResults().at(taskChainResultIndex).get('nextActions')
      )).clear();
    }
  }
  handleChangeTaskChainReason(
    taskChainResultIndex: number,
    value: {id: string; name: string},
  ) {
    if (value) {
      const reasons =
        this.formTaskChainResults().at(taskChainResultIndex)?.value?.action
          ?.reasons || [];

      this.formTaskChainResults()
        .at(taskChainResultIndex)
        .get('reason')
        ?.patchValue({
          name: value?.name,
        });

      const reasonIndex = reasons.findIndex((reason: any) => {
        return reason?.id === value?.id;
      });
      this.formTaskChainResults().at(taskChainResultIndex).patchValue({
        reasonIndex,
      });
    } else {
      this.formTaskChainResults().at(taskChainResultIndex).patchValue({
        reasonIndex: undefined,
      });
    }
  }

  handleSaveTaskChainResult(
    taskChainResultIndex: number,
    taskChainResult: ITaskChainResult,
  ) {
    if (!taskChainResult.id) return;
    const {note, resultIndex, reasonIndex, nextActions} =
      this.formTaskChainResults().at(taskChainResultIndex).value;
    const modifiedNextActions = nextActions.map((nextAction: any) => {
      if (nextAction?.childNextAction) {
        const modify = {
          callBlockAutomation: nextAction?.childNextAction?.callBlockAutomation
            ? nextAction?.childNextAction?.callBlockAutomation
            : null,
          moveToAction: nextAction?.childNextAction?.moveToAction
            ? nextAction?.childNextAction?.moveToAction
            : null,
          addNewChain: nextAction?.childNextAction?.addNewChain
            ? nextAction?.childNextAction?.addNewChain
            : null,
          nextAction: nextAction?.childNextAction?.nextAction,
        };
        return {
          ...nextAction,
          ...nextAction.childNextAction,
          ...modify,
        };
      }
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
    });
    const body = {
      note,
      resultIndex: resultIndex || resultIndex === 0 ? resultIndex : null,
      reasonIndex: reasonIndex || reasonIndex === 0 ? reasonIndex : null,
      nextActions: modifiedNextActions,
    };
    this.loading.submit = true;
    this.autoTaskService.taskChainResult
      .update(taskChainResult.id, body)
      .pipe(finalize(() => (this.loading.submit = false)))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.commonService.handleResSuccess('update');
            if (res.data.executedDate) {
              this.formTaskChainResults().at(taskChainResultIndex).patchValue({
                executedDate: res.data.executedDate,
              });
            }
          } else {
            this.commonService.handleResErr(res);
          }
        },
        error: (err) => this.commonService.handleErr(err),
      });
  }

  renderNextStepData(nextStep: ITaskChainResult) {
    let string = '';
    switch (nextStep.childNextAction?.nextAction) {
      case ENextStepType.CALL_BLOCK_AUTOMATION:
        string += 'Gọi Automation Block';
        break;
      case ENextStepType.CREATE_ORDER:
        string += 'Tạo đơn hàng';
        break;
      case ENextStepType.ADD_CHAIN:
        string += 'Thêm chuỗi mới';
        break;
      case ENextStepType.CONTINUE_TO_NEXT_ACTION:
        string += 'HĐ tiếp trong chuỗi';
        break;
      case ENextStepType.CLOSE_CHAIN:
        string += 'Đóng chuỗi';
        break;
      default:
        string += '-';
        break;
    }
    if (nextStep.childNextAction.callBlockAutomation?.blockId) {
      const block = this.blocks.find(
        (block) =>
          block.id === nextStep.childNextAction.callBlockAutomation?.blockId,
      );
      string += `: <b>${block?.name}</b>`;
    }
    if (nextStep.childNextAction?.moveToAction?.chainActResult) {
      string +=
        ': ' +
        `<b>${
          nextStep.childNextAction?.moveToAction?.chainActResult?.action
            ?.name || ''
        }</b>`;
    }
    if (
      nextStep.childNextAction?.addNewChain?.chain &&
      nextStep.childNextAction?.addNewChain?.chainActResult
    ) {
      string += `: <b>${nextStep.childNextAction?.addNewChain?.chainActResult?.action?.name} (${nextStep.childNextAction?.addNewChain?.chain?.name})</b>`;
    }
    if (nextStep.childNextAction?.delayType) {
      switch (nextStep.childNextAction?.delayType) {
        case EDelayType.DAY:
          string += ` (sau ${nextStep.childNextAction?.delayValue} ngày)`;
          break;
        case EDelayType.HOUR:
          string += ` (sau ${nextStep.childNextAction?.delayValue} giờ)`;
          break;
        case EDelayType.MINUTE:
          string += ` (sau ${nextStep.childNextAction?.delayValue} phút)`;
          break;
        default:
          string += '';
          break;
      }
    }
    return string;
  }

  handleUpdateNextStep(taskChainResultIndex: number, value?: any) {
    this.updateNextStepEvent.emit({taskChainResultIndex, value});
  }

  renderDeadline(value: Date, executedDate?: Date) {
    if (executedDate) {
      return calculateTime(value, executedDate) as string;
    }
    return calculateTime(value, new Date()) as string;
  }

  handleChangeDeadline(taskChainResultIndex: number) {
    const {deadlineDay, deadlineHour, deadlineMinute, deadlineDate} =
      this.formTaskChainResults().at(taskChainResultIndex).value;
    console.log({deadlineDay, deadlineHour, deadlineMinute, deadlineDate});
    // create newDeadlineDate equal deadlineDate plush deadlineDay, deadlineHour, deadlineMinute
    const newDeadlineDate = new Date();
    let typeOverDeadline = 'notOver';
    newDeadlineDate.setDate(newDeadlineDate.getDate() + deadlineDay);
    newDeadlineDate.setHours(newDeadlineDate.getHours() + deadlineHour);
    newDeadlineDate.setMinutes(newDeadlineDate.getMinutes() + deadlineMinute);
    const subDate = calculateTime(newDeadlineDate, deadlineDate, 'metrics') as {
      days?: number;
      hours?: number;
      minutes?: number;
    };
    if (subDate.days === 0 && subDate.hours === 0 && subDate.minutes === 0) {
      typeOverDeadline = 'now';
    } else if (moment(deadlineDate).isAfter(newDeadlineDate)) {
      typeOverDeadline = 'over';
    }
    console.log(newDeadlineDate);
    // this.formTaskChainResults()
    //   .at(taskChainResultIndex)
    //   .patchValue({typeOverDeadline});
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
