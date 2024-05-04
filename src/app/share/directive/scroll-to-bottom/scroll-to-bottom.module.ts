import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScrollToBottomDirective} from './scroll-to-bottom.directive';

@NgModule({
  declarations: [ScrollToBottomDirective],
  imports: [CommonModule],
  exports: [ScrollToBottomDirective],
})
export class ScrollToBottomModule {}
