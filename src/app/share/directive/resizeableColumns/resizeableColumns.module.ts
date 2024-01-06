import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ResizeColumnDirective} from '@share/directive/resizeableColumns/resizeableColumns.directive';

@NgModule({
  declarations: [ResizeColumnDirective],
  imports: [CommonModule],
  exports: [ResizeColumnDirective],
})
export class ResizeColumnModule {}
