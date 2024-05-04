import {NgModule} from '@angular/core';
import {SafePipe} from './safeUrl.pipe';
// pipe
@NgModule({
  declarations: [SafePipe],
  imports: [],
  exports: [SafePipe],
})
export class PipeSafeUrlModule {}
