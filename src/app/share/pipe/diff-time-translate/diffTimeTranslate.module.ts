import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DiffTimeTranslatePipe} from './diffTimeTranslate.pipe';

@NgModule({
  declarations: [DiffTimeTranslatePipe],
  imports: [CommonModule],
  exports: [DiffTimeTranslatePipe],
})
export class DiffTimeTranslateModule {}
