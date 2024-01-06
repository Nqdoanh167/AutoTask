import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConvertTypePipe} from '@share/pipe/convertType/convertType.pipe';
@NgModule({
  declarations: [ConvertTypePipe],
  imports: [CommonModule],
  exports: [ConvertTypePipe],
})
export class ConvertTypeModule {}
