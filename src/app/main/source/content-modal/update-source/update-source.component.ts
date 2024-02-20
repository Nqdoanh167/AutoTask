import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss'],
})
export class UpdateSourceComponent implements OnDestroy, OnInit {
  @Input() sourceData?: any;
  @Output() updateSuccess = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  public submitted = false;
  public updateForm = this.fb.group({
    name: [null, [Validators.required]],
    type: null,
  });
  constructor(
    private readonly fb: FormBuilder,
    private readonly modalRef: BsModalRef,
  ) {}

  get f(): {[key: string]: AbstractControl} {
    return this.updateForm.controls;
  }

  onDelete() {
    this.deleteEvent.emit();
    this.hideModal();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  handleUpdate() {}

  onSubmit(): void {
    this.submitted = true;
    if (this.updateForm.valid) {
      this.handleUpdate();
    }
  }

  ngOnInit(): void {}
  ngOnDestroy() {}
}
