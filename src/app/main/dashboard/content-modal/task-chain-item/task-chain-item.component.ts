import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';
import {Subject} from 'rxjs';
import {EActionType} from '@app/types/flow';
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

  constructor(private rootFormGroup: FormGroupDirective) {}

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
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
