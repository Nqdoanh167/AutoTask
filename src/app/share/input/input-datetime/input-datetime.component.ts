import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BsDropdownDirective} from 'ngx-bootstrap/dropdown';

@Component({
  selector: 'app-input-datetime',
  templateUrl: './input-datetime.component.html',
  styleUrls: ['./input-datetime.component.scss'],
})
export class InputDatetimeComponent implements OnInit {
  @Input() classIcon = 'fas fa-edit';
  @Input() iconSuffix = '';
  @Input() inputType = 'input';
  @Input() classCustomize = '';
  @Input() readonly = false;
  @Input() placeholder = 'Thời gian';
  @Input() value: any = '';
  // tslint:disable-next-line:no-output-native
  @Output() changeEvent = new EventEmitter<Date>();
  datetime = {
    date: new Date(),
    time: new Date(),
  };
  constructor() {}

  ngOnInit(): void {
    if (this.value) {
      this.datetime.date = new Date(this.value);
      this.datetime.time = new Date(this.value);
    }
  }
  setDate({dropdownDate}: {dropdownDate: BsDropdownDirective}) {
    const date = new Date(this.datetime.date);
    const time = new Date(this.datetime.time);
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    this.changeEvent.emit(date);
    dropdownDate.hide();
  }
}
