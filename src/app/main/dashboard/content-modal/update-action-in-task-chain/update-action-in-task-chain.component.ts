import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ENextStepType,
  IActReason,
  IActResult,
  IChainAct,
  IPickResultForActionDto,
  ITask,
  ITaskChainResult,
  ITaskDto,
} from '@app/types/flow';
import {finalize, Subject, takeUntil} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AutoTaskService} from '@app/services/api/autoTask.service';
import {CommonService} from '@app/services/common/common.service';
import {AuthService} from '@app/services/api/auth.service';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {IBlockAutomation} from '@app/types/automation';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './update-action-in-task-chain.component.html',
  styleUrls: ['./update-action-in-task-chain.component.scss'],
})
export class UpdateActionInTaskChainComponent implements OnDestroy, OnInit {
  @Input() taskChainId?: string;
  @Input() action?: string;
  @Input() sourceData?: any;
  @Input() results: IActResult[] = [];
  @Input() blocks: IBlockAutomation[] = [];
  @Input() actionChains: IChainAct[] = [];
  @Input() loadingData = {
    results: false,
    blocks: false,
    actionChains: false,
  };

  @Output() updateSuccess = new EventEmitter();

  public nextStepTypes = this.configurationService.nextStepTypes;
  public submitted = false;
  public updateForm = this.fb.group({
    name: ['Task mới', [Validators.required]],
    nextAction: [null, [Validators.required]],
  });

  private destroy$ = new Subject();
  public loading = {
    submit: false,
    data: false,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
    private readonly autoTaskService: AutoTaskService,
    private readonly commonService: CommonService,
    private readonly authService: AuthService,
    private readonly modalService: BsModalService,
    private readonly configurationService: ConfigurationService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    console.log(this.sourceData);
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
      });
    }
  }

  handleUpdate() {
    this.loading.submit = true;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid && !!this.taskChainId) {
      this.handleUpdate();
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  protected readonly ENextStepType = ENextStepType;
}
