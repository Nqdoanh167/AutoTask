import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CalculatePercentPipe} from './calculatePercent.pipe';
@NgModule({
  declarations: [CalculatePercentPipe],
  imports: [CommonModule],
  exports: [CalculatePercentPipe],
})
export class CalculatePercentModule {}
