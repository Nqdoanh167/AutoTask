import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {CommonService} from '@app/services/common/common.service';
import {User} from '@app/types/viewmodels';

@Component({
  selector: 'app-modal-employee-info',
  templateUrl: './modal-employee-info.component.html',
  styleUrls: ['./modal-employee-info.component.scss'],
})
export class ModalEmployeeInfoComponent implements OnDestroy, OnInit {
  @Input() sourceData?: User;
  @Output() updateSuccess = new EventEmitter();

  public updateForm = this.fb.group({
    name: [null],
    email: [null],
    groups: [null],
    roles: [null],
    branches: [null],
    status: [null],
  });
  public submitted = false;
  public loading = {
    submit: false,
    data: false,
  };
  private destroy$ = new Subject();
  constructor(
    private readonly modalService: BsModalService,
    private readonly commonService: CommonService,
    private readonly modalRef: BsModalRef,
    private readonly fb: FormBuilder,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  ngOnInit() {
    if (this.sourceData) {
      this.updateForm.patchValue({
        ...this.sourceData,
      } as any);
    }
  }

  handleUpdate() {}

  hideModal(): void {
    this.modalRef.hide();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  compareFunction(item: any, selected: any) {
    return item.id === selected.id;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
