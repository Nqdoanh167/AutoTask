import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormatSecondsPipe} from './format-seconds.pipe';
@NgModule({
  declarations: [FormatSecondsPipe],
  imports: [CommonModule],
  exports: [FormatSecondsPipe],
})
export class FormatSecondsModule {}
