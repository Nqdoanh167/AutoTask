import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';
import {Subject} from 'rxjs';
import {
  EActionType,
  ENextStepType,
  EStatusTaskChainResult,
  ETaskChainResultType,
  IChainResult,
} from '@app/types/flow';
import {calculateTime} from '@app/utils/common';

@Component({
  selector: 'app-task-chain-item',
  templateUrl: './task-chain-item.component.html',
  styleUrls: ['./task-chain-item.component.scss'],
})
export class TaskChainItemComponent implements OnDestroy, OnInit {
  @Input() formItem!: FormGroup | any;
  @Input() submitted: boolean = false;

  private destroy$ = new Subject();
  protected readonly EActionType = EActionType;
  protected readonly ENextStepType = ENextStepType;
  protected readonly today = new Date();

  constructor(
    private rootFormGroup: FormGroupDirective,
    private readonly fb: FormBuilder,
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
    console.log(value);
  }

  handleSaveTaskChainResult(taskChainResultIndex: number) {
    console.log(this.formTaskChainResults().at(taskChainResultIndex).value);
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
