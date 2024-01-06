import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DiffTimePipe} from './diffTime.pipe';
@NgModule({
  declarations: [DiffTimePipe],
  imports: [CommonModule],
  exports: [DiffTimePipe],
})
export class DiffTimeModule {}
