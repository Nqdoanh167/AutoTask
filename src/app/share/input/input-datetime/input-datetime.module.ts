import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputDatetimeComponent } from './input-datetime.component';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';



@NgModule({
  declarations: [InputDatetimeComponent],
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot()
  ],
  exports: [InputDatetimeComponent]
})
export class InputDatetimeModule { }
