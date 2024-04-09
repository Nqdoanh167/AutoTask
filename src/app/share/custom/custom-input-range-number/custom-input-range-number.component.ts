import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputMaskModule} from '@share/input/input-mask/input-mask.module';

@Component({
  selector: 'custom-input-range-number',
  standalone: true,
  imports: [CommonModule, InputMaskModule],
  templateUrl: './custom-input-range-number.component.html',
  styleUrls: ['./custom-input-range-number.component.scss'],
})
export class CustomInputRangeNumberComponent implements OnInit {
  @Input() values: number[] = [0, 0];

  @Output() changeValue = new EventEmitter<number[]>();

  protected error = {
    fromTo: false,
  };

  protected valueRangeNumber: number[] = [0, 0];

  constructor() {}

  ngOnInit(): void {
    if (this.values.length === 2) {
      this.valueRangeNumber = this.values;
    }
  }

  handleChangeValueRangeNumber(value: number, number: number) {
    try {
      const arrayValue = [...this.valueRangeNumber];
      arrayValue[number] = value;
      this.error.fromTo = arrayValue[0] > arrayValue[1];
      this.valueRangeNumber = [...arrayValue];
      if (this.error.fromTo) {
        this.changeValue.emit([]);
        return;
      }
      this.changeValue.emit(this.valueRangeNumber);
    } catch (e) {
      console.log(e);
    }
  }

  handleChange(event: any, number: number) {
    const value = event.target.value;
    try {
      const arrayValue = [...this.valueRangeNumber];
      arrayValue[number] = value;
      this.error.fromTo = arrayValue[0] > arrayValue[1];
    } catch (e) {
      console.log(e);
    }
  }
}
