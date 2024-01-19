import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';
import {Subject} from 'rxjs';
import {EActionType, IChainResult, ITaskChainResult} from '@app/types/flow';
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
      // value.nextActions?.forEach((nextAction) => {
      //   const nextActionForm = this.fb.group({
      //     addNewChain: nextAction.addNewChain,
      //     callBlockAutomation: nextAction.callBlockAutomation,
      //     delayType: nextAction.delayType,
      //     moveToAction: nextAction.moveToAction,
      //     nextAction: nextAction.nextAction,
      //     type: nextAction.type,
      //   });
      //   (<FormArray>this.formItem.controls.nextActions).push(nextActionForm);
      // });
    } else {
      this.formTaskChainResults().at(taskChainResultIndex).patchValue({
        resultIndex: undefined,
      });
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
