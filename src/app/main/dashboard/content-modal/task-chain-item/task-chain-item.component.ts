import {Component, Input, OnDestroy, OnInit} from '@angular/core';
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
  IActResult,
  IChainAct,
  IChainResult,
  ITaskChainResult,
} from '@app/types/flow';
import {calculateTime} from '@app/utils/common';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {IBlockAutomation} from '@app/types/automation';

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

  public loading = {
    submit: false,
  };

  private destroy$ = new Subject();
  protected readonly EActionType = EActionType;
  protected readonly ENextStepType = ENextStepType;
  protected readonly today = new Date();

  constructor(
    private rootFormGroup: FormGroupDirective,
    private readonly fb: FormBuilder,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
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

  ngOnInit(): void {
    console.log('actionChains', this.actionChains);
  }

  ngOnChanges(changes: any): void {}

  renderDeadline(value: Date) {
    return calculateTime(value, new Date()) as string;
  }

  handleChangeTaskChainResult(
    taskChainResultIndex: number,
    value: IChainResult,
  ) {
    if (value) {
      const results = this.formTaskChainResults()
        .at(taskChainResultIndex)
        .get('results')?.value;

      const resultIndex = results.findIndex((result: IChainResult) => {
        return result.result?.id === value.result?.id;
      });

      this.formTaskChainResults().at(taskChainResultIndex).patchValue({
        resultIndex,
      });
      try {
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
      console.log(this.formItem.value);
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
    console.log(this.formTaskChainResults().at(taskChainResultIndex).value);
    const {note, resultIndex, reasonIndex, nextActions} =
      this.formTaskChainResults().at(taskChainResultIndex).value;
    const body = {
      note,
      resultIndex: resultIndex ? resultIndex : null,
      reasonIndex: reasonIndex ? reasonIndex : null,
      nextActions,
    };
    this.loading.submit = true;
    this.autoTaskService.taskChainResult
      .update(taskChainResult.id, body)
      .pipe(finalize(() => (this.loading.submit = false)))
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
    // if (nextStep.childNextAction?.moveToAction?.chainActResultId) {
    //   console.log(this.formItem.value.id);
    //   console.log(this.actionChains);
    //   const actionChain = this.actionChains.find(
    //     (actionChain) => actionChain.id === this.formItem.value.id,
    //   );
    //   string += `: ${actionChain?.name}`;
    // }
    return string;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  protected readonly EDelayType = EDelayType;
}
