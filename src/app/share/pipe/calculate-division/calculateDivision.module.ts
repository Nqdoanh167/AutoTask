import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CalculateDivisionPipe} from './calculateDivision.pipe';
@NgModule({
  declarations: [CalculateDivisionPipe],
  imports: [CommonModule],
  exports: [CalculateDivisionPipe],
})
export class CalculateDivisionModule {}
