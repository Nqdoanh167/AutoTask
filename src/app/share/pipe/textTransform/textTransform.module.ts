import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TextTransformPipe} from '@share/pipe/textTransform/textTransform.pipe';
@NgModule({
  declarations: [TextTransformPipe],
  imports: [CommonModule],
  exports: [TextTransformPipe],
})
export class TextTransformModule {}
