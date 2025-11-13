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
  Validators,
} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {
  EDataSourceType,
  ESourceArgKey,
  EDistributeType,
  ISetting,
  ISource,
  ISourceArgsDto,
  IUpdateSourceDto,
} from '@app/types/setting';
import {
  Biz,
  ICommonDataLazy,
  IQueryBase,
  TaskDistributionConfig,
  User,
} from '@app/types/viewmodels';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AuthService} from '@app/services/api/auth.service';
import {MainService} from '@app/services/api/main.service';
import {ToastrService} from 'ngx-toastr';
import {CommonService} from '@app/services/common/common.service';
import {uniq, uniqBy} from 'lodash';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {socialPlatforms} from '@app/variable';
import {IChainAct, ITask} from '@app/types/flow';
import {OverlayListenerOptions, OverlayOptions} from 'primeng/api';

@Component({
  selector: 'app-modal-close-multi-tasks',
  templateUrl: './modal-close-multi-tasks.component.html',
  styleUrls: ['./modal-close-multi-tasks.component.scss'],
})
export class ModalCloseMultiTasksComponent implements OnDestroy {
  @Input() taskIds!: string[];
  @Input() selectedTasks!: ITask[];
  @Output() closeTaskSuccess = new EventEmitter<{
    success: boolean;
    successIds: string[];
    failedReasons: string[];
  }>();

  private destroy$ = new Subject();

  public submitted = false;
  public closeTaskForm = this.fb.group({
    closeTaskReason: [null],
    closeTaskResult: [true, [Validators.required]],
  });
  public loading = {
    submit: false,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly mainService: MainService,
    private readonly toastr: ToastrService,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.closeTaskForm.controls;
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleCloseTask() {
    this.loading.submit = true;
    const uniqTaskIds = uniq(this.taskIds);

    if (uniqTaskIds.length > 0) {
      const body = {
        closeTaskResult: this.closeTaskForm.get('closeTaskResult')?.value,
        closeTaskReason: this.closeTaskForm.get('closeTaskReason')?.value,
      }

      if (body.closeTaskResult == null) {
        this.toastr.error('Vui lòng chọn kết quả của đóng tác vụ');
        this.loading.submit = false;
        return;
      }

      this.autoTaskService.task.bulkCloseTask(uniqTaskIds, body.closeTaskResult, body.closeTaskReason)
        .pipe(takeUntil(this.destroy$))
        .pipe(finalize(() => (this.loading.submit = false)))
        .subscribe({
          next: (res: any) => {
            if (!res.success) {
              this.toastr.warning(res.message);
              return;
            }

            this.commonService.handleResSuccess('update');
            this.closeTaskSuccess.emit({
              success: true,
              successIds: res.data.successIds || [],
              failedReasons: res.data.failedReasons || [],
            });
            this.hideModal();
          },
          error: (err) => this.commonService.handleErr(err),
        });
    } else {
      this.loading.submit = false;
      this.toastr.info('Tất cả tác vụ được chọn đã đóng');
      this.closeTaskSuccess.emit({
        success: true,
        successIds: [],
        failedReasons: [],
      });
      this.hideModal();
    }
  }


  onSubmit(): void {
    this.submitted = true;
    if (this.closeTaskForm.valid) {
      this.handleCloseTask();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
