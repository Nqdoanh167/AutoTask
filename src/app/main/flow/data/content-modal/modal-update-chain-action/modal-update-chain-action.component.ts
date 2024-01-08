import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';
import {ConfigurationService} from '@app/services/api/configuration.service';

@Component({
  selector: 'app-modal-update-chain-action',
  templateUrl: './modal-update-chain-action.component.html',
  styleUrls: ['./modal-update-chain-action.component.scss'],
})
export class ModalUpdateChainActionComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
  @Output() updateSuccess = new EventEmitter();
  private destroy$ = new Subject();

  public submitted = false;
  public updateForm = this.fb.group({
    displayName: [null, [Validators.required, Validators.maxLength(255)]],
    actions: this.fb.array([]),
  });
  public loading = {
    submit: false,
    data: false,
  };
  public actions = [];

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
    private readonly configurationService: ConfigurationService,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  get formActions() {
    return <FormArray>this.updateForm.get('actions');
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
        isHidden: false,
      });
    } else {
      this.addActions();
    }
  }

  handleUpdate() {
    this.loading.submit = true;
    const body = {
      ...this.updateForm.value,
      conditions: [],
      isHidden: false,
    } as unknown as any;
    if (this.sourceData?.id) {
      this.hideModal();
    } else {
      this.hideModal();
    }
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

  addActions() {
    try {
      this.formActions.push(
        this.fb.group({
          value: [null, [Validators.required]],
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }

  removeAction(index: number) {
    if (this.formActions.value.length <= 1) {
      this.toastr.warning('Tối thiểu 1 Hành động!');
      return;
    }
    this.formActions.removeAt(index);
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
