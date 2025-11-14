import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {listColumns} from '@app/variable';
import {uniq} from 'lodash';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {IColumns, IDataColumns} from 'src/app/types/viewmodels';

@Component({
  selector: 'app-orderable-table',
  templateUrl: './orderable-table.component.html',
  styleUrls: ['./orderable-table.component.scss'],
})
export class OrderableTableComponent implements OnInit {
  @Input() typeColumn!: string;
  @Output() triggerColumnChange = new EventEmitter<IColumns[]>();
  public isSubmitting: boolean = false;
  public form!: FormGroup;
  public submitted: boolean = false;
  public listColumns!: IColumns[];
  public listColumnsActive!: IColumns[];
  public listChecked: string[] = [];
  constructor(
    private modalRef: BsModalRef,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      checkArray: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    const defaultListCl = listColumns[this.typeColumn as keyof IDataColumns] || [];
    this.listColumns = defaultListCl;
    this.listColumnsActive = defaultListCl;
    const data = JSON.parse(localStorage.getItem(this.typeColumn) as string);

    this.listColumnsActive = [...data];
    this.listChecked = data.map((el: IColumns) => el.value) ?? [];
    const checkArray: FormArray = this.form.get('checkArray') as FormArray;
    this.listChecked.map((el) => {
      checkArray.push(new FormControl(el));
    });
  }
  get f(): {[key: string]: AbstractControl} {
    return this.form.controls;
  }

  onCheckboxChange(e: any) {
    const checkArray: FormArray = this.form.get('checkArray') as FormArray;
    if (e.target.checked) {
      let i = this.listColumns.findIndex((el) => el.value === e.target.value);
      checkArray.insert(i, new FormControl(e.target.value));
      const currentData = [...this.listColumnsActive];
      currentData.splice(i, 0, this.listColumns[i]);
      this.listColumnsActive = [...currentData];
    } else {
      let i: number = 0;
      checkArray.controls.forEach((item: any) => {
        if (item.value == e.target.value) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
      this.listColumnsActive = this.listColumnsActive.filter(
        (el) => el.value !== e.target.value,
      );
    }
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  onReload() {
    this.listChecked = [...this.listColumns.map((el) => el.value)];
    const checkArray: FormArray = this.form.get('checkArray') as FormArray;
    checkArray.clear();
    this.listChecked.forEach((el) => {
      checkArray.push(new FormControl(el));
    });
    this.listColumnsActive = [...this.listColumns];
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.valid) {
      const listColumns = uniq([...this.form.value.checkArray]);
      const sequenceColumns = this.listColumnsActive.filter((el) =>
        listColumns.includes(el.value),
      );
      localStorage.setItem(this.typeColumn, JSON.stringify(sequenceColumns));
      this.hideModal();
      this.triggerColumnChange.emit(sequenceColumns);
    }
  }
}
