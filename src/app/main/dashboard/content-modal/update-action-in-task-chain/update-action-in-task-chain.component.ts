import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  EChainNextActType,
  EDelayType,
  ENextStepType,
  IActResult,
  IChainAct,
  IChainActResult,
  IChainNextAction,
} from '@app/types/flow';
import {Subject} from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
  @Input() sourceData?: IChainNextAction;
  @Input() results: IActResult[] = [];
  @Input() blocks: IBlockAutomation[] = [];
  @Input() actionChains: IChainAct[] = [];
  @Input() chainActId?: string;
  @Input() loadingData = {
    results: false,
    blocks: false,
    actionChains: false,
  };

  @Output() updateSuccess = new EventEmitter<any>();

  public nextStepTypes = this.configurationService.nextStepTypes;
  public submitted = false;
  public updateForm = this.fb.group(
    {
      nextAction: [null, [Validators.required]],
      type: [null, [Validators.required]],
      moveToAction: this.fb.group({
        chainActResultId: null,
      }),
      callBlockAutomation: this.fb.group({
        blockId: null,
      }),
      addNewChain: this.fb.group({
        chainActResultId: null,
        chainId: null,
      }),
      delayType: [null, [Validators.required]],
      delayValue: null,
    },
    {validators: [this.allOrNoneRequired]},
  );
  public actionResults: IChainActResult[] = [];

  private destroy$ = new Subject();
  public loading = {
    submit: false,
    data: false,
  };
  protected readonly ENextStepType = ENextStepType;
  protected readonly EDelayType = EDelayType;

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

  allOrNoneRequired(form: FormGroup) {
    const type = form.get('delayType');
    const value = form.get('delayValue');
    if (type?.value !== EDelayType.NOW && !value?.value) {
      value?.setErrors({required: true});
    } else {
      value?.setErrors(null);
    }
    return null;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
      });
    }
    if (this.chainActId) {
      const chainAct = this.actionChains.find(
        (chain) => chain.id === this.chainActId,
      );
      this.actionResults = chainAct?.actionResults || [];
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    this.updateSuccess.emit(this.updateForm.value);
    this.hideModal();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleChangeTypeAction() {
    this.updateForm.patchValue({
      moveToAction: {
        chainActResultId: null,
      },
      callBlockAutomation: {
        blockId: null,
      },
      addNewChain: {
        chainActResultId: null,
        chainId: null,
      },
    });
  }

  handleChangeDelayType() {
    this.updateForm.patchValue({
      delayValue: null,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  protected readonly EChainNextActType = EChainNextActType;
}
