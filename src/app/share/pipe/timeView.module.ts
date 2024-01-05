import { NgModule } from '@angular/core';
import { TimeViewPipe } from './timeView.pipe';
// pipe
@NgModule({
  declarations: [TimeViewPipe
  ],
  imports: [
  ],
  exports: [
    TimeViewPipe,
  ]
})
export class PipeTimeViewModule { }
