import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GetDataArrayPipe} from './getDataArray.pipe';
@NgModule({
  declarations: [GetDataArrayPipe],
  imports: [CommonModule],
  exports: [GetDataArrayPipe],
})
export class GetDataArrayModule {}
