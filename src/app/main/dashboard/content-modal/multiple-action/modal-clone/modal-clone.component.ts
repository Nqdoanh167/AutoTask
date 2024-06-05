import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {Biz} from '@app/types/viewmodels';
import {AuthService} from '@app/services/api/auth.service';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {ISetting} from '@app/types/setting';
import {Router} from '@angular/router';
import {ETypeBulkUpdate} from '@app/types/common';
import {EOptionCloneTask, ITask} from '@app/types/flow';

@Component({
  selector: 'app-modal-clone',
  templateUrl: './modal-clone.component.html',
  styleUrls: ['./modal-clone.component.scss'],
})
export class ModalCloneComponent implements OnInit, OnDestroy {
  @Input() task!: ITask;
  @Output() submitEvent = new EventEmitter();
  public optionToCloneTask = [
    {
      label: 'Nguồn dữ liệu',
      value: EOptionCloneTask.SOURCE,
    },
    {
      label: 'Ghi chú',
      value: EOptionCloneTask.NOTE,
    },
    {
      label: 'Nhân sự phụ trách',
      value: EOptionCloneTask.TEAM,
    },
    {
      label: 'TAG',
      value: EOptionCloneTask.TAG,
    },
    {
      label: 'Thông tin khách hàng',
      value: EOptionCloneTask.LEADDEAL,
    },
    {
      label: 'Sản phẩm quan tâm',
      value: EOptionCloneTask.PRODUCT,
    },
  ];
  public form!: FormGroup;
  private destroy$ = new Subject();
  public biz!: Biz;
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentBiz.subscribe((biz) => {
      this.biz = biz;
    });
    this.form = this.fb.group({
      optionToClone: [
        this.optionToCloneTask.map((v) => v.value),
        Validators.required,
      ],
    });
  }
  hideModal(): void {
    this.modalRef.hide();
  }
  onSubmit() {
    this.submitEvent.emit(this.form.value.optionToClone);
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
