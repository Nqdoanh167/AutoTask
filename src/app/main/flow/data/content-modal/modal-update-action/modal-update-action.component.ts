import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-modal-update-action',
  templateUrl: './modal-update-action.component.html',
  styleUrls: ['./modal-update-action.component.scss'],
})
export class ModalUpdateActionComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
  @Output() updateSuccess = new EventEmitter();
  private destroy$ = new Subject();
  public submitted = false;
  public updateForm = this.fb.group({
    displayName: [null, [Validators.required, Validators.maxLength(255)]],
    isManualGroup: [false],
  });
  public loading = {
    submit: false,
    data: false,
  };

  constructor(
    private readonly modalService: BsModalService,
    private readonly toastr: ToastrService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit(): void {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...(this.sourceData as any),
        isHidden: false,
      });
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

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
