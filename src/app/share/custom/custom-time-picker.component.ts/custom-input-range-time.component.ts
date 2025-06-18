import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'custom-input-range-time',
  standalone: true,
  imports: [CommonModule, TimepickerModule, PopoverModule, FormsModule],
  templateUrl: './custom-input-range-time.component.html',
  styleUrls: ['./custom-input-range-time.component.scss'],
})
export class CustomInputRangeTime implements OnInit {
  @Input() values: Date[] = [new Date(), new Date()];
  @Input() showMeridian: boolean = false; // Use 12-hour format if true, 24-hour format if false
  @Input() hourStep: number = 1;
  @Input() minuteStep: number = 30;
  @Input() showMinutes: boolean = true;
  @Input() showSeconds: boolean = false;
  @Input() disabled: boolean = false;

  @Output() changeValue = new EventEmitter<Date[]>();

  protected valueRangeTime: Date[] = [new Date(), new Date()];

  constructor() {}

  ngOnInit(): void {
    if (this.values.length === 2) {
      this.valueRangeTime = [...this.values];
    }
  }

  handleChangeValueRangeTime(value: Date, index: number) {
    try {
      const arrayValue = [...this.valueRangeTime];
      arrayValue[index] = value;
      
      this.valueRangeTime = [...arrayValue];
      
      this.changeValue.emit(this.valueRangeTime);
    } catch (e) {
      console.log(e);
    }
  }

  formatTime(date: Date): string {
    if (!date) return '';
    
    if (this.showMeridian) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; 
      
      const displayHours = hours.toString().padStart(2, '0');
      return `${displayHours}:${minutes} ${ampm}`;
    } else {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  getDisplayValue(): string {
    if (!this.valueRangeTime[0] || !this.valueRangeTime[1]) {
      return '';
    }
    return `${this.formatTime(this.valueRangeTime[0])} - ${this.formatTime(this.valueRangeTime[1])}`;
  }
}