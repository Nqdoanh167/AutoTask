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
  EOptionCloneTask,
  IAction,
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
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ConfigurationService} from '@app/services/api/configuration.service';
import {IBlockAutomation} from '@app/types/automation';
import {removeCharacter} from '@app/utils/common';
import {optionToCloneTask} from '@app/variable';

@Component({
  selector: 'app-modal-update-task',
  templateUrl: './update-action-in-task-chain.component.html',
  styleUrls: ['./update-action-in-task-chain.component.scss'],
})
export class UpdateActionInTaskChainComponent implements OnDestroy, OnInit {
  @Input() actionOfChain?: IAction;
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
  @Output() deleteEvent = new EventEmitter<any>();
  public optionToCloneTask = optionToCloneTask;
  public nextStepTypes = this.configurationService.nextStepTypes;
  public submitted = false;
  public updateForm = this.fb.group(
    {
      nextAction: [null, [Validators.required]],
      type: [EChainNextActType.AUTO, [Validators.required]],
      moveToAction: this.fb.group({
        chainActResultId: null,
        chainActResult: null,
      }),
      callBlockAutomation: this.fb.group({
        blockId: null,
      }),
      closeCloneTask: [null],
      addNewChain: this.fb.group({
        chainActResultId: null,
        chainActResult: null,
        chainId: null,
        chain: null,
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
    private readonly configurationService: ConfigurationService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  allOrNoneRequired(form: FormGroup) {
    const nextAction = form.get('nextAction');
    const type = form.get('delayType');
    const value = form.get('delayValue');
    if (type?.value !== EDelayType.NOW && !value?.value) {
      value?.setErrors({required: true});
    } else {
      value?.setErrors(null);
    }
    if (nextAction?.value === ENextStepType.CONTINUE_TO_NEXT_ACTION) {
      const moveToAction = form.get('moveToAction');
      if (!moveToAction?.value?.chainActResultId) {
        moveToAction?.setErrors({required: true});
      } else {
        moveToAction?.setErrors(null);
      }
    }
    if (nextAction?.value === ENextStepType.ADD_CHAIN) {
      const addNewChain = form.get('addNewChain');
      if (!addNewChain?.value?.chainId) {
        addNewChain?.setErrors({required: true});
      } else {
        addNewChain?.setErrors(null);
      }
    }
    if (nextAction?.value === ENextStepType.CALL_BLOCK_AUTOMATION) {
      const callBlockAutomation = form.get('callBlockAutomation');
      if (!callBlockAutomation?.value?.blockId) {
        callBlockAutomation?.setErrors({required: true});
      } else {
        callBlockAutomation?.setErrors(null);
      }
    }
    if (nextAction?.value === ENextStepType.CLOSE_CHAIN_AND_CLONE_TASK) {
      const closeCloneTask = form.get('closeCloneTask');
      if (!closeCloneTask?.value?.length) {
        closeCloneTask?.setErrors({required: true});
      } else {
        closeCloneTask?.setErrors(null);
      }
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
      this.actionResults =
        chainAct?.actionResults?.filter(
          (actionResult) => actionResult.action?.id !== this.actionOfChain?.id,
        ) || [];
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

  onDelete() {
    this.deleteEvent.emit();
    this.hideModal();
  }

  handleChangeTypeAction(event: any) {
    let optionClone: string[] = [];
    if (event?.value === ENextStepType.CLOSE_CHAIN_AND_CLONE_TASK) {
      optionClone = Object.values(EOptionCloneTask);
    }
    this.updateForm.patchValue({
      moveToAction: {
        chainActResultId: null,
        chainActResult: null,
      },
      callBlockAutomation: {
        blockId: null,
      },

      closeCloneTask: optionClone,
      addNewChain: {
        chainActResultId: null,
        chainActResult: null,
        chainId: null,
        chain: null,
      },
    });
  }

  handleChangeDelayType() {
    this.updateForm.patchValue({
      delayValue: null,
    });
  }

  handleChangeNextActionInChain(chainActResult: IChainActResult) {
    this.updateForm.patchValue({
      moveToAction: {
        chainActResultId: chainActResult.id,
        chainActResult: chainActResult,
      },
    });
  }

  handleChangeNextActionInNewChain(chainAct: IChainActResult) {
    const selectedChain = this.actionChains.find(
      (actionChain) => actionChain.id === chainAct.chainActId,
    );
    this.updateForm.patchValue({
      addNewChain: {
        chainActResultId: chainAct.id,
        chainId: selectedChain?.id,
        chainActResult: chainAct,
        chain: selectedChain,
      },
    });
  }

  customSearchFn(term: string, item: any) {
    term = removeCharacter(term).toLocaleLowerCase().replace(/[ ]+/, ' ');
    return (
      removeCharacter(item?.action?.name)
        .toLocaleLowerCase()
        .indexOf(term) > -1
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
