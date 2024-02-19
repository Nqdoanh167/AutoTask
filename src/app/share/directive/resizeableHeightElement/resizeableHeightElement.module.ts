import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ResizeHeightElementDirective} from '@share/directive/resizeableHeightElement/resizeableHeightElement.directive';

@NgModule({
  declarations: [ResizeHeightElementDirective],
  imports: [CommonModule],
  exports: [ResizeHeightElementDirective],
})
export class ResizeHeightElementModule {}
