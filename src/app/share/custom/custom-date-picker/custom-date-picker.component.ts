import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {BsDatepickerConfig, BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {IDateRange} from '@app/types/viewmodels';
import {BsCustomDates} from 'ngx-bootstrap/datepicker/themes/bs/bs-custom-dates-view.component';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'custom-date-picker',
  templateUrl: './custom-date-picker.component.html',
  styleUrls: ['./custom-date-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, BsDatepickerModule, ReactiveFormsModule],
})
export class CustomDatePickerComponent implements OnInit, OnChanges {
  @Input() className = '';
  @Input() typePicker: 'range' | 'single' = 'range';
  @Input() date: IDateRange = {
    fromDate: new Date(),
    toDate: new Date(),
  };
  @Input() dateSingle?: Date;
  @Input() rangeChoose?: BsCustomDates[] | undefined;
  @Input() placeholder = 'Date picker';
  @Output() changeDateEmmit = new EventEmitter<IDateRange | Date>();
  @Input() defaultValue?: Date;
  @Input() defaultRangeValue?: Date[];
  @Input() maxDate?: string | Date | undefined;
  @Input() showClearButton?: boolean = false;
  public bsRangeValue?: Date[] | undefined[] = [];
  public bsValue?: Date;
  private counter = 0;

  constructor() {
    this.bsValue = this.dateSingle;
  }

  public bsConfig?: Partial<BsDatepickerConfig> = {
    dateInputFormat: 'DD-MM-YYYY',
    rangeInputFormat: 'DD-MM-YYYY',
    showWeekNumbers: false,
    clearPosition: 'right',
    ranges: undefined,
  };

  ngOnInit(): void {
    this.bsConfig!.ranges = this.rangeChoose;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultValue']) {
      this.bsValue = changes['defaultValue']?.currentValue
        ? new Date(changes['defaultValue']?.currentValue)
        : undefined;
    }
    if (changes['defaultRangeValue']) {
      this.bsRangeValue = changes['defaultRangeValue']?.currentValue
        ? changes['defaultRangeValue']?.currentValue?.map((date: any) =>
            date ? new Date(date) : undefined,
          )
        : undefined;
    }
    const maxDate = changes['maxDate']?.currentValue;
    if (maxDate) {
      this.bsConfig!.maxDate =
        maxDate !== 'today'
          ? new Date(changes['maxDate']?.currentValue)
          : new Date();
    }
    if (changes['rangeChoose']) {
      this.bsConfig!.ranges = this.rangeChoose;
    }
    if (changes['showClearButton']) {
      this.bsConfig!.showClearButton = this.showClearButton;
    }
  }

  handleChangeDate(value: any) {
    this.counter = this.counter + 1;
    if (this.typePicker === 'range') {
      // if (this.counter >= 2 && value.length != 0) {
      //   const [fromDate, toDate] = value;
      //   this.changeDateEmmit.emit({
      //     fromDate,
      //     toDate,
      //   });
      // }
      if (!value) {
        this.changeDateEmmit.emit(undefined);
        return;
      }
      const [fromDate, toDate] = value;
      this.changeDateEmmit.emit({
        fromDate,
        toDate,
      });
    } else {
      if (this.counter >= 2 && value.length != 0) {
        this.changeDateEmmit.emit(value);
      }
    }
  }
}
